"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { wajibUser } from "@/lib/sesi";
import { ambilAnak } from "@/lib/anak";
import { ambilAnakOrtu } from "@/lib/ortu";
import { DOSIS_REGISTRY, adaDosis, validasiDosis } from "@/lib/vaksin";

function refKe(ref: string): { anakSimpusId: number | null; anakBaruId: number | null } | null {
  const m = /^([sb]):(\d+)$/.exec(ref);
  if (!m) return null;
  return {
    anakSimpusId: m[1] === "s" ? Number(m[2]) : null,
    anakBaruId: m[1] === "b" ? Number(m[2]) : null,
  };
}

/** ORTU: tandai satu dosis "sudah diberikan di faskes lain" (kuning — menunggu verifikasi kader). */
export async function tandaiOrtu(formData: FormData): Promise<void> {
  const user = await wajibUser("ORTU", "ADMIN");
  const ref = String(formData.get("ref") ?? "");
  const kode = String(formData.get("kode") ?? "");
  const tgl = String(formData.get("tgl") ?? "").trim();
  const lokasi = String(formData.get("lokasi") ?? "").trim();
  const balik = `/ortu/anak/${ref}`;

  const anak = await ambilAnakOrtu(ref, user);
  if (!anak) redirect("/ortu/anakku");
  if (!DOSIS_REGISTRY.some((d) => d.kode === kode)) redirect(balik);
  if (adaDosis(anak.isi.vaksin, kode)) redirect(balik); // sudah resmi — tak perlu centang
  if (Number.isNaN(Date.parse(tgl)) || Date.parse(tgl) < Date.parse(anak.isi.tglLahir)) {
    redirect(balik + "?galat=" + encodeURIComponent("Tanggal centang tidak valid."));
  }
  // validasi kode centang thd aturan dosis — dosis resmi lama di-grandfather (hanya
  // kode yang baru dicentang yang dicek: urutan seri + jendela min/max + interval)
  const galat = validasiDosis({ ...anak.isi.vaksin, [kode]: tgl }, anak.isi.tglLahir, anak.isi.vaksin);
  if (galat) redirect(balik + "?galat=" + encodeURIComponent(galat));

  const tempat = refKe(ref)!;
  const ada = await db.centangOrtu.findFirst({ where: { ...tempat, vaksinKode: kode } });
  if (ada) {
    await db.centangOrtu.update({
      where: { id: ada.id },
      data: { tgl, lokasi, verified: false, verifikatorId: null, dibuatOlehId: user.id },
    });
  } else {
    await db.centangOrtu.create({
      data: { ...tempat, vaksinKode: kode, tgl, lokasi, dibuatOlehId: user.id },
    });
  }
  await db.logAktivitas.create({ data: { userId: user.id, aksi: "CENTANG_ORTU", detail: `${ref} ${kode}` } });
  redirect(balik);
}

/** ORTU: hapus centang miliknya sendiri — hanya yang BELUM diverifikasi kader
 *  (sekali diverifikasi, ortu tak bisa lagi ubah/hapus). */
export async function hapusCentangOrtu(formData: FormData): Promise<void> {
  const user = await wajibUser("ORTU", "ADMIN");
  const id = Number(formData.get("id") ?? 0);
  const row = await db.centangOrtu.findUnique({ where: { id } });
  if (!row) redirect("/ortu/anakku");

  const ref = row.anakSimpusId ? `s:${row.anakSimpusId}` : `b:${row.anakBaruId}`;
  const anak = await ambilAnakOrtu(ref, user); // cek kepemilikan
  if (!anak) redirect("/ortu/anakku");
  if (row.verified) redirect(`/ortu/anak/${ref}`); // sudah diverifikasi — tak bisa dihapus ortu

  await db.centangOrtu.delete({ where: { id } });
  await db.logAktivitas.create({ data: { userId: user.id, aksi: "CENTANG_DIHAPUS_ORTU", detail: `${ref} ${row.vaksinKode}` } });
  redirect(`/ortu/anak/${ref}`);
}

/** KADER: verifikasi (biru) atau tolak (hapus) centang orang tua. */
export async function verifikasiCentang(formData: FormData): Promise<void> {
  const user = await wajibUser("KADER", "ADMIN");
  const id = Number(formData.get("id") ?? 0);
  const aksi = String(formData.get("aksi") ?? "");
  const row = await db.centangOrtu.findUnique({ where: { id } });
  if (!row) redirect("/kader/daftar-bayi");

  const ref = row.anakSimpusId ? `s:${row.anakSimpusId}` : `b:${row.anakBaruId}`;
  const anak = await ambilAnak(ref, user); // cek scope binaan
  if (!anak) redirect("/kader/daftar-bayi");

  if (aksi === "terima") {
    await db.centangOrtu.update({ where: { id }, data: { verified: true, verifikatorId: user.id } });
    await db.logAktivitas.create({ data: { userId: user.id, aksi: "CENTANG_DIVERIFIKASI", detail: `${ref} ${row.vaksinKode}` } });
  } else {
    await db.centangOrtu.delete({ where: { id } });
    await db.logAktivitas.create({ data: { userId: user.id, aksi: "CENTANG_DITOLAK", detail: `${ref} ${row.vaksinKode}` } });
  }
  redirect(`/kader/anak/${ref}`);
}

/** Daftar centang satu anak (map kode → data). Panggil setelah akses anak tervalidasi. */
export async function daftarCentang(ref: string) {
  const tempat = refKe(ref);
  if (!tempat) return [];
  return db.centangOrtu.findMany({
    where: tempat.anakSimpusId ? { anakSimpusId: tempat.anakSimpusId } : { anakBaruId: tempat.anakBaruId },
    orderBy: { dibuatPada: "asc" },
  });
}
