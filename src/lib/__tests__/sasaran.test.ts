import { describe, it, expect } from "vitest";
import { kelompokUmurSasaran, dosisJatuhTempo, perluSasaran, kelompokkanJadwal } from "@/lib/sasaran";
import type { JadwalRingkas } from "@/lib/sasaran";

// LAHIR sama dgn konvensi aturan-dosis.test.ts — nilai min/max slot yang dikutip di
// bawah adalah nilai yang SUDAH teruji di aturan-dosis.test.ts utk tglLahir ini (reuse,
// bukan hitung ulang, supaya test ini tetap konsisten dgn sumber kebenaran batasDosis).
const LAHIR = "2026-01-01";

describe("kelompokUmurSasaran — batas kelompok umur sweeping", () => {
  it("0 bulan (baru lahir) → muda", () => {
    expect(kelompokUmurSasaran(0)).toBe("muda");
  });

  it("24 bulan → muda, 25 bulan → tua (batas kelompok muda/tua)", () => {
    expect(kelompokUmurSasaran(24)).toBe("muda");
    expect(kelompokUmurSasaran(25)).toBe("tua");
  });

  it("60 bulan → tua (masih disweeping), 61 bulan → null (drop-out)", () => {
    expect(kelompokUmurSasaran(60)).toBe("tua");
    expect(kelompokUmurSasaran(61)).toBeNull();
  });
});

describe("dosisJatuhTempo — dosis sudah diberi (adaDosis true) tak masuk hasil", () => {
  it("BCG sudah disuntik → tak muncul walau tanggal sudah lewat jatuh tempo", () => {
    const vaksin = { BCG: "2026-02-01" };
    const hasil = dosisJatuhTempo(vaksin, LAHIR, "2026-03-01");
    expect(hasil.some((d) => d.kode === "BCG")).toBe(false);
  });
});

describe("dosisJatuhTempo — belum jatuh tempo (padaTanggal < batas.min) tak masuk", () => {
  it("PENTA1 (min 2026-03-01) belum muncul pada 2026-02-01, tapi BCG (min sejak lahir) sudah", () => {
    const hasil = dosisJatuhTempo({}, LAHIR, "2026-02-01");
    expect(hasil.some((d) => d.kode === "PENTA1")).toBe(false);
    expect(hasil.some((d) => d.kode === "BCG")).toBe(true); // sanity: bukan hasil kosong semua
  });
});

describe("dosisJatuhTempo — status kuning/merah (ambang 30 hari sejak batas.min)", () => {
  it("pas jatuh tempo (hari-0, == batas.min) → kuning, nama terisi dari namaKode", () => {
    const hasil = dosisJatuhTempo({}, LAHIR, "2026-01-01"); // == BCG min
    const bcg = hasil.find((d) => d.kode === "BCG");
    expect(bcg?.status).toBe("kuning");
    expect(bcg?.nama).toBe("BCG");
  });

  it("30 hari sejak jatuh tempo → masih kuning, 31 hari → merah", () => {
    const kuning = dosisJatuhTempo({}, LAHIR, "2026-01-31").find((d) => d.kode === "BCG");
    const merah = dosisJatuhTempo({}, LAHIR, "2026-02-01").find((d) => d.kode === "BCG");
    expect(kuning?.status).toBe("kuning");
    expect(merah?.status).toBe("merah");
  });
});

describe("dosisJatuhTempo — lewat batas.max tak masuk lagi", () => {
  it("ROTA1 (max 2026-05-31) masih ada di batas hari terakhir, hilang sehari setelahnya", () => {
    const dalamJendela = dosisJatuhTempo({}, LAHIR, "2026-05-31");
    const lewatJendela = dosisJatuhTempo({}, LAHIR, "2026-06-01");
    expect(dalamJendela.some((d) => d.kode === "ROTA1")).toBe(true);
    expect(lewatJendela.some((d) => d.kode === "ROTA1")).toBe(false);
  });
});

describe("dosisJatuhTempo — HB0 tak pernah muncul (diberi saat lahir, bukan target sweeping)", () => {
  it("HB0 absen dari hasil walau vaksin kosong & tanggal dlm jendela 0-7 harinya", () => {
    const hasil = dosisJatuhTempo({}, LAHIR, "2026-01-05");
    expect(hasil.some((d) => d.kode === "HB0_1_7H")).toBe(false);
  });
});

describe("dosisJatuhTempo — varian merek (dosisTakBerlaku) dihormati", () => {
  it("Hexavalen (HEXA1) → IPV1 tak berlaku & tak muncul; Pentavalen (PENTA1) → IPV1 tetap muncul", () => {
    const hexa = dosisJatuhTempo({ HEXA1: "2026-03-01" }, LAHIR, "2026-06-01");
    const penta = dosisJatuhTempo({ PENTA1: "2026-03-01" }, LAHIR, "2026-06-01");
    expect(hexa.some((d) => d.kode === "IPV1")).toBe(false);
    expect(penta.some((d) => d.kode === "IPV1")).toBe(true);
  });

  it("Rotarix (ROTARIX1) → ROTA3 tak berlaku & tak muncul; Rotavac (ROTA1) → ROTA3 tetap muncul", () => {
    const rotarix = dosisJatuhTempo({ ROTARIX1: "2026-03-01" }, LAHIR, "2026-06-01");
    const rotavac = dosisJatuhTempo({ ROTA1: "2026-03-01" }, LAHIR, "2026-06-01");
    expect(rotarix.some((d) => d.kode === "ROTA3")).toBe(false);
    expect(rotavac.some((d) => d.kode === "ROTA3")).toBe(true);
  });
});

