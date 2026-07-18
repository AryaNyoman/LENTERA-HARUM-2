/** Data Pojok Baca Imun — jadwal hari & URL aplikasi (utk QR "Bagikan aplikasi").
 *  Kontak petugas/kader TIDAK di sini — diambil dari User.noHp di database (diisi
 *  admin di halaman Admin), lihat pojok-baca-konten.tsx. Link BPJS & Drive JUGA
 *  TIDAK lagi di sini (dulu konstanta statis) — sekarang dikelola admin & tersimpan
 *  di DB, lihat src/lib/pengaturan.ts (ambilPengaturan, kunci "pengaturan:pojok-baca").
 *  Lihat PLAN-2026-07-16-lentera-harum.md § "Ditunda" & PLAN-2026-07-18(c) keputusan #6. */

export interface JadwalHari {
  hari: string;
  isi: string;
}

/** Jadwal hari imunisasi Puskesmas Cakranegara. */
export const JADWAL_HARI: JadwalHari[] = [
  { hari: "Jumat", isi: "BCG & Polio 1" },
  { hari: "Sabtu", isi: "Semua jenis vaksin" },
];

/** URL aplikasi web — dipakai QR "Bagikan aplikasi" di halaman Admin. Satu tempat,
 *  gampang diubah kalau nanti pakai domain sendiri. */
export const URL_APLIKASI = "https://simpus-posyandu.vercel.app";

/** Normalisasi nomor HP lokal (08xxx) ke format internasional tanpa "+" (62xxx),
 *  dipakai utk link wa.me & tel:. */
export function nomorInternasional(noHp: string): string {
  const digit = (noHp || "").replace(/\D/g, "");
  return digit.startsWith("0") ? "62" + digit.slice(1) : digit;
}
