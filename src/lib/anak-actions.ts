"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { segel, buka, type IsiAnak } from "@/lib/brankas";
import { wajibUser } from "@/lib/sesi";
import { binaanIds } from "@/lib/anak";
import { DOSIS_REGISTRY, VARIAN_MEREK, namaKode, validasiDosis } from "@/lib/vaksin";

/** Semua kode input dosis yang sah (kode slot + seluruh varian merek). */
const KODE_SAH = new Set<string>([
  ...DOSIS_REGISTRY.map((d) => d.kode),
  ...Object.values(VARIAN_MEREK).flat().map((v) => v.kode),
]);

function galatKe(url: string, pesan: string): never {
  redirect(`${url}?galat=${encodeURIComponent(pesan)}`);
}

/** Baca + validasi field anak dari FormData (dipakai form kader & ortu). Dosis: name
 *  "vaksin__<KODE>". Melempar redirect ke `balik` bila ada input tidak valid.
 *  `vaksinLama` (mode edit) = dosis tersimpan: nilai yang tak berubah lolos tanpa
 *  cek aturan ulang — lihat validasiDosis. */
function bacaFormAnak(
  formData: FormData,
  balik: string,
  vaksinLama: Record<string, string> = {},
): { isi: IsiAnak; posyanduId: number } {
  const nama = String(formData.get("nama") ?? "").trim();
  const tglLahir = String(formData.get("tglLahir") ?? "").trim();
  const jk = String(formData.get("jk") ?? "");
  const posyanduId = Number(formData.get("posyanduId") ?? 0);
  const namaOrtu = String(formData.get("namaOrtu") ?? "").trim();
  const nik = String(formData.get("nik") ?? "").replace(/\D/g, "");
  const noHp = String(formData.get("noHp") ?? "").trim();
  const alamat = String(formData.get("alamat") ?? "").trim();
  const rtRw = String(formData.get("rtRw") ?? "").trim();

  if (nama.length < 2) galatKe(balik, "Nama anak wajib diisi.");
  if (Number.isNaN(Date.parse(tglLahir))) galatKe(balik, "Tanggal lahir tidak valid.");
  if (jk !== "L" && jk !== "P") galatKe(balik, "Pilih jenis kelamin.");
  if (nik && !/^\d{16}$/.test(nik)) galatKe(balik, "NIK harus 16 digit angka (atau kosongkan).");

  // kumpulkan dosis vaksin__<KODE> (hanya kode sah & tanggal valid ≥ lahir)
  const vaksin: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (!k.startsWith("vaksin__")) continue;
    const kode = k.slice(8);
    const tgl = String(v).trim();
    if (!tgl) continue;
    if (!KODE_SAH.has(kode)) continue;
    if (Number.isNaN(Date.parse(tgl))) galatKe(balik, `Tanggal ${namaKode(kode)} tidak valid.`);
    if (Date.parse(tgl) < Date.parse(tglLahir)) galatKe(balik, `Tanggal ${namaKode(kode)} mendahului tanggal lahir.`);
    vaksin[kode] = tgl;
  }

  // urutan seri & jendela usia (min/max + interval antar dosis) — dicek setelah semua
  // dosis submit ini terkumpul, supaya interval antar-input dalam satu submit ikut tervalidasi
  const galatDosis = validasiDosis(vaksin, tglLahir, vaksinLama);
  if (galatDosis) galatKe(balik, galatDosis);

  return { isi: { nama, tglLahir, jk, namaOrtu, nik, noHp, alamat, rtRw, vaksin }, posyanduId };
}

/** Simpan (buat/edit) anak baru dari form kader. Dosis: input name "vaksin__<KODE>". */
export async function simpanAnakBaru(formData: FormData): Promise<void> {
  const user = await wajibUser("KADER", "ADMIN");
  const idEdit = Number(formData.get("id") ?? 0) || 0;
  const balik = idEdit ? `/kader/anak-baru?ref=b:${idEdit}` : "/kader/anak-baru";
  const ids = await binaanIds(user);

  // mode edit: ambil row lama DULU (cek kepemilikan+status) supaya dosis tersimpan yang
  // tak berubah lolos validasi aturan baru ("grandfather") — form edit selalu men-submit
  // ulang semua tanggal lama, jangan sampai edit alamat/no HP gagal gara-gara dosis lama.
  let vaksinLama: Record<string, string> = {};
  if (idEdit) {
    const ada = await db.anakBaru.findUnique({ where: { id: idEdit } });
    if (!ada || !ids.includes(ada.posyanduId)) galatKe("/kader/daftar-bayi", "Anak tidak ditemukan.");
    if (ada.status === "MASUK_SIMPUS") galatKe(`/kader/anak/b:${idEdit}`, "Sudah masuk SIMPUS — edit di SIMPUS.");
    try {
      vaksinLama = buka<IsiAnak>({ iv: ada.iv, tag: ada.tag, data: ada.data }).vaksin ?? {};
    } catch {
      // dekripsi gagal → tanpa grandfather, validasi penuh
    }
  }

  const { isi, posyanduId } = bacaFormAnak(formData, balik, vaksinLama);
  if (!ids.includes(posyanduId)) galatKe(balik, "Posyandu di luar binaan Anda.");
  const tersegel = segel(isi);

  if (idEdit) {
    await db.anakBaru.update({ where: { id: idEdit }, data: { posyanduId, ...tersegel } });
    await db.logAktivitas.create({ data: { userId: user.id, aksi: "ANAK_DIEDIT", detail: `b:${idEdit}` } });
    redirect(`/kader/anak/b:${idEdit}`);
  }

  const row = await db.anakBaru.create({
    data: { posyanduId, ...tersegel, dibuatOlehId: user.id },
  });
  await db.logAktivitas.create({ data: { userId: user.id, aksi: "ANAK_DIDAFTARKAN", detail: `b:${row.id}` } });
  redirect(`/kader/anak/b:${row.id}`);
}

