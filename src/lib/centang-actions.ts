"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { wajibUser } from "@/lib/sesi";

function refKe(ref: string): { anakSimpusId: number | null; anakBaruId: number | null } | null {
  const m = /^([sb]):(\d+)$/.exec(ref);
  if (!m) return null;
  return {
    anakSimpusId: m[1] === "s" ? Number(m[2]) : null,
    anakBaruId: m[1] === "b" ? Number(m[2]) : null,
  };
}

/** Keputusan pemilik 18 Jul 2026: alur "tandai sudah" ortu & verifikasi centang kader
 *  DIMATIKAN — pencatatan dosis kini HANYA oleh petugas puskesmas (lihat form.tsx
 *  kunciDosis / vaksin-admin-actions W2). Tiga fungsi di bawah DIPERTAHANKAN (bukan
 *  dihapus, UI pemanggilnya sudah dicopot) sebagai gerbang server yang menolak dgn
 *  galat rapi — pengaman sesungguhnya kalau ada yang tamper form lama. Tabel CentangOrtu
 *  & `daftarCentang` (riwayat, read-only) TIDAK disentuh — data lama tetap tampil. */
const PESAN_DIKUNCI = "Pencatatan dosis kini dilakukan petugas puskesmas.";

/** ORTU: DIMATIKAN — dulu menandai satu dosis "sudah diberikan di faskes lain". */
export async function tandaiOrtu(formData: FormData): Promise<void> {
  await wajibUser("ORTU", "ADMIN");
  const ref = String(formData.get("ref") ?? "");
  redirect(ref ? `/ortu/anak/${ref}?galat=${encodeURIComponent(PESAN_DIKUNCI)}` : "/ortu/anakku");
}

/** ORTU: DIMATIKAN — dulu menghapus centang miliknya sendiri. */
export async function hapusCentangOrtu(formData: FormData): Promise<void> {
  await wajibUser("ORTU", "ADMIN");
  const id = Number(formData.get("id") ?? 0);
  const row = await db.centangOrtu.findUnique({ where: { id } });
  const ref = row ? (row.anakSimpusId ? `s:${row.anakSimpusId}` : `b:${row.anakBaruId}`) : null;
  redirect(ref ? `/ortu/anak/${ref}?galat=${encodeURIComponent(PESAN_DIKUNCI)}` : "/ortu/anakku");
}

/** KADER: DIMATIKAN — dulu memverifikasi/menolak centang orang tua. */
export async function verifikasiCentang(formData: FormData): Promise<void> {
  await wajibUser("KADER", "ADMIN");
  const id = Number(formData.get("id") ?? 0);
  const row = await db.centangOrtu.findUnique({ where: { id } });
  const ref = row ? (row.anakSimpusId ? `s:${row.anakSimpusId}` : `b:${row.anakBaruId}`) : null;
  redirect(ref ? `/kader/anak/${ref}?galat=${encodeURIComponent(PESAN_DIKUNCI)}` : "/kader/daftar-bayi");
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
