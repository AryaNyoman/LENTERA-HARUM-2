/** Data Pojok Baca Imun — jadwal hari, link pendaftaran BPJS (utk QR), link
 *  materi, URL aplikasi (utk QR "Bagikan aplikasi"). String kosong ("") =
 *  data belum tersedia dari pemilik → UI menampilkan penanda "menunggu diisi
 *  petugas". Edit langsung di file ini saat data resmi tersedia.
 *  Kontak petugas/kader TIDAK lagi di sini — diambil dari User.noHp di
 *  database (diisi admin di halaman Admin), lihat pojok-baca-konten.tsx.
 *  Lihat PLAN-2026-07-16-lentera-harum.md § "Ditunda". */

export interface JadwalHari {
  hari: string;
  isi: string;
}

/** Jadwal hari imunisasi Puskesmas Cakranegara. */
export const JADWAL_HARI: JadwalHari[] = [
  { hari: "Jumat", isi: "BCG & Polio 1" },
  { hari: "Sabtu", isi: "Semua jenis vaksin" },
];

/** Link pendaftaran online BPJS — dipakai jadi QR. Kosong = belum ada dari pemilik. */
export const LINK_BPJS = "";

/** Link Google Drive materi imunisasi. Kosong = belum ada dari pemilik. */
export const LINK_DRIVE = "";

/** URL aplikasi web — dipakai QR "Bagikan aplikasi" di halaman Admin. Satu tempat,
 *  gampang diubah kalau nanti pakai domain sendiri. */
export const URL_APLIKASI = "https://simpus-posyandu.vercel.app";

/** Normalisasi nomor HP lokal (08xxx) ke format internasional tanpa "+" (62xxx),
 *  dipakai utk link wa.me & tel:. */
export function nomorInternasional(noHp: string): string {
  const digit = (noHp || "").replace(/\D/g, "");
  return digit.startsWith("0") ? "62" + digit.slice(1) : digit;
}
