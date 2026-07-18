import "server-only";
import { db } from "@/lib/db";

/** Pengaturan Pojok Baca (link BPJS & Drive) — diisi/diedit ADMIN dari halaman Admin.
 *  Disimpan lewat tabel `CacheDashboard` (kunci unik) TANPA migrasi skema baru — baris
 *  ini BUKAN cache hasil tarikan SIMPUS seperti baris "puskesmas"/"kelurahan:*"/
 *  "posyandu:*" lain di tabel yang sama; `sinkronPada` di sini berarti "terakhir
 *  diubah admin", dipinjam semata-mata karena kolomnya sudah ada. Lihat juga
 *  src/lib/pojok-baca.ts (data statis lain Pojok Baca) & pengaturan-actions.ts (simpan). */

export const KUNCI_POJOK_BACA = "pengaturan:pojok-baca";

/** Default link pendaftaran BPJS Mobile (Play Store) — keputusan pemilik #6,
 *  PLAN 2026-07-18 (c). Dipakai sampai admin mengisi link sendiri. */
export const DEFAULT_LINK_BPJS = "https://play.google.com/store/apps/details?id=app.bpjs.mobile";

export interface PengaturanPojokBaca {
  linkBpjs: string;
  linkDrive: string;
}

/** URL sah untuk pengaturan ini: kosong (belum diisi) ATAU diawali "https://".
 *  Murni — dipakai simpanPengaturanPojok (validasi) & diuji langsung tanpa DB. */
export function urlSah(url: string): boolean {
  return url === "" || url.startsWith("https://");
}

/** Parse JSON tersimpan → pengaturan, fallback default PER FIELD bila hilang/rusak
 *  (bukan seluruh objek dibuang gara-gara satu field usang). Murni — diekspor supaya
 *  diuji tanpa DB (lihat __tests__/pengaturan.test.ts). */
export function parsePengaturan(json: string | null | undefined): PengaturanPojokBaca {
  const fallback: PengaturanPojokBaca = { linkBpjs: DEFAULT_LINK_BPJS, linkDrive: "" };
  if (!json) return fallback;
  try {
    const obj = JSON.parse(json) as Partial<Record<keyof PengaturanPojokBaca, unknown>>;
    return {
      linkBpjs: typeof obj.linkBpjs === "string" ? obj.linkBpjs : fallback.linkBpjs,
      linkDrive: typeof obj.linkDrive === "string" ? obj.linkDrive : fallback.linkDrive,
    };
  } catch {
    return fallback;
  }
}

/** Baca pengaturan Pojok Baca (link BPJS & Drive) — dipakai pojok-baca-konten.tsx. */
export async function ambilPengaturan(): Promise<PengaturanPojokBaca> {
  const row = await db.cacheDashboard.findUnique({ where: { kunci: KUNCI_POJOK_BACA } });
  return parsePengaturan(row?.data);
}