/** Simpan (buat/edit) anak yang diinput SENDIRI oleh orang tua. Tanpa "id" → perilaku
 *  create seperti semula: ditandai olehOrtu + belum terverifikasi (menunggu kader), lalu
 *  OTOMATIS diklaim ke ortu (tanpa QR). Dengan "id" → edit anak miliknya sendiri yang
 *  masih DRAF (pola sama simpanAnakBaru cabang edit: ambil row lama dulu → vaksinLama
 *  utk grandfather, baru bacaFormAnak). */
export async function simpanAnakOrtu(formData: FormData): Promise<void> {
  const user = await wajibUser("ORTU");
  const idEdit = Number(formData.get("id") ?? 0) || 0;
  const balik = idEdit ? `/ortu/anak-baru?ref=b:${idEdit}` : "/ortu/anak-baru";

  let vaksinLama: Record<string, string> = {};
  if (idEdit) {
    const milik = await db.klaimAnak.findFirst({ where: { userId: user.id, anakBaruId: idEdit }, include: { anakBaru: true } });
    const ada = milik?.anakBaru;
    if (!ada || !ada.olehOrtu) galatKe("/ortu/anakku", "Anak tidak ditemukan.");
    if (ada.status !== "DRAF") galatKe(`/ortu/anak/b:${idEdit}`, "Sudah disetor ke SIMPUS — minta kader untuk mengubahnya.");
    try {
      vaksinLama = buka<IsiAnak>({ iv: ada.iv, tag: ada.tag, data: ada.data }).vaksin ?? {};
    } catch {
      // dekripsi gagal → tanpa grandfather, validasi penuh
    }
  }

  const { isi, posyanduId } = bacaFormAnak(formData, balik, vaksinLama);

  const pos = await db.posyandu.findUnique({ where: { id: posyanduId } });
  if (!pos) galatKe(balik, "Pilih posyandu.");
  // identitas ortu dikunci dari akun (bukan isian bebas); domisili terisi sekali dari pilihan pertama
  isi.namaOrtu = user.nama;
  const akun = await db.user.findUnique({ where: { id: user.id }, select: { kelurahanId: true, noHp: true } });
  if (!isi.noHp) isi.noHp = akun?.noHp || user.username;
  if (akun && akun.kelurahanId == null) {
    await db.user.update({ where: { id: user.id }, data: { kelurahanId: pos.kelurahanId } });
  }
  const tersegel = segel(isi);

  if (idEdit) {
    await db.anakBaru.update({ where: { id: idEdit }, data: { posyanduId, ...tersegel } });
    await db.logAktivitas.create({ data: { userId: user.id, aksi: "ANAK_DIEDIT_ORTU", detail: `b:${idEdit}` } });
    redirect(`/ortu/anak/b:${idEdit}`);
  }

  // create + klaim digabung (nested) — hemat satu bolak-balik DB per submit
  const row = await db.anakBaru.create({
    data: {
      posyanduId, ...tersegel, dibuatOlehId: user.id, olehOrtu: true, terverifikasi: false,
      klaim: { create: { userId: user.id } },
    },
  });
  await db.logAktivitas.create({ data: { userId: user.id, aksi: "ANAK_DIINPUT_ORTU", detail: `b:${row.id}` } });
  redirect(`/ortu/anak/b:${row.id}`);
}

/** Ortu menghapus anak yang DIA daftarkan sendiri (masih DRAF — belum pernah diekspor).
 *  Cek kepemilikan lewat klaim; relasi klaim/tumbuh/centang ikut terhapus (cascade). */
