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

/** Kode varian merek → kode slot induknya (HEXA1→PENTA1, ROTARIX2→ROTA2, dst). */
const SLOT_VARIAN: Record<string, string> = Object.fromEntries(
  Object.entries(VARIAN_MEREK).flatMap(([slot, varian]) => varian.map((v) => [v.kode, slot])),
);

/** Aturan pemberian per SLOT dosis. Jendela usia dinyatakan SALAH SATU dari:
 *  - minHari/maxHari (hari sejak lahir) — dipakai HB0 saja (jendela sempit lintas-hari).
 *  - minBulan/maksBulan (bulan kalender penuh, inklusif) — dipakai semua slot lain;
 *    dihitung via `tglTambahBulan` (klem akhir bulan, BUKAN estimasi hari).
 *  setelahSlot+intervalHari = jarak minimal dari dosis sebelumnya dalam seri (dari
 *  tanggal dosis sebelumnya yang TERISI) — SELALU dalam hari, tak berubah oleh revisi ini.
 *  wajibUrutan=false → interval berlaku HANYA bila dosis sebelumnya sudah terisi
 *  (tak wajib diisi dulu; cth PCV3 yang boleh lepas dari PCV2).
 *  Sumber: tabel usia dikonfirmasi pemilik (petugas kesehatan) 17 Jul 2026,
 *  interval antar-dosis dalam seri = arahan pemilik 13 Jul 2026 (tak berubah). */
export interface AturanDosis {
  minHari?: number;
  maxHari?: number;
  minBulan?: number;
  maksBulan?: number;
  setelahSlot?: string;
  intervalHari?: number;
  wajibUrutan?: boolean;
}

export const ATURAN_DOSIS: Record<string, AturanDosis> = {
  HB0_1_7H: { minHari: 0, maxHari: 7 },
  BCG: { minBulan: 0, maksBulan: 11 },
  POLIO1: { minBulan: 0, maksBulan: 11 },
  POLIO2: { minBulan: 2, maksBulan: 59, setelahSlot: "POLIO1", intervalHari: 28 },
  POLIO3: { minBulan: 3, maksBulan: 59, setelahSlot: "POLIO2", intervalHari: 28 },
  POLIO4: { minBulan: 4, maksBulan: 59, setelahSlot: "POLIO3", intervalHari: 28 },
  PENTA1: { minBulan: 2, maksBulan: 60 },
  PENTA2: { minBulan: 3, maksBulan: 60, setelahSlot: "PENTA1", intervalHari: 28 },
  PENTA3: { minBulan: 4, maksBulan: 60, setelahSlot: "PENTA2", intervalHari: 28 },
  PCV1: { minBulan: 2, maksBulan: 60 },
  PCV2: { minBulan: 3, maksBulan: 60, setelahSlot: "PCV1", intervalHari: 28 },
  PCV3: { minBulan: 12, maksBulan: 24, setelahSlot: "PCV2", intervalHari: 56, wajibUrutan: false },
  ROTA1: { minBulan: 2, maksBulan: 4 },
  ROTA2: { minBulan: 3, maksBulan: 6, setelahSlot: "ROTA1", intervalHari: 28 },
  ROTA3: { minBulan: 4, maksBulan: 8, setelahSlot: "ROTA2", intervalHari: 28 },
  IPV1: { minBulan: 4, maksBulan: 59 },
  IPV2: { minBulan: 9, maksBulan: 59 },
  MR: { minBulan: 9, maksBulan: 59 },
  DPT_BADUTA: { minBulan: 18, maksBulan: 60, setelahSlot: "PENTA3", intervalHari: 336 },
  MR_BADUTA: { minBulan: 18, maksBulan: 59, setelahSlot: "MR", intervalHari: 168 },
};

/** Slot yang diberikan dalam SATU kunjungan (same-day) — BCG (suntik) & bOPV1 (tetes)
 *  diberikan sekaligus di praktik, bukan dua vaksin lepas dengan jendela usia independen.
 *  Kunci & nilai = kode SLOT (bukan varian merek); resolve varian via SLOT_VARIAN. */
export const PASANGAN_SEHARI: Record<string, string> = {
  BCG: "POLIO1",
  POLIO1: "BCG",
};

/** Tambah/kurang hari dari tanggal (YYYY-MM-DD) secara UTC-safe — hindari geser
 *  tanggal akibat parsing lokal di timezone UTC+ (server Mataram = WITA/UTC+8). */
function tglTambahHari(tgl: string, hari: number): string {
  const d = new Date(tgl + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + hari);
  return d.toISOString().slice(0, 10);
}