describe("perluSasaran — gabungan kelompok umur & dosisJatuhTempo", () => {
  it("ada dosis jatuh tempo & bukan drop-out → true", () => {
    expect(perluSasaran({}, LAHIR, "2026-01-01")).toBe(true); // BCG/POLIO1 jatuh tempo hari-0
  });

  it("satu-satunya dosis yg jatuh tempo sejauh ini sudah diberi → false (bukan krn drop-out)", () => {
    const vaksin = { BCG: LAHIR, POLIO1: LAHIR }; // hanya ini yg due di hari-0, keduanya sudah diisi
    expect(perluSasaran(vaksin, LAHIR, LAHIR)).toBe(false);
  });

  it("drop-out (>60 bulan pada padaTanggal) → selalu false apa pun status vaksinnya", () => {
    expect(perluSasaran({}, LAHIR, "2031-06-01")).toBe(false); // ~65 bulan, tak divaksin sama sekali
  });
});

describe("kelompokkanJadwal — bucket hariIni/besok/kemarin dari baris JadwalPosyandu", () => {
  const acuan = new Date(2026, 6, 21); // 21 Jul 2026 (lokal) — "hari ini" acuan tetap utk grup ini

  it("tanggal cocok hari-ini/besok/kemarin masuk bucket masing-masing", () => {
    const hariIni: JadwalRingkas = { posyanduId: 1, tahun: 2026, bulan: 7, tanggal: 21, namaPosyandu: "" };
    const besok: JadwalRingkas = { posyanduId: 1, tahun: 2026, bulan: 7, tanggal: 22, namaPosyandu: "" };
    const kemarin: JadwalRingkas = { posyanduId: 1, tahun: 2026, bulan: 7, tanggal: 20, namaPosyandu: "" };
    const hasil = kelompokkanJadwal([hariIni, besok, kemarin], acuan);
    expect(hasil.hariIni).toEqual([hariIni]);
    expect(hasil.besok).toEqual([besok]);
    expect(hasil.kemarin).toEqual([kemarin]);
  });

  it("2 hari lalu / lusa tak masuk bucket manapun", () => {
    const duaHariLalu: JadwalRingkas = { posyanduId: 1, tahun: 2026, bulan: 7, tanggal: 19, namaPosyandu: "" };
    const lusa: JadwalRingkas = { posyanduId: 1, tahun: 2026, bulan: 7, tanggal: 23, namaPosyandu: "" };
    const hasil = kelompokkanJadwal([duaHariLalu, lusa], acuan);
    expect(hasil.hariIni).toEqual([]);
    expect(hasil.besok).toEqual([]);
    expect(hasil.kemarin).toEqual([]);
  });

  it("rollover akhir bulan: acuan 31 Jan, jadwal 1 Feb → besok (bukan lompat ke Mar)", () => {
    const akhirJan = new Date(2026, 0, 31);
    const besokFeb: JadwalRingkas = { posyanduId: 1, tahun: 2026, bulan: 2, tanggal: 1, namaPosyandu: "" };
    const hasil = kelompokkanJadwal([besokFeb], akhirJan);
    expect(hasil.besok).toEqual([besokFeb]);
    expect(hasil.hariIni).toEqual([]);
    expect(hasil.kemarin).toEqual([]);
  });

  it("rollover akhir tahun: acuan 31 Des 2026, jadwal 1 Jan 2027 → besok", () => {
    const akhirTahun = new Date(2026, 11, 31);
    const besokTahunBaru: JadwalRingkas = { posyanduId: 1, tahun: 2027, bulan: 1, tanggal: 1, namaPosyandu: "" };
    const hasil = kelompokkanJadwal([besokTahunBaru], akhirTahun);
    expect(hasil.besok).toEqual([besokTahunBaru]);
  });

  it("2 baris posyandu sama & bulan sama, beda namaPosyandu → diproses independen (bukan digabung/hilang)", () => {
    const dusunA: JadwalRingkas = { posyanduId: 1, tahun: 2026, bulan: 7, tanggal: 21, namaPosyandu: "Dusun A" };
    const dusunB: JadwalRingkas = { posyanduId: 1, tahun: 2026, bulan: 7, tanggal: 21, namaPosyandu: "Dusun B" };
    const hasil = kelompokkanJadwal([dusunA, dusunB], acuan);
    expect(hasil.hariIni).toEqual([dusunA, dusunB]);
  });

  it("array jadwal kosong → 3 bucket kosong, tak error", () => {
    expect(kelompokkanJadwal([], acuan)).toEqual({ hariIni: [], besok: [], kemarin: [] });
  });
});
