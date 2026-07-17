import { describe, it, expect } from "vitest";
import {
  batasDosis, slotSyaratSebelum, tglDosis, namaKode, validasiDosis, pasanganSehari,
  tglTambahBulan, minTglDosis,
} from "@/lib/vaksin";

const LAHIR = "2026-01-01";

describe("tglTambahBulan — kalender-bulan UTC-safe dgn clamp akhir bulan", () => {
  it("31 Jan + 1 bulan → 28 Feb (tahun biasa, bukan kabisat)", () => {
    expect(tglTambahBulan("2026-01-31", 1)).toBe("2026-02-28");
  });

  it("31 Jan + 1 bulan → 29 Feb (tahun kabisat)", () => {
    expect(tglTambahBulan("2024-01-31", 1)).toBe("2024-02-29");
  });

  it("31 Mar + 6 bulan → 30 Sep (bukan lompat ke 1-2 Okt)", () => {
    expect(tglTambahBulan("2026-03-31", 6)).toBe("2026-09-30");
  });

  it("tanggal pertengahan bulan tanpa clamp: 15 tetap 15", () => {
    expect(tglTambahBulan("2026-01-15", 2)).toBe("2026-03-15");
  });

  it("lintas tahun: Des + 2 bulan → Feb tahun berikutnya", () => {
    expect(tglTambahBulan("2025-12-15", 2)).toBe("2026-02-15");
  });
});

describe("batasDosis — jendela usia dasar", () => {
  it("HB0: hari-8 ditolak (lewat max 7), hari-7 lolos", () => {
    const b = batasDosis({}, "HB0_1_7H", LAHIR);
    expect(b.max).toBe("2026-01-08"); // lahir + 7 hari
    expect("2026-01-09" > b.max!).toBe(true); // hari ke-8 → ditolak
    expect("2026-01-08" > b.max!).toBe(false); // hari ke-7 → lolos
  });

  it("BCG: usia 0 (hari lahir) lolos min, maks 11 bulan penuh (sebelum ulang tahun-1)", () => {
    const b = batasDosis({}, "BCG", LAHIR);
    expect(b.min).toBe("2026-01-01"); // lahir + 0 bulan
    expect(b.max).toBe("2026-12-31"); // lahir + 12 bulan − 1 hari
    expect("2026-12-31" > b.max!).toBe(false); // usia 11 bln penuh → lolos
    expect("2027-01-01" > b.max!).toBe(true); // pas ulang tahun-1 → ditolak
  });
});

