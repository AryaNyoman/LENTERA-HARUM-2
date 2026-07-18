import { describe, it, expect, vi } from "vitest";

// pengaturan.ts memakai `import "server-only"` (dipakai ambilPengaturan yang menyentuh
// db) — lempar error di luar bundel Next.js, termasuk di vitest. Pola sama persis
// dgn sinkron-diff.test.ts: ganti modul kosong khusus test ini saja.
vi.mock("server-only", () => ({}));

import { parsePengaturan, urlSah, DEFAULT_LINK_BPJS } from "@/lib/pengaturan";

describe("parsePengaturan — baca JSON pengaturan Pojok Baca, fallback per-field", () => {
  it("kosong/null/undefined → default (BPJS Play Store, Drive kosong)", () => {
    expect(parsePengaturan(null)).toEqual({ linkBpjs: DEFAULT_LINK_BPJS, linkDrive: "" });
    expect(parsePengaturan(undefined)).toEqual({ linkBpjs: DEFAULT_LINK_BPJS, linkDrive: "" });
    expect(parsePengaturan("")).toEqual({ linkBpjs: DEFAULT_LINK_BPJS, linkDrive: "" });
  });

  it("JSON lengkap → dipakai apa adanya", () => {
    const json = JSON.stringify({ linkBpjs: "https://bpjs.contoh", linkDrive: "https://drive.contoh" });
    expect(parsePengaturan(json)).toEqual({ linkBpjs: "https://bpjs.contoh", linkDrive: "https://drive.contoh" });
  });

  it("field hilang/salah tipe → fallback default PER FIELD (bukan seluruh objek)", () => {
    expect(parsePengaturan(JSON.stringify({ linkDrive: "https://drive.contoh" })))
      .toEqual({ linkBpjs: DEFAULT_LINK_BPJS, linkDrive: "https://drive.contoh" });
    expect(parsePengaturan(JSON.stringify({ linkBpjs: 123, linkDrive: "https://drive.contoh" })))
      .toEqual({ linkBpjs: DEFAULT_LINK_BPJS, linkDrive: "https://drive.contoh" });
  });

  it("JSON rusak → default (tidak melempar)", () => {
    expect(parsePengaturan("{bukan json")).toEqual({ linkBpjs: DEFAULT_LINK_BPJS, linkDrive: "" });
  });
});

describe("urlSah — validasi link pengaturan Pojok Baca (simpanPengaturanPojok)", () => {
  it("kosong lolos (belum diisi)", () => {
    expect(urlSah("")).toBe(true);
  });
  it("https:// lolos", () => {
    expect(urlSah("https://play.google.com/x")).toBe(true);
  });
  it("http:// (bukan https) ditolak", () => {
    expect(urlSah("http://contoh.com")).toBe(false);
  });
  it("skema lain (javascript:, data:) ditolak", () => {
    expect(urlSah("javascript:alert(1)")).toBe(false);
    expect(urlSah("data:text/html,x")).toBe(false);
  });
});
