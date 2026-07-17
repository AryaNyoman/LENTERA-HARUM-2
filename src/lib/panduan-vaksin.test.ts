import { describe, it, expect } from "vitest";
import { PANDUAN_VAKSIN } from "@/lib/panduan-vaksin";

const KUNCI_WAJIB = ["manfaat", "pasca", "batasUsia", "kejar"] as const;

describe("PANDUAN_VAKSIN", () => {
  it("9 jenis vaksin sesuai daftar PLAN (HB0..dosis Baduta)", () => {
    expect(PANDUAN_VAKSIN).toHaveLength(9);
    expect(PANDUAN_VAKSIN.map((v) => v.id)).toEqual([
      "hb0", "bcg", "polio-tetes", "penta-hexa", "pcv", "rotavirus", "ipv", "mr", "baduta",
    ]);
  });

  it("id unik", () => {
    const id = PANDUAN_VAKSIN.map((v) => v.id);
    expect(new Set(id).size).toBe(id.length);
  });

  it.each(PANDUAN_VAKSIN)("$nama — 4 seksi wajib terisi, 2-4 kalimat tiap seksi", (v) => {
    for (const kunci of KUNCI_WAJIB) {
      const teks = v[kunci];
      expect(teks.length).toBeGreaterThan(0);
      const jumlahKalimat = (teks.match(/[.!?]+(?:\s|$)/g) ?? []).length;
      expect(jumlahKalimat).toBeGreaterThanOrEqual(2);
      expect(jumlahKalimat).toBeLessThanOrEqual(4);
    }
  });

  it("selaras Catatan NTB — Rotarix 2 dosis, Rotavac 3 dosis, batas usia rotavirus ditandai ketat", () => {
    const rota = PANDUAN_VAKSIN.find((v) => v.id === "rotavirus")!;
    expect(rota.batasUsia).toMatch(/Rotarix cukup 2 dosis/);
    expect(rota.batasUsia).toMatch(/Rotavac perlu 3 dosis/);
    expect(rota.batasUsia).toMatch(/KETAT/);
  });

  it("BCG >6 bulan perlu uji tuberkulin (selaras JADWAL existing)", () => {
    const bcg = PANDUAN_VAKSIN.find((v) => v.id === "bcg")!;
    expect(bcg.batasUsia).toMatch(/uji tuberkulin/);
  });
});
