import { describe, it, expect } from "vitest";
import { galatDosisTerkunci } from "@/lib/kunci-dosis";

// Gerbang server dipakai bacaFormAnak saat bolehUbahVaksin=false (kader & ortu — keputusan
// pemilik 18 Jul 2026). Input disabled di HTML tak pernah ikut ter-submit browser — jadi
// kasus normal (form terkunci) selalu kirim vaksin={} walau vaksinLama terisi; hanya kode
// yang BENAR-BENAR ikut ter-submit (mis. field ditamper via devtools) yang dicek.
describe("galatDosisTerkunci — gerbang bolehUbahVaksin=false", () => {
  it("tak ada field vaksin terkirim (form disabled normal) → lolos walau vaksinLama terisi", () => {
    expect(galatDosisTerkunci({}, { BCG: "2025-01-10", HB0_1_7H: "2025-01-01" })).toBeNull();
  });

  it("anak baru (vaksinLama kosong): field vaksin ikut terkirim (form ditamper) → ditolak", () => {
    expect(galatDosisTerkunci({ BCG: "2025-01-10" }, {})).toMatch(/petugas/);
  });

  it("anak baru: benar-benar tak ada apa pun terkirim → lolos (default vaksinLama={})", () => {
    expect(galatDosisTerkunci({})).toBeNull();
  });

  it("nilai terkirim identik dgn vaksinLama → lolos", () => {
    const lama = { BCG: "2025-01-10" };
    expect(galatDosisTerkunci({ BCG: "2025-01-10" }, lama)).toBeNull();
  });

  it("nilai terkirim beda dari vaksinLama (ditamper) → ditolak dgn pesan jelas", () => {
    const lama = { BCG: "2025-01-10" };
    expect(galatDosisTerkunci({ BCG: "2025-02-01" }, lama)).toMatch(/petugas/);
  });

  it("kode baru yg tak ada di vaksinLama ikut terkirim (ditamper) → ditolak", () => {
    const lama = { BCG: "2025-01-10" };
    expect(galatDosisTerkunci({ ...lama, HB0_1_7H: "2025-01-01" }, lama)).toMatch(/petugas/);
  });
});
