import { describe, it, expect } from "vitest";
import { labelOrtuRtRw } from "@/lib/anak-tampilan";

describe("labelOrtuRtRw — baris sekunder 'ortu: X · RT/RW Y' di kartu anak", () => {
  it("keduanya ada → digabung dgn ' · '", () => {
    expect(labelOrtuRtRw("Budi", "003/001")).toBe("ortu: Budi · RT/RW 003/001");
  });

  it("rtRw kosong → hanya ortu, tanpa pemisah menggantung", () => {
    expect(labelOrtuRtRw("Budi", "")).toBe("ortu: Budi");
  });

  it("namaOrtu kosong → hanya RT/RW, tanpa pemisah menggantung", () => {
    expect(labelOrtuRtRw("", "003/001")).toBe("RT/RW 003/001");
  });

  it("keduanya kosong → string kosong (bukan '· ' atau 'undefined')", () => {
    expect(labelOrtuRtRw("", "")).toBe("");
  });
});
