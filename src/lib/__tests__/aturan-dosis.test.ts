import { describe, it, expect } from "vitest";
import { batasDosis, slotSyaratSebelum, tglDosis, namaKode, validasiDosis, pasanganSehari } from "@/lib/vaksin";

const LAHIR = "2026-01-01";

describe("batasDosis — jendela usia dasar", () => {
  it("HB0: hari-8 ditolak (lewat max 7), hari-7 lolos", () => {
    const b = batasDosis({}, "HB0_1_7H", LAHIR);
    expect(b.max).toBe("2026-01-08"); // lahir + 7 hari
    expect("2026-01-09" > b.max!).toBe(true); // hari ke-8 → ditolak
    expect("2026-01-08" > b.max!).toBe(false); // hari ke-7 → lolos
  });

  it("BCG: hari-7 ditolak, hari-8 lolos (min 8, tanpa max)", () => {
    const b = batasDosis({}, "BCG", LAHIR);
    expect(b.min).toBe("2026-01-09"); // lahir + 8 hari
    expect(b.max).toBeUndefined();
    expect("2026-01-08" < b.min).toBe(true); // hari ke-7 → ditolak
    expect("2026-01-09" < b.min).toBe(false); // hari ke-8 → lolos
  });
});

describe("batasDosis — interval antar dosis dalam seri", () => {
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

  it("varian HEXA2 mengikuti aturan PENTA2 (interval dihitung dari HEXA1)", () => {
    const vaksin = { HEXA1: "2026-03-01" };
    const b = batasDosis(vaksin, "HEXA2", LAHIR);
    expect(b.min).toBe("2026-03-29"); // HEXA1 + 28 hari
    expect(namaKode("HEXA2")).toBe("DPT-HB-Hib (2)"); // nama ikut slot induk PENTA2
  });

  it("MR_BADUTA minimal 168 hari setelah MR (MR agak terlambat → interval > baseline 504 hari)", () => {
    const vaksin = { MR: "2027-02-05" }; // hari ke-400 sejak lahir
    const b = batasDosis(vaksin, "MR_BADUTA", LAHIR);
    const kurang = "2027-07-22"; // 167 hari setelah MR
    const cukup = "2027-07-23"; // 168 hari setelah MR
    expect(b.min).toBe(cukup);
    expect(kurang < b.min).toBe(true); // < MR+168 → ditolak
    expect(cukup < b.min).toBe(false); // = MR+168 → lolos
  });

  it("POLIO2: baseline 56 hari tetap jadi lantai walau POLIO1 diisi sangat dini (hari-10)", () => {
    const vaksin = { POLIO1: "2026-01-11" }; // hari ke-10 — sah sejak POLIO1 minHari turun ke 8
    const b = batasDosis(vaksin, "POLIO2", LAHIR);
    expect(b.min).toBe("2026-02-26"); // lahir + 56 hari (interval dari POLIO1 cuma +38, kalah vs baseline)
  });
});

describe("batasDosis — aturan interval lunak (PCV3)", () => {
  it("PCV3 tanpa PCV2 terisi → tidak wajib urut, hanya pakai baseline 336 hari", () => {
    expect(slotSyaratSebelum("PCV3")).toBeUndefined();
    const b = batasDosis({}, "PCV3", LAHIR);
    expect(b.min).toBe("2026-12-03"); // lahir + 336 hari, tanpa interval PCV2
  });
});

describe("validasiDosis — validasi menyeluruh + grandfather nilai lama", () => {
  const HB0_H10 = "2026-01-11"; // hari ke-10 — sah menurut aturan lama, melanggar max 7 sekarang

  it("dosis baru melanggar aturan → pesan galat", () => {
    expect(validasiDosis({ HB0_1_7H: HB0_H10 }, LAHIR)).toContain("HB0");
    expect(validasiDosis({ BCG: "2026-01-08" }, LAHIR)).toContain("BCG"); // hari-7 < min 8
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
    const kiriman = { HB0_1_7H: HB0_H10, BCG: "2026-01-08" }; // BCG baru, hari-7 → tolak
    expect(validasiDosis(kiriman, LAHIR, lama)).toContain("BCG");
    const sah = { HB0_1_7H: HB0_H10, BCG: "2026-01-09" }; // BCG hari-8 → lolos
    expect(validasiDosis(sah, LAHIR, lama)).toBeNull();
  });
});

describe("pasanganSehari & batasDosis — BCG & bOPV1 satu kunjungan (bukan 2 vaksin lepas)", () => {
  it("POLIO1 memakai jendela dasar sama dengan BCG (min 8 hari, bukan 28 — tanpa jarak)", () => {
    const bcg = batasDosis({}, "BCG", LAHIR);
    const polio1 = batasDosis({}, "POLIO1", LAHIR);
    expect(polio1.min).toBe(bcg.min);
    expect(polio1.min).toBe("2026-01-09"); // lahir + 8 hari
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