describe("batasDosis — jendela bulan baru per kelompok (tabel dikonfirmasi pemilik 17 Jul)", () => {
  const kasus: [string, string, string][] = [
    ["BCG", "2026-01-01", "2026-12-31"],
    ["POLIO1", "2026-01-01", "2026-12-31"],
    ["POLIO2", "2026-03-01", "2030-12-31"],
    ["POLIO3", "2026-04-01", "2030-12-31"],
    ["POLIO4", "2026-05-01", "2030-12-31"],
    ["PENTA1", "2026-03-01", "2031-01-31"],
    ["PENTA2", "2026-04-01", "2031-01-31"],
    ["PENTA3", "2026-05-01", "2031-01-31"],
    ["PCV1", "2026-03-01", "2031-01-31"],
    ["PCV2", "2026-04-01", "2031-01-31"],
    ["PCV3", "2027-01-01", "2028-01-31"],
    ["ROTA1", "2026-03-01", "2026-05-31"],
    ["ROTA2", "2026-04-01", "2026-07-31"],
    ["ROTA3", "2026-05-01", "2026-09-30"],
    ["IPV1", "2026-05-01", "2030-12-31"],
    ["IPV2", "2026-10-01", "2030-12-31"],
    ["MR", "2026-10-01", "2030-12-31"],
    ["MR_BADUTA", "2027-07-01", "2030-12-31"],
    ["DPT_BADUTA", "2027-07-01", "2031-01-31"],
  ];

  it.each(kasus)("%s: min %s, maks %s (tanpa dosis sebelumnya terisi)", (kode, min, max) => {
    const b = batasDosis({}, kode, LAHIR);
    expect(b.min).toBe(min);
    expect(b.max).toBe(max);
  });

  it("ROTA1 (ketat): usia 4 bulan penuh lolos, 5 bulan ditolak", () => {
    const b = batasDosis({}, "ROTA1", LAHIR);
    expect("2026-05-31" > b.max!).toBe(false); // akhir bulan ke-4 → lolos
    expect("2026-06-01" > b.max!).toBe(true); // masuk bulan ke-5 → ditolak
  });

  it("PCV3: usia 24 bulan penuh lolos, 25 bulan ditolak", () => {
    const b = batasDosis({}, "PCV3", LAHIR);
    expect("2028-01-31" > b.max!).toBe(false);
    expect("2028-02-01" > b.max!).toBe(true);
  });

  it("MR_BADUTA (maks 59 bln) vs DPT_BADUTA (maks 60 bln) — beda batas atas", () => {
    const mr = batasDosis({}, "MR_BADUTA", LAHIR);
    const dpt = batasDosis({}, "DPT_BADUTA", LAHIR);
    expect(mr.max).toBe("2030-12-31");
    expect(dpt.max).toBe("2031-01-31");
    expect(mr.max).not.toBe(dpt.max);
  });
});

describe("tglTambahBulan — klem terintegrasi lewat batasDosis/minTglDosis (tanggal lahir akhir bulan)", () => {
  const LAHIR_AKHIR_BULAN = "2025-12-31";

  it("minBulan=2 dari lahir 31 Des → klem ke 28 Feb (bukan lompat ke Mar)", () => {
    expect(minTglDosis(LAHIR_AKHIR_BULAN, "ROTA1")).toBe("2026-02-28");
    expect(minTglDosis(LAHIR_AKHIR_BULAN, "PENTA1")).toBe("2026-02-28");
  });

  it("minBulan=18 dari lahir 31 Des → klem ke 30 Jun (Juni cuma 30 hari)", () => {
    expect(minTglDosis(LAHIR_AKHIR_BULAN, "MR_BADUTA")).toBe("2027-06-30");
  });

  it("minBulan=2 dari lahir 31 Des tahun kabisat berikutnya → klem ke 29 Feb", () => {
    expect(minTglDosis("2023-12-31", "ROTA1")).toBe("2024-02-29");
  });
});