/** Tambah N bulan KALENDER (bukan estimasi 30 hari) ke tanggal (YYYY-MM-DD), UTC-safe,
 *  dgn KLEM akhir bulan bila tanggal asal melebihi jumlah hari bulan tujuan
 *  (mis. 31 Jan + 1 bulan → 28/29 Feb, BUKAN lompat ke 2-3 Mar). */
export function tglTambahBulan(tgl: string, bulan: number): string {
  const [y, m, d] = tgl.split("-").map(Number);
  const idxAbsolut = y * 12 + (m - 1) + bulan; // indeks bulan absolut, 0 = Jan tahun 0
  const targetY = Math.floor(idxAbsolut / 12);
  const targetM = idxAbsolut % 12; // 0-indexed (0 = Jan)
  const akhirBulan = new Date(Date.UTC(targetY, targetM + 1, 0)).getUTCDate();
  const targetD = Math.min(d, akhirBulan);
  return new Date(Date.UTC(targetY, targetM, targetD)).toISOString().slice(0, 10);
}

/** Tanggal awal jendela (baseline SAJA, TANPA interval antar-dosis) satu SLOT untuk
 *  anak lahir `tglLahir` — dipakai batasDosis (sebelum interval dipertimbangkan) &
 *  minTglDosis (dipakai UI, tak menghitung interval — lihat dokumentasi minTglDosis). */
function baselineMinTgl(slot: string, tglLahir: string): string {
  const a = ATURAN_DOSIS[slot];
  return a?.minBulan != null ? tglTambahBulan(tglLahir, a.minBulan) : tglTambahHari(tglLahir, a?.minHari ?? 0);
}

const BULAN_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
function formatTglIndo(tgl: string): string {
  const [y, m, d] = tgl.split("-").map(Number);
  return `${d} ${BULAN_ID[m - 1]} ${y}`;
}

/** Tanggal paling awal (YYYY-MM-DD) satu dosis boleh diberikan utk anak lahir `tglLahir`
 *  (baseline SAJA — belum memperhitungkan interval antar-dosis; itu tugas `batasDosis`).
 *  Menerima kode slot maupun kode varian merek. */
export function minTglDosis(tglLahir: string, kode: string): string {
  const slot = SLOT_VARIAN[kode] ?? kode;
  return baselineMinTgl(slot, tglLahir);
}

/** Nama tampil sebuah kode (slot atau varian merek) — untuk pesan galat. */
export function namaKode(kode: string): string {
  const slot = SLOT_VARIAN[kode] ?? kode;
  return DOSIS_REGISTRY.find((d) => d.kode === slot)?.nama ?? kode;
}

/** Slot dianggap terisi bila kode slot ATAU salah satu varian mereknya terisi. */
export function adaDosis(vaksin: Record<string, string>, slotKode: string): boolean {
  const varian = VARIAN_MEREK[slotKode];
  if (varian) return varian.some((v) => Boolean(vaksin[v.kode]));
  return Boolean(vaksin[slotKode]);
}

/** Tanggal (YYYY-MM-DD) satu slot — memeriksa varian merek. "" bila belum. */
export function tglDosis(vaksin: Record<string, string>, slotKode: string): string {
  const varian = VARIAN_MEREK[slotKode];
  if (varian) {
    for (const v of varian) if (vaksin[v.kode]) return vaksin[v.kode];
    return "";
  }
  return vaksin[slotKode] ?? "";
}

/** Kode slot yang WAJIB terisi lebih dulu (order seri) sebelum slot ini boleh diisi —
 *  undefined bila tak ada aturan urutan berlaku (termasuk aturan "lunak", cth PCV3).
 *  Menerima kode slot maupun kode varian merek. */
export function slotSyaratSebelum(kode: string): string | undefined {
  const slot = SLOT_VARIAN[kode] ?? kode;
  const a = ATURAN_DOSIS[slot];
  if (!a || !a.setelahSlot || a.wajibUrutan === false) return undefined;
  return a.setelahSlot;
}

/** Slot pasangan "satu kunjungan" milik `kode` (BCG↔POLIO1), bila ada — lihat PASANGAN_SEHARI.
 *  Menerima kode slot maupun kode varian merek. */
export function pasanganSehari(kode: string): string | undefined {
  const slot = SLOT_VARIAN[kode] ?? kode;
  return PASANGAN_SEHARI[slot];
}

/** Jendela usia (min–max, hari sejak lahir) satu slot dosis untuk anak `tglLahir`,
 *  dgn `vaksin` (dosis lain yang sudah terisi) untuk menghitung interval seri.
 *  `alasan` = teks ramah utk pesan galat. Menerima kode slot maupun kode varian merek. */
