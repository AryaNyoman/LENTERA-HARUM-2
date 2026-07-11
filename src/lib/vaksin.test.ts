import { describe, it, expect } from "vitest";
import {
  DOSIS_REGISTRY,
  SYARAT_IDL,
  SYARAT_IBL,
  lengkap,
  dosisTakBerlaku,
  merekRv,
  merekDpt,
} from "@/lib/vaksin";

describe("katalog kanonik", () => {
  it("20 dosis, nama persis header template SIMPUS", () => {
    expect(DOSIS_REGISTRY).toHaveLength(20);
    expect(DOSIS_REGISTRY[0]).toEqual({ kode: "HB0_1_7H", nama: "HB0", kelompok: "Bayi" });
    expect(DOSIS_REGISTRY.map((d) => d.nama)).toContain("Campak-Rubella (MR) Baduta");
  });
});

describe("IDL/IBL — definisi 2026 (tanpa PCV & Rotavirus)", () => {
  const dasar: Record<string, string> = {
    HB0_1_7H: "2025-01-10", BCG: "2025-02-10",
    POLIO1: "2025-02-10", POLIO2: "2025-03-10", POLIO3: "2025-04-10", POLIO4: "2025-05-10",
    PENTA1: "2025-03-10", PENTA2: "2025-04-10", PENTA3: "2025-05-10",
    IPV1: "2025-05-10", MR: "2025-10-10",
  };
  it("lengkap tanpa PCV & Rotavirus → IDL", () => {
    expect(lengkap(dasar, SYARAT_IDL)).toBe(true);
  });
  it("jalur Hexavalen tanpa IPV1 → tetap IDL", () => {
    const v = { ...dasar, PENTA1: "", HEXA1: "2025-03-10", PENTA2: "", HEXA2: "2025-04-10", PENTA3: "", HEXA3: "2025-05-10", IPV1: "" };
    expect(lengkap(v, SYARAT_IDL)).toBe(true);
  });
  it("tanpa MR → bukan IDL", () => {
    expect(lengkap({ ...dasar, MR: "" }, SYARAT_IDL)).toBe(false);
  });
  it("IBL = DPT + MR baduta, tanpa PCV3", () => {
    expect(lengkap({ DPT_BADUTA: "2026-01-10", MR_BADUTA: "2026-02-10" }, SYARAT_IBL)).toBe(true);
    expect(lengkap({ DPT_BADUTA: "2026-01-10" }, SYARAT_IBL)).toBe(false);
  });
});

describe("aturan merek", () => {
  it("Rotarix → ROTA3 tak berlaku; Rotavac → tetap berlaku", () => {
    expect(merekRv({ ROTARIX1: "2025-03-10" })).toBe("ROTARIX");
    expect(dosisTakBerlaku("ROTA3", { ROTARIX1: "2025-03-10" })).toBe(true);
    expect(dosisTakBerlaku("ROTA3", { ROTA1: "2025-03-10" })).toBe(false);
  });
  it("Hexavalen → IPV1/IPV2 tak berlaku", () => {
    expect(merekDpt({ HEXA2: "2025-04-10" })).toBe("HEXAVALEN");
    expect(dosisTakBerlaku("IPV1", { HEXA2: "2025-04-10" })).toBe(true);
    expect(dosisTakBerlaku("IPV2", { PENTA1: "2025-03-10" })).toBe(false);
  });
});
