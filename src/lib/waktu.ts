/** Format waktu untuk pengguna Mataram — selalu WITA (Asia/Makassar, UTC+8), apa pun
 *  timezone server. Vercel merender Server Component di UTC, jadi `toLocaleString("id-ID")`
 *  TANPA opsi `timeZone` menggeser jam -8 dari waktu setempat. Semua tampilan waktu di app
 *  WAJIB lewat helper ini supaya konsisten (bukti & regresi: src/lib/waktu.test.ts). */

const ZONA_WITA = "Asia/Makassar";

export function formatWaktuIndo(waktu: Date): string {
  return waktu.toLocaleString("id-ID", { timeZone: ZONA_WITA });
}
