"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { wajibUser } from "@/lib/sesi";
import { ambilAnak } from "@/lib/anak";
import { ambilAnakOrtu } from "@/lib/ortu";
import { DOSIS_REGISTRY, adaDosis, minTglDosis, minUsiaHari, namaKode } from "@/lib/vaksin";

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
  if (tgl < minTglDosis(anak.isi.tglLahir, kode)) {
    redirect(balik + "?galat=" + encodeURIComponent(
      `Tanggal ${namaKode(kode)} terlalu dini — dosis ini minimal usia ${minUsiaHari(kode)} hari.`,
    ));
  }

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
