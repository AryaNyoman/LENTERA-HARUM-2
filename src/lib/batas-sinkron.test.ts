import { describe, it, expect, vi } from "vitest";

// batas-sinkron.ts memakai `import "server-only"` (dipakai bareng sisaBatasSinkron yg
// butuh db) — melempar error di luar bundel Next.js, termasuk di vitest. Pola sama persis
// dgn src/lib/__tests__/sinkron-diff.test.ts (tak menyentuh vitest.config.ts).
vi.mock("server-only", () => ({}));

import { cekBatasSinkron } from "@/lib/batas-sinkron";
import { formatWaktuIndo } from "@/lib/waktu";

const JAM_MS = 3_600_000;

/** `menit` menit sebelum `sekarang` — pakai menit (integer) supaya batas pas 24 jam/120 jam
 *  presisi tanpa masalah pembulatan float. */
function menitLalu(sekarang: Date, menit: number): Date {
  return new Date(sekarang.getTime() - menit * 60_000);
}

describe("cekBatasSinkron — gerbang batas sinkron manual (24 jam DAN 120 jam, berlaku bersamaan)", () => {
  const sekarang = new Date("2026-07-19T12:00:00.000Z");

  it("kosong (belum pernah sinkron) → boleh", () => {
    expect(cekBatasSinkron([], sekarang)).toEqual({ boleh: true });
  });

  it("1 percobaan dalam 24 jam terakhir → tolak, alasan sebut 'hari ini'", () => {
    const hasil = cekBatasSinkron([menitLalu(sekarang, 2 * 60)], sekarang);
    expect(hasil.boleh).toBe(false);
    if (!hasil.boleh) expect(hasil.alasan.toLowerCase()).toContain("hari ini");
  });

  it("3 percobaan dalam 120 jam (masing2 >24 jam terpisah, tiap satu lolos aturan harian) → tolak '3x/5 hari' + kapan boleh lagi", () => {
    const terlama = menitLalu(sekarang, 100 * 60); // 100 jam lalu — ini yg pertama keluar jendela
    const waktu = [terlama, menitLalu(sekarang, 60 * 60), menitLalu(sekarang, 30 * 60)];
    const hasil = cekBatasSinkron(waktu, sekarang);
    expect(hasil.boleh).toBe(false);
    if (!hasil.boleh) {
      expect(hasil.alasan).toContain("3x");
      expect(hasil.alasan.toLowerCase()).toContain("5 hari");
      const bolehLagi = new Date(terlama.getTime() + 120 * JAM_MS);
      expect(hasil.alasan).toContain(formatWaktuIndo(bolehLagi));
    }
  });

  it("kurangi jadi 2 percobaan dalam 120 jam (semua >24 jam) → boleh", () => {
    const waktu = [menitLalu(sekarang, 90 * 60), menitLalu(sekarang, 40 * 60)];
    expect(cekBatasSinkron(waktu, sekarang)).toEqual({ boleh: true });
  });

  it("boundary 24 jam: 23j59m masih tolak, 24j01m sudah boleh", () => {
    const tolak = cekBatasSinkron([menitLalu(sekarang, 23 * 60 + 59)], sekarang);
    expect(tolak.boleh).toBe(false);
    const boleh = cekBatasSinkron([menitLalu(sekarang, 24 * 60 + 1)], sekarang);
    expect(boleh.boleh).toBe(true);
  });

  it("boundary 120 jam: 119j59m masih terhitung (jadi 3, tolak), 120j01m sudah lepas jendela (jadi 2, boleh)", () => {
    // 2 percobaan dasar yg pasti >24 jam (tak kena aturan harian) supaya yg diuji murni aturan 120 jam
    const dasar = [menitLalu(sekarang, 90 * 60), menitLalu(sekarang, 60 * 60)];
    const tolak = cekBatasSinkron([...dasar, menitLalu(sekarang, 119 * 60 + 59)], sekarang);
    expect(tolak.boleh).toBe(false);
    const boleh = cekBatasSinkron([...dasar, menitLalu(sekarang, 120 * 60 + 1)], sekarang);
    expect(boleh.boleh).toBe(true);
  });

  it("campuran — lolos aturan 24 jam (semua >24 jam) tapi kena aturan 120 jam (3x)", () => {
    const waktu = [menitLalu(sekarang, 110 * 60), menitLalu(sekarang, 70 * 60), menitLalu(sekarang, 30 * 60)];
    const hasil = cekBatasSinkron(waktu, sekarang);
    expect(hasil.boleh).toBe(false);
    if (!hasil.boleh) expect(hasil.alasan.toLowerCase()).toContain("5 hari");
  });

  it("campuran — sebaliknya: kena aturan 24 jam (baru 1x) meski lolos aturan 120 jam", () => {
    const hasil = cekBatasSinkron([menitLalu(sekarang, 60)], sekarang);
    expect(hasil.boleh).toBe(false);
    if (!hasil.boleh) expect(hasil.alasan.toLowerCase()).toContain("hari ini");
  });

  it("percobaan >120 jam lalu tak dihitung sama sekali (jendela sudah lepas)", () => {
    const waktu = [menitLalu(sekarang, 200 * 60), menitLalu(sekarang, 150 * 60)];
    expect(cekBatasSinkron(waktu, sekarang)).toEqual({ boleh: true });
  });
});