describe("batasDosis — interval antar dosis dalam seri (baseline bulan TETAP menghormati interval hari existing)", () => {
  it("PENTA2 (DPT2): 27 hari setelah PENTA1 ditolak, 28 hari lolos", () => {
    const vaksin = { PENTA1: "2026-12-01" }; // contoh pemilik: DPT1 1 Des 2026
    const b = batasDosis(vaksin, "PENTA2", LAHIR);
    expect(b.min).toBe("2026-12-29"); // → DPT2 paling cepat 29 Des 2026
    expect("2026-12-28" < b.min).toBe(true); // 27 hari setelah → ditolak
    expect("2026-12-29" < b.min).toBe(false); // 28 hari setelah → lolos
    expect(b.alasan).toContain("DPT-HB-Hib (1)");
  });

  it("PENTA2 tanpa PENTA1 terisi → slotSyaratSebelum menandai wajib diisi dulu", () => {
    expect(slotSyaratSebelum("PENTA2")).toBe("PENTA1");
    expect(tglDosis({}, "PENTA1")).toBe(""); // belum terisi → pemanggil wajib menolak
  });

  it("varian HEXA2 mengikuti aturan PENTA2 (baseline bulan menang krn interval blm sampai)", () => {
    const vaksin = { HEXA1: "2026-03-01" };
    const b = batasDosis(vaksin, "HEXA2", LAHIR);
    expect(b.min).toBe("2026-04-01"); // baseline lahir+3 bulan (04-01) > HEXA1+28 hari (03-29)
    expect(namaKode("HEXA2")).toBe("DPT-HB-Hib (2)"); // nama ikut slot induk PENTA2
  });

  it("MR_BADUTA minimal 168 hari setelah MR (MR agak terlambat → interval > baseline 18 bulan)", () => {
    const vaksin = { MR: "2027-02-05" }; // jauh sebelum baseline 18 bln (2027-07-01)
    const b = batasDosis(vaksin, "MR_BADUTA", LAHIR);
    const kurang = "2027-07-22"; // 167 hari setelah MR
    const cukup = "2027-07-23"; // 168 hari setelah MR
    expect(b.min).toBe(cukup);
    expect(kurang < b.min).toBe(true); // < MR+168 → ditolak
    expect(cukup < b.min).toBe(false); // = MR+168 → lolos
  });

  it("DPT_BADUTA tanpa PENTA3 terisi → pakai baseline 18 bulan", () => {
    const b = batasDosis({}, "DPT_BADUTA", LAHIR);
    expect(b.min).toBe("2027-07-01");
  });

  it("POLIO2: baseline 2 bulan tetap jadi lantai walau POLIO1 diisi sangat dini (hari-10)", () => {
    const vaksin = { POLIO1: "2026-01-11" }; // hari ke-10 — sah sejak POLIO1 min turun ke 0
    const b = batasDosis(vaksin, "POLIO2", LAHIR);
    expect(b.min).toBe("2026-03-01"); // lahir + 2 bulan (interval dari POLIO1 cuma sampai 02-08, kalah vs baseline)
  });
});

describe("batasDosis — aturan interval lunak (PCV3)", () => {
  it("PCV3 tanpa PCV2 terisi → tidak wajib urut, hanya pakai baseline 12 bulan", () => {
    expect(slotSyaratSebelum("PCV3")).toBeUndefined();
    const b = batasDosis({}, "PCV3", LAHIR);
    expect(b.min).toBe("2027-01-01"); // lahir + 12 bulan, tanpa interval PCV2
  });
});

describe("validasiDosis — validasi menyeluruh + grandfather nilai lama", () => {
  const HB0_H10 = "2026-01-11"; // hari ke-10 — melanggar max 7 (aturan HB0 tak berubah)

  it("dosis baru melanggar aturan → pesan galat", () => {
    expect(validasiDosis({ HB0_1_7H: HB0_H10 }, LAHIR)).toContain("HB0");
    expect(validasiDosis({ BCG: "2027-01-01" }, LAHIR)).toContain("BCG"); // pas ulang tahun-1 → lewat maks 11 bln
  });

  it("dosis seri tanpa dosis sebelumnya → 'Isi dulu ...'", () => {
    expect(validasiDosis({ PENTA2: "2026-05-01" }, LAHIR)).toContain("Isi dulu DPT-HB-Hib (1)");
  });

  it("nilai lama tak berubah di-grandfather (HB0 hari-10 tersimpan → edit lolos)", () => {
    const lama = { HB0_1_7H: HB0_H10 };
    expect(validasiDosis({ HB0_1_7H: HB0_H10 }, LAHIR, lama)).toBeNull();
  });

  it("nilai lama yang DIUBAH tetap divalidasi penuh (HB0 digeser ke hari-12 → ditolak)", () => {
    const lama = { HB0_1_7H: HB0_H10 };
    expect(validasiDosis({ HB0_1_7H: "2026-01-13" }, LAHIR, lama)).toContain("HB0");
  });

  it("dosis BARU di samping nilai grandfathered tetap divalidasi normal", () => {
    const lama = { HB0_1_7H: HB0_H10 };
    const kiriman = { HB0_1_7H: HB0_H10, BCG: "2027-01-01" }; // BCG baru, lewat maks 11 bln → tolak
    expect(validasiDosis(kiriman, LAHIR, lama)).toContain("BCG");
    const sah = { HB0_1_7H: HB0_H10, BCG: "2026-06-01" }; // BCG dalam jendela 0–11 bln → lolos
    expect(validasiDosis(sah, LAHIR, lama)).toBeNull();
  });

  it("grandfather: BCG lama di luar jendela baru (usia 14 bulan) tak memblokir edit field lain", () => {
    const lama = { BCG: "2027-03-01" }; // 14 bulan — sah dulu (aturan lama tanpa maks), kini > maks 11 bln
    // nilai sama, tak berubah → tetap sah (grandfather)
    expect(validasiDosis({ BCG: "2027-03-01" }, LAHIR, lama)).toBeNull();
    // field lain BARU ditambah di samping BCG lama yang grandfathered → tetap sah
    expect(validasiDosis({ BCG: "2027-03-01", HB0_1_7H: "2026-01-05" }, LAHIR, lama)).toBeNull();
    // tapi BCG-nya sendiri DIUBAH (bukan grandfathered lagi) → divalidasi penuh & ditolak
    expect(validasiDosis({ BCG: "2027-03-02" }, LAHIR, lama)).toContain("BCG");
  });
});

