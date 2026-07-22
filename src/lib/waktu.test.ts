import { describe, it, expect } from "vitest";
import { formatWaktuIndo } from "@/lib/waktu";

describe("formatWaktuIndo — waktu selalu WITA (Asia/Makassar) apa pun timezone server", () => {
  // 2026-07-19T20:30 UTC = 2026-07-20 pukul 04.30 WITA (beda HARI & JAM). Membuktikan geser
  // +8 konsisten walau proses jalan di UTC (Vercel) — assertion hardcode, bukan turunan TZ mesin.
  const instan = new Date("2026-07-19T20:30:00.000Z");

  it("menggeser 20.30 UTC → 04.30 tanggal berikutnya (WITA)", () => {
    const hasil = formatWaktuIndo(instan);
    expect(hasil).toContain("20/7/2026"); // hari bergeser +1 (bukan 19/7)
    expect(hasil).toContain("04.30"); // jam bergeser +8 dari 20.30 UTC
  });
});
