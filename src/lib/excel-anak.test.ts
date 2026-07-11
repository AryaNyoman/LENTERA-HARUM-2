import { describe, it, expect } from "vitest";
import { bangunExcelAnak, keDDMMYYYY, HEADER_EXPORT } from "@/lib/excel-anak";

const contoh = {
  isi: {
    nama: "Putu Ayu Lestari", tglLahir: "2025-11-02", jk: "P" as const,
    namaOrtu: "Kadek Ratna", nik: "5271031234560002", noHp: "081900000002",
    alamat: "Jl. Selaparang 8", rtRw: "001/002",
    vaksin: { HB0_1_7H: "2025-11-02", HEXA1: "2026-01-05", ROTARIX1: "2026-01-05" },
  },
  posyanduNama: "Nesa Timur",
};

describe("export Excel format Impor Data Anak SIMPUS", () => {
  it("header persis template SIMPUS: 9 identitas + 20 dosis", () => {
    expect(HEADER_EXPORT.slice(0, 9)).toEqual([
      "Nama", "Tgl Lahir", "JK (L/P)", "Nama Ortu", "NIK", "No HP", "Alamat", "RT/RW", "Posyandu",
    ]);
    expect(HEADER_EXPORT).toHaveLength(29);
    expect(HEADER_EXPORT[9]).toBe("HB0");
    expect(HEADER_EXPORT[28]).toBe("Campak-Rubella (MR) Baduta");
  });

  it("tanggal DD/MM/YYYY & varian merek masuk kolom slot", () => {
    const ws = bangunExcelAnak([contoh]).getWorksheet("Data Anak")!;
    const nilai = (ws.getRow(2).values as (string | undefined)[]).slice(1);
    expect(nilai[0]).toBe("Putu Ayu Lestari");
    expect(nilai[1]).toBe("02/11/2025");
    expect(nilai[8]).toBe("Nesa Timur");
    expect(nilai[9]).toBe("02/11/2025"); // HB0
    // HEXA1 → kolom slot "DPT-HB-Hib (1)" (indeks header 12)
    expect(HEADER_EXPORT[12]).toBe("DPT-HB-Hib (1)");
    expect(nilai[12]).toBe("05/01/2026");
    // ROTARIX1 → kolom "Rotavirus 1" (indeks 15)
    expect(HEADER_EXPORT[15]).toBe("Rotavirus 1");
    expect(nilai[15]).toBe("05/01/2026");
  });

  it("keDDMMYYYY aman utk kosong/invalid", () => {
    expect(keDDMMYYYY("")).toBe("");
    expect(keDDMMYYYY("bukan")).toBe("");
  });
});
