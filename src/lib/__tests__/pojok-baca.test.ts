import { describe, it, expect } from "vitest";
import { nomorInternasional, JADWAL_HARI, KONTAK, LINK_BPJS, LINK_DRIVE } from "@/lib/pojok-baca";

describe("nomorInternasional — normalisasi nomor HP utk link wa.me/tel", () => {
  it("nomor lokal 08xxx → 62xxx (tanpa +)", () => {
    expect(nomorInternasional("081900000001")).toBe("6281900000001");
  });

  it("nomor dgn spasi/strip dibersihkan dulu", () => {
    expect(nomorInternasional("0819-0000-0001")).toBe("6281900000001");
  });

  it("nomor sudah format 62xxx dibiarkan", () => {
    expect(nomorInternasional("6281900000001")).toBe("6281900000001");
  });

  it("string kosong → string kosong (bukan '62')", () => {
    expect(nomorInternasional("")).toBe("");
  });
});

describe("konstanta data Pojok Baca — bentuk & default placeholder", () => {
  it("JADWAL_HARI berisi Jumat & Sabtu sesuai jadwal Puskesmas Cakranegara", () => {
    const hari = JADWAL_HARI.map((j) => j.hari);
    expect(hari).toContain("Jumat");
    expect(hari).toContain("Sabtu");
  });

  it("LINK_BPJS, LINK_DRIVE, KONTAK default kosong (placeholder — belum diisi petugas)", () => {
    expect(LINK_BPJS).toBe("");
    expect(LINK_DRIVE).toBe("");
    expect(KONTAK).toEqual([]);
  });
});