export async function hapusAnakOrtu(formData: FormData): Promise<void> {
  const user = await wajibUser("ORTU");
  const id = Number(formData.get("id") ?? 0);
  const milik = await db.klaimAnak.findFirst({
    where: { userId: user.id, anakBaruId: id },
    include: { anakBaru: true },
  });
  const anak = milik?.anakBaru;
  if (!anak || !anak.olehOrtu) redirect("/ortu/anakku");
  if (anak.status !== "DRAF") {
    redirect(`/ortu/anak/b:${id}?galat=${encodeURIComponent("Sudah disetor ke SIMPUS — minta kader untuk mengubahnya.")}`);
  }
  await db.anakBaru.delete({ where: { id } });
  await db.logAktivitas.create({ data: { userId: user.id, aksi: "ANAK_DIHAPUS_ORTU", detail: `b:${id}` } });
  redirect("/ortu/anakku");
}

/** Kader/admin memverifikasi anak yang diinput orang tua → boleh ikut export SIMPUS. */
export async function verifikasiAnak(formData: FormData): Promise<void> {
  const user = await wajibUser("KADER", "ADMIN");
  const id = Number(formData.get("id") ?? 0);
  const ada = await db.anakBaru.findUnique({ where: { id } });
  const ids = await binaanIds(user);
  if (!ada || !ids.includes(ada.posyanduId)) redirect("/kader/daftar-bayi");
  await db.anakBaru.update({ where: { id }, data: { terverifikasi: true } });
  await db.logAktivitas.create({ data: { userId: user.id, aksi: "ANAK_DIVERIFIKASI", detail: `b:${id}` } });
  redirect(`/kader/anak/b:${id}`);
}

/** Kader/admin membatalkan status setor (DIEKSPOR → DRAF) — untuk anak yang keliru
 *  ikut export (mis. data uji) supaya bisa diedit/dihapus lagi. */
export async function batalkanSetor(formData: FormData): Promise<void> {
  const user = await wajibUser("KADER", "ADMIN");
  const id = Number(formData.get("id") ?? 0);
  const ada = await db.anakBaru.findUnique({ where: { id } });
  const ids = await binaanIds(user);
  if (!ada || !ids.includes(ada.posyanduId)) redirect("/kader/daftar-bayi");
  if (ada.status !== "DIEKSPOR") {
    redirect(`/kader/anak/b:${id}?galat=${encodeURIComponent("Hanya anak berstatus 'sudah disetor' yang bisa dibatalkan.")}`);
  }
  await db.anakBaru.update({ where: { id }, data: { status: "DRAF" } });
  await db.logAktivitas.create({ data: { userId: user.id, aksi: "SETOR_DIBATALKAN", detail: `b:${id}` } });
  redirect(`/kader/anak/b:${id}`);
}

/** Hapus anak baru (hanya bila belum pernah diekspor). */
export async function hapusAnakBaru(formData: FormData): Promise<void> {
  const user = await wajibUser("KADER", "ADMIN");
  const id = Number(formData.get("id") ?? 0);
  const ada = await db.anakBaru.findUnique({ where: { id } });
  const ids = await binaanIds(user);
  if (!ada || !ids.includes(ada.posyanduId)) redirect("/kader/daftar-bayi");
  if (ada.status !== "DRAF") {
    redirect(`/kader/anak/b:${id}?galat=${encodeURIComponent("Sudah diekspor — tidak bisa dihapus.")}`);
  }
  await db.anakBaru.delete({ where: { id } });
  await db.logAktivitas.create({ data: { userId: user.id, aksi: "ANAK_DIHAPUS", detail: `b:${id}` } });
  redirect("/kader/daftar-bayi");
}

/** Isi anak-baru untuk mode edit (dipanggil page — bukan action, tapi satu rumah). */
export async function isiUntukEdit(id: number): Promise<(IsiAnak & { posyanduId: number }) | null> {
  const user = await wajibUser("KADER", "ADMIN");
  const ids = await binaanIds(user);
  const a = await db.anakBaru.findUnique({ where: { id } });
  if (!a || !ids.includes(a.posyanduId)) return null;
  try {
    return { ...buka<IsiAnak>({ iv: a.iv, tag: a.tag, data: a.data }), posyanduId: a.posyanduId };
  } catch {
    return null;
  }
}

/** Isi anak-baru untuk mode edit oleh ORTU — hanya anak miliknya sendiri (klaim), yang ia
 *  input sendiri (olehOrtu) dan masih DRAF (pola sama isiUntukEdit). */
export async function isiUntukEditOrtu(id: number): Promise<(IsiAnak & { posyanduId: number }) | null> {
  const user = await wajibUser("ORTU");
  const milik = await db.klaimAnak.findFirst({ where: { userId: user.id, anakBaruId: id }, include: { anakBaru: true } });
  const a = milik?.anakBaru;
  if (!a || !a.olehOrtu || a.status !== "DRAF") return null;
  try {
    return { ...buka<IsiAnak>({ iv: a.iv, tag: a.tag, data: a.data }), posyanduId: a.posyanduId };
  } catch {
    return null;
  }
}
