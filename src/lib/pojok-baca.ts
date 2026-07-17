/** Data Pojok Baca Imun — jadwal hari, link pendaftaran BPJS (utk QR), kontak
 *  petugas & kader, link materi. String kosong ("") / array kosong = data
 *  belum tersedia dari pemilik → UI menampilkan penanda "menunggu diisi
 *  petugas". Edit langsung di file ini saat data resmi tersedia.
 *  Lihat PLAN-2026-07-16-lentera-harum.md § "Ditunda". */

export interface JadwalHari {
  hari: string;
  isi: string;
}

export interface KontakPetugas {
  nama: string;
  peran: string;
  noHp: string; // format lokal 08xxxxxxxxxx
}

/** Jadwal hari imunisasi Puskesmas Cakranegara. */
export const JADWAL_HARI: JadwalHari[] = [
  { hari: "Jumat", isi: "BCG & Polio 1" },
  { hari: "Sabtu", isi: "Semua jenis vaksin" },
];

/** Link pendaftaran online BPJS — dipakai jadi QR. Kosong = belum ada dari pemilik. */
export const LINK_BPJS = "";

/** Kontak petugas imunisasi & kader. Kosong = belum ada dari pemilik. */
export const KONTAK: KontakPetugas[] = [];

/** Link Google Drive materi imunisasi. Kosong = belum ada dari pemilik. */
export const LINK_DRIVE = "";

/** Normalisasi nomor HP lokal (08xxx) ke format internasional tanpa "+" (62xxx),
 *  dipakai utk link wa.me & tel:. */
export function nomorInternasional(noHp: string): string {
  const digit = (noHp || "").replace(/\D/g, "");
  return digit.startsWith("0") ? "62" + digit.slice(1) : digit;
}
