/** Katalog vaksin kanonik SIMPUS-POSYANDU.
 *  KODE = kode PWS di SIMPUS-IMUN petugas (registry.ts) — SATU sumber kebenaran
 *  untuk penyimpanan dosis, export Excel, dan pencocokan balik dari SIMPUS.
 *  JANGAN mengubah kode; mengubah kode = memutus data & merusak impor SIMPUS. */

export interface DosisRegistry {
  kode: string;
  nama: string; // nama tampil — PERSIS header template "Impor Data Anak" SIMPUS
  kelompok: "Bayi" | "Baduta";
}

/** Urutan & nama PERSIS DOSIS_REGISTRY SIMPUS (dipakai juga sebagai urutan kolom export). */
export const DOSIS_REGISTRY: DosisRegistry[] = [
  { kode: "HB0_1_7H", nama: "HB0", kelompok: "Bayi" },
  { kode: "BCG", nama: "BCG", kelompok: "Bayi" },
  { kode: "POLIO1", nama: "bOPV 1", kelompok: "Bayi" },
  { kode: "PENTA1", nama: "DPT-HB-Hib (1)", kelompok: "Bayi" },
  { kode: "POLIO2", nama: "bOPV 2", kelompok: "Bayi" },
  { kode: "PCV1", nama: "PCV 1", kelompok: "Bayi" },
  { kode: "ROTA1", nama: "Rotavirus 1", kelompok: "Bayi" },
  { kode: "PENTA2", nama: "DPT-HB-Hib (2)", kelompok: "Bayi" },
  { kode: "POLIO3", nama: "bOPV 3", kelompok: "Bayi" },
  { kode: "PCV2", nama: "PCV 2", kelompok: "Bayi" },
  { kode: "ROTA2", nama: "Rotavirus 2", kelompok: "Bayi" },
  { kode: "PENTA3", nama: "DPT-HB-Hib (3)", kelompok: "Bayi" },
  { kode: "POLIO4", nama: "bOPV 4", kelompok: "Bayi" },
  { kode: "IPV1", nama: "IPV 1", kelompok: "Bayi" },
  { kode: "ROTA3", nama: "Rotavirus 3", kelompok: "Bayi" },
  { kode: "MR", nama: "Campak-Rubella (MR)", kelompok: "Bayi" },
  { kode: "IPV2", nama: "IPV 2", kelompok: "Bayi" },
  { kode: "PCV3", nama: "PCV 3", kelompok: "Baduta" },
  { kode: "DPT_BADUTA", nama: "DPT-HB-Hib Baduta", kelompok: "Baduta" },
  { kode: "MR_BADUTA", nama: "Campak-Rubella (MR) Baduta", kelompok: "Baduta" },
];

/** Umur ideal (bulan) tiap dosis — selaras UMUR_IDEAL SIMPUS (disetujui Aryawa). */
export const UMUR_IDEAL: Record<string, number> = {
  HB0_1_7H: 0, BCG: 1, POLIO1: 1,
  PENTA1: 2, POLIO2: 2, PCV1: 2, ROTA1: 2,
  PENTA2: 3, POLIO3: 3, PCV2: 3, ROTA2: 3,
  PENTA3: 4, POLIO4: 4, IPV1: 4, ROTA3: 4,
  MR: 9, IPV2: 9,
  PCV3: 12, DPT_BADUTA: 18, MR_BADUTA: 18,
};

/** Slot dosis yang punya pilihan merek (pola VARIAN_MEREK SIMPUS). */
export const VARIAN_MEREK: Record<string, { kode: string; merek: string }[]> = {
  PENTA1: [{ kode: "PENTA1", merek: "Pentavalen" }, { kode: "HEXA1", merek: "Hexavalen" }],
  PENTA2: [{ kode: "PENTA2", merek: "Pentavalen" }, { kode: "HEXA2", merek: "Hexavalen" }],
  PENTA3: [{ kode: "PENTA3", merek: "Pentavalen" }, { kode: "HEXA3", merek: "Hexavalen" }],
  ROTA1: [{ kode: "ROTA1", merek: "Rotavac" }, { kode: "ROTARIX1", merek: "Rotarix" }],
  ROTA2: [{ kode: "ROTA2", merek: "Rotavac" }, { kode: "ROTARIX2", merek: "Rotarix" }],
};

/** Slot dianggap terisi bila kode slot ATAU salah satu varian mereknya terisi. */
export function adaDosis(vaksin: Record<string, string>, slotKode: string): boolean {
  const varian = VARIAN_MEREK[slotKode];
  if (varian) return varian.some((v) => Boolean(vaksin[v.kode]));
  return Boolean(vaksin[slotKode]);
}

/** Merek DPT anak (dari dosis terisi) — Hexavalen mencakup IPV. */
export function merekDpt(vaksin: Record<string, string>): "PENTAVALEN" | "HEXAVALEN" | null {
  if (vaksin.HEXA1 || vaksin.HEXA2 || vaksin.HEXA3) return "HEXAVALEN";
  if (vaksin.PENTA1 || vaksin.PENTA2 || vaksin.PENTA3) return "PENTAVALEN";
  return null;
}

/** Merek Rotavirus anak — Rotarix hanya 2 dosis (ROTA3 tak berlaku). */
export function merekRv(vaksin: Record<string, string>): "ROTAVAC" | "ROTARIX" | null {
  if (vaksin.ROTARIX1 || vaksin.ROTARIX2) return "ROTARIX";
  if (vaksin.ROTA1 || vaksin.ROTA2 || vaksin.ROTA3) return "ROTAVAC";
  return null;
}

/** Dosis yang TIDAK berlaku untuk anak ini (pola dosisTakBerlaku SIMPUS):
 *  ROTA3 bagi pemakai Rotarix; IPV1/IPV2 bagi jalur Hexavalen (6-in-1 sudah mengandung IPV). */
export function dosisTakBerlaku(kode: string, vaksin: Record<string, string>): boolean {
  if (kode === "ROTA3" && merekRv(vaksin) === "ROTARIX") return true;
  if ((kode === "IPV1" || kode === "IPV2") && merekDpt(vaksin) === "HEXAVALEN") return true;
  return false;
}

/** Antigen wajib IDL — definisi 2026 Puskesmas Cakranegara (revisi Aryawa, TANPA antigen baru):
 *  HB0, BCG, Polio 1-4, DPT-HB-Hib 1-3 (Penta ATAU Hexa), IPV1 (Hexa mencakup IPV), MR.
 *  PCV & Rotavirus TIDAK dihitung. Selaras SYARAT_IDL di repo Simpus-Imun. */
export const SYARAT_IDL: string[][] = [
  ["HB0_1_7H"],
  ["BCG"],
  ["POLIO1"], ["POLIO2"], ["POLIO3"], ["POLIO4"],
  ["PENTA1", "HEXA1"], ["PENTA2", "HEXA2"], ["PENTA3", "HEXA3"],
  ["IPV1", "HEXA1", "HEXA2", "HEXA3"],
  ["MR"],
];

/** Antigen wajib IBL — DPT lanjutan + MR lanjutan (PCV3 TIDAK dihitung). */
export const SYARAT_IBL: string[][] = [["DPT_BADUTA"], ["MR_BADUTA"]];

/** true bila semua antigen wajib terpenuhi (salah satu kode per baris cukup). */
export function lengkap(vaksin: Record<string, string>, syarat: string[][]): boolean {
  return syarat.every((opsi) => opsi.some((k) => Boolean(vaksin[k])));
}
