"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { segel, buka, type IsiAnak } from "@/lib/brankas";
import { wajibUser } from "@/lib/sesi";
import { binaanIds } from "@/lib/anak";
import { DOSIS_REGISTRY, VARIAN_MEREK } from "@/lib/vaksin";

/** Semua kode input dosis yang sah (kode slot + seluruh varian merek). */
const KODE_SAH = new Set<string>([
  ...DOSIS_REGISTRY.map((d) => d.kode),
  ...Object.values(VARIAN_MEREK).flat().map((v) => v.kode),
]);

function galatKe(url: string, pesan: string): never {
  redirect(`${url}?galat=${encodeURIComponent(pesan)}`);
}

/** Baca + validasi field anak dari FormData (dipakai form kader & ortu). Dosis: name
 *  "vaksin__<KODE>". Melempar redirect ke `balik` bila ada input tidak valid. */
function bacaFormAnak(formData: FormData, balik: string): { isi: IsiAnak; posyanduId: number } {
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
    if (Number.isNaN(Date.parse(tgl))) galatKe(balik, `Tanggal ${kode} tidak valid.`);
    if (Date.parse(tgl) < Date.parse(tglLahir)) galatKe(balik, `Tanggal ${kode} mendahului tanggal lahir.`);
    vaksin[kode] = tgl;
  }

  return { isi: { nama, tglLahir, jk, namaOrtu, nik, noHp, alamat, rtRw, vaksin }, posyanduId };
}

/** Simpan (buat/edit) anak baru dari form kader. Dosis: input name "vaksin__<KODE>". */
export async function simpanAnakBaru(formData: FormData): Promise<void> {
  const user = await wajibUser("KADER", "ADMIN");
  const idEdit = Number(formData.get("id") ?? 0) || 0;
  const balik = idEdit ? `/kader/anak-baru?ref=b:${idEdit}` : "/kader/anak-baru";
  const { isi, posyanduId } = bacaFormAnak(formData, balik);

  const ids = await binaanIds(user);
  if (!ids.includes(posyanduId)) galatKe(balik, "Posyandu di luar binaan Anda.");
  const tersegel = segel(isi);

  if (idEdit) {
    const ada = await db.anakBaru.findUnique({ where: { id: idEdit } });
    if (!ada || !ids.includes(ada.posyanduId)) galatKe("/kader/daftar-bayi", "Anak tidak ditemukan.");
    if (ada.status === "MASUK_SIMPUS") galatKe(`/kader/anak/b:${idEdit}`, "Sudah masuk SIMPUS — edit di SIMPUS.");
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

/** Simpan anak baru yang diinput SENDIRI oleh orang tua. Ditandai olehOrtu + belum
 *  terverifikasi (menunggu kader), lalu OTOMATIS diklaim ke ortu (tanpa QR). */
export async function simpanAnakOrtu(formData: FormData): Promise<void> {
  const user = await wajibUser("ORTU");
  const balik = "/ortu/anak-baru";
  const { isi, posyanduId } = bacaFormAnak(formData, balik);

  const pos = await db.posyandu.findUnique({ where: { id: posyanduId } });
  if (!pos) galatKe(balik, "Pilih posyandu.");
  const tersegel = segel(isi);

  const row = await db.anakBaru.create({
    data: { posyanduId, ...tersegel, dibuatOlehId: user.id, olehOrtu: true, terverifikasi: false },
  });
  await db.klaimAnak.create({ data: { userId: user.id, anakBaruId: row.id } });
  await db.logAktivitas.create({ data: { userId: user.id, aksi: "ANAK_DIINPUT_ORTU", detail: `b:${row.id}` } });
  redirect(`/ortu/anak/b:${row.id}`);
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