export function batasDosis(
  vaksin: Record<string, string>,
  slotKode: string,
  tglLahir: string,
): { min: string; max?: string; alasan?: string } {
  const slot = SLOT_VARIAN[slotKode] ?? slotKode;
  const a = ATURAN_DOSIS[slot] ?? { minHari: 0 };
  const nama = namaKode(slot);

  const baselineMin = baselineMinTgl(slot, tglLahir);
  const max = a.maksBulan != null
    ? tglTambahHari(tglTambahBulan(tglLahir, a.maksBulan + 1), -1)
    : a.maxHari != null ? tglTambahHari(tglLahir, a.maxHari) : undefined;

  let min = baselineMin;
  let alasan = a.minBulan != null
    ? `${nama} minimal usia ${a.minBulan} bulan.`
    : `${nama} minimal usia ${a.minHari ?? 0} hari.`;

  if (a.setelahSlot && a.intervalHari != null) {
    const tglSebelum = tglDosis(vaksin, a.setelahSlot);
    if (tglSebelum) {
      const tglIntervalMin = tglTambahHari(tglSebelum, a.intervalHari);
      if (tglIntervalMin > min) {
        min = tglIntervalMin;
        alasan = `${nama} minimal ${a.intervalHari} hari setelah ${namaKode(a.setelahSlot)} (${formatTglIndo(tglIntervalMin)}).`;
      }
    }
  }

  // Guard: pesan jendela min–max hanya dipakai bila interval TIDAK menggeser min — bila
  // suatu slot punya max sekaligus interval yang menang, alasan interval lebih spesifik
  // & sudah menyebut tanggal minimalnya, jangan ditimpa.
  if (max != null && min === baselineMin) {
    alasan = a.minBulan != null
      ? `${nama} hanya boleh diberikan usia ${a.minBulan}–${a.maksBulan} bulan.`
      : `${nama} hanya boleh ${a.minHari}–${a.maxHari} hari setelah lahir.`;
  }

  return { min, max, alasan };
}

/** Validasi semua dosis terisi: urutan seri ("isi dulu dosis sebelumnya") + jendela
 *  min/max + interval antar dosis + pasangan sehari (PASANGAN_SEHARI, cth BCG↔bOPV1
 *  harus tanggal sama). Mengembalikan pesan galat ramah, atau null bila sah.
 *  `vaksinLama` = dosis tersimpan sebelumnya (mode edit): nilai yang TIDAK berubah
 *  dilewati ("grandfather") supaya data lama yang sah menurut aturan lama tidak
 *  menggagalkan edit field lain; nilai yang berubah/baru tetap divalidasi penuh —
 *  termasuk cek pasangan: kode grandfathered tak memicu ceknya, tapi tetap dicek
 *  sebagai acuan tanggal bila pasangannya yang berubah. */
export function validasiDosis(
  vaksin: Record<string, string>,
  tglLahir: string,
  vaksinLama: Record<string, string> = {},
): string | null {
  for (const [kode, tgl] of Object.entries(vaksin)) {
    if (!tgl) continue;
    if (tgl === vaksinLama[kode]) continue; // tak berubah dari yang tersimpan → grandfather
    const perlu = slotSyaratSebelum(kode);
    if (perlu && !tglDosis(vaksin, perlu)) {
      return `Isi dulu ${namaKode(perlu)} sebelum ${namaKode(kode)}.`;
    }
    const batas = batasDosis(vaksin, kode, tglLahir);
    if (tgl < batas.min || (batas.max && tgl > batas.max)) {
      return batas.alasan ?? `Tanggal ${namaKode(kode)} di luar batas usia yang diperbolehkan.`;
    }
    const pasangan = pasanganSehari(kode);
    if (pasangan) {
      const tglPasangan = tglDosis(vaksin, pasangan);
      if (tglPasangan && tglPasangan !== tgl) {
        const slotKode = SLOT_VARIAN[kode] ?? kode;
        const slotPasangan = SLOT_VARIAN[pasangan] ?? pasangan;
        const kodeDulu = DOSIS_REGISTRY.findIndex((d) => d.kode === slotKode)
          < DOSIS_REGISTRY.findIndex((d) => d.kode === slotPasangan);
        const [nama1, nama2] = kodeDulu
          ? [namaKode(kode), namaKode(pasangan)]
          : [namaKode(pasangan), namaKode(kode)];
        return `${nama1} dan ${nama2} diberikan di kunjungan yang sama — isi tanggal yang sama untuk keduanya.`;
      }
    }
  }
  return null;
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