describe("pasanganSehari & batasDosis — BCG & bOPV1 satu kunjungan (bukan 2 vaksin lepas)", () => {
  it("POLIO1 memakai jendela dasar sama dengan BCG (min sejak lahir, maks 11 bulan)", () => {
    const bcg = batasDosis({}, "BCG", LAHIR);
    const polio1 = batasDosis({}, "POLIO1", LAHIR);
    expect(polio1.min).toBe(bcg.min);
    expect(polio1.min).toBe("2026-01-01");
    expect(polio1.max).toBe(bcg.max);
    expect(polio1.max).toBe("2026-12-31");
  });

  it("pasanganSehari memetakan BCG<->POLIO1; kode lain tak berpasangan", () => {
    expect(pasanganSehari("BCG")).toBe("POLIO1");
    expect(pasanganSehari("POLIO1")).toBe("BCG");
    expect(pasanganSehari("PENTA1")).toBeUndefined();
  });
});

describe("validasiDosis — BCG & bOPV1 harus satu kunjungan (tanggal sama)", () => {
  it("BCG & POLIO1 beda tanggal → galat pasangan", () => {
    const galat = validasiDosis({ BCG: "2026-01-09", POLIO1: "2026-01-20" }, LAHIR);
    expect(galat).toContain("BCG");
    expect(galat).toContain("bOPV 1");
  });

  it("BCG & POLIO1 tanggal sama → sah", () => {
    expect(validasiDosis({ BCG: "2026-01-09", POLIO1: "2026-01-09" }, LAHIR)).toBeNull();
  });

  it("grandfather utuh: data lama sudah kadung beda tanggal, resubmit persis sama → tak diblokir", () => {
    const lama = { BCG: "2026-01-09", POLIO1: "2026-01-20" };
    expect(validasiDosis({ ...lama }, LAHIR, lama)).toBeNull();
  });

  it("grandfather sebagian: POLIO1 diubah jadi cocok dengan BCG → sah", () => {
    const lama = { BCG: "2026-01-09", POLIO1: "2026-01-20" };
    const kiriman = { BCG: "2026-01-09", POLIO1: "2026-01-09" };
    expect(validasiDosis(kiriman, LAHIR, lama)).toBeNull();
  });

  it("grandfather sebagian: BCG diubah, POLIO1 tetap grandfathered beda tanggal → galat pasangan", () => {
    const lama = { BCG: "2026-01-09", POLIO1: "2026-01-20" };
    const kiriman = { BCG: "2026-01-15", POLIO1: "2026-01-20" };
    const galat = validasiDosis(kiriman, LAHIR, lama);
    expect(galat).toContain("BCG");
    expect(galat).toContain("bOPV 1");
  });
});
