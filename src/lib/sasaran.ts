/** Mesin "siapa jatuh tempo" untuk menu Sweeping — MENGHITUNG ULANG jatuh-tempo dari
 *  `batasDosis()`/`ATURAN_DOSIS` di `@/lib/vaksin` (sumber kebenaran tunggal repo ini),
 *  BUKAN portingan tabel UMUR_IDEAL/BATAS_ATAS_BULAN dari simpus-imun — rasional lengkap
 *  di PLAN-2026-07-19-wa-icon-sweeping.md § "Riset yang MENDASARI". Modul ini murni BACA
 *  (menentukan siapa perlu disweeping), bukan validasi input — untuk validasi input dosis
 *  pakai `validasiDosis` di vaksin.ts; jangan tertukar. */

import {
  DOSIS_REGISTRY, adaDosis, dosisTakBerlaku, batasDosis, namaKode, tglTambahBulan,
} from "@/lib/vaksin";

const KODE_HB0 = "HB0_1_7H"; // diberi saat lahir — tak pernah target sweeping (kebijakan simpus-imun direplikasi)
const UMUR_MUDA_MAKS_BULAN = 24; // ≤24 bulan = "muda" (bayi), 25-60 bulan = "tua" (baduta)
const UMUR_DROPOUT_BULAN = 60; // >60 bulan = drop-out, tak disweeping lagi (kebijakan dipertahankan dari riset)

/** Kelompok umur untuk sweeping. null = drop-out (>60 bulan), tak pernah disweeping lagi. */
export function kelompokUmurSasaran(umurBulan: number): "muda" | "tua" | null {
  if (umurBulan > UMUR_DROPOUT_BULAN) return null;
  return umurBulan <= UMUR_MUDA_MAKS_BULAN ? "muda" : "tua";
}

/** Umur anak (bulan kalender penuh) pada `padaTanggal`, dicari via `tglTambahBulan`
 *  (BUKAN aritmetika hari terpisah) supaya klem akhir-bulan SELALU konsisten dengan
 *  jendela `batasDosis` — mis. anak lahir 31 Des, pada tanggal klem 28/29 Feb harus
 *  terhitung TEPAT 2 bulan, sama seperti batasDosis menganggap jendela 2-bulan sudah
 *  terbuka pada tanggal itu (lihat aturan-dosis.test.ts kasus klem serupa).
 *  Loop dibatasi 61 — di atas itu sudah pasti drop-out, nilai pastinya tak relevan lagi
 *  bagi kelompokUmurSasaran (jadi aman & selalu berhenti, tak pernah tak-terhingga). */
function umurBulanPada(tglLahir: string, padaTanggal: string): number {
  let bulan = 0;
  while (bulan <= UMUR_DROPOUT_BULAN && tglTambahBulan(tglLahir, bulan + 1) <= padaTanggal) bulan++;
  return bulan;
}

/** Selisih hari (UTC-safe) dari `dariIso` ke `keIso` — dipakai menentukan ambang
 *  kuning/merah di dosisJatuhTempo. Pola T00:00:00Z sama seperti tglTambahHari/
 *  tglTambahBulan di vaksin.ts (hindari geser tanggal akibat parsing lokal). */
function selisihHari(dariIso: string, keIso: string): number {
  const dari = Date.parse(`${dariIso}T00:00:00Z`);
  const ke = Date.parse(`${keIso}T00:00:00Z`);
  return Math.round((ke - dari) / 86_400_000);
}

/** Ambang status "baru jatuh tempo" (kuning) vs "agak telat" (merah): ≤30 hari sejak
 *  batas.min = kuning, >30 hari = merah. 30 hari dipilih sbg proxy "satu siklus posyandu
 *  bulanan" (jendela wajar sebelum kader perlu waspada lebih) — BUKAN angka baku dari
 *  pemilik/riset (riset hanya menyebut ada H-1/susulan utk sesi, tak menyebut ambang
 *  warna dosis-telat); ini keputusan builder, didokumentasikan sesuai DoD PLAN. */
const AMBANG_MERAH_HARI = 30;

export interface DosisSasaran {
  kode: string;
  nama: string;
  status: "kuning" | "merah";
}

/** Slot dosis (dari DOSIS_REGISTRY, minus HB0 — lihat KODE_HB0) yang jatuh tempo pada
 *  `padaTanggal` bagi anak lahir `tglLahir` dengan riwayat `vaksin`: dilewati bila sudah
 *  diberi (adaDosis) atau varian tak berlaku (dosisTakBerlaku); sisanya disertakan bila
 *  `padaTanggal` berada di dalam jendela [batas.min, batas.max] dari `batasDosis` —
 *  jendela dihitung ULANG tiap panggilan (jam bukan pra-syarat-urutan, murni umur/tanggal;
 *  urutan seri "isi dulu X" ada di validasiDosis, sengaja tak dicek di sini). */
export function dosisJatuhTempo(
  vaksin: Record<string, string>,
  tglLahir: string,
  padaTanggal: string,
): DosisSasaran[] {
  const hasil: DosisSasaran[] = [];
  for (const { kode } of DOSIS_REGISTRY) {
    if (kode === KODE_HB0) continue;
    if (adaDosis(vaksin, kode)) continue;
    if (dosisTakBerlaku(kode, vaksin)) continue;
    const batas = batasDosis(vaksin, kode, tglLahir);
    if (padaTanggal < batas.min) continue; // belum jatuh tempo
    if (batas.max != null && padaTanggal > batas.max) continue; // lewat jendela
    const telat = selisihHari(batas.min, padaTanggal);
    hasil.push({ kode, nama: namaKode(kode), status: telat > AMBANG_MERAH_HARI ? "merah" : "kuning" });
  }
  return hasil;
}

/** true bila anak masih dalam kelompok umur sweeping (bukan drop-out) DAN punya minimal
 *  satu dosis jatuh tempo pada `padaTanggal`. */
export function perluSasaran(vaksin: Record<string, string>, tglLahir: string, padaTanggal: string): boolean {
  if (kelompokUmurSasaran(umurBulanPada(tglLahir, padaTanggal)) === null) return false;
  return dosisJatuhTempo(vaksin, tglLahir, padaTanggal).length > 0;
}
