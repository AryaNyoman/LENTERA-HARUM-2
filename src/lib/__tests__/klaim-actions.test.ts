import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

// klaim-actions.ts (dan @/lib/anak yang ditariknya) memakai `import "server-only"`,
// yang melempar error di luar bundel Next.js — sama pola src/lib/__tests__/sinkron-diff.test.ts
// & vaksin-admin-actions.test.ts.
vi.mock("server-only", () => ({}));

// wajibUser (sesi.ts) memanggil next/headers cookies() — butuh request scope Next.js yang
// tak ada di vitest. Mock bisa diarahkan ulang per-test (KADER / ORTU) via mockResolvedValue.
const wajibUserMock = vi.fn();
vi.mock("@/lib/sesi", () => ({
  wajibUser: (...args: string[]) => wajibUserMock(...args),
}));

// Alihkan @/lib/db ke SALINAN dev.db di folder temp (pola sama sinkron-diff.test.ts /
// vaksin-admin-actions.test.ts) — dev.db asli hanya dibaca utk copy, tak pernah ditulis.
vi.mock("@/lib/db", async () => {
  const { PrismaClient } = await import("@prisma/client");
  const fs = await import("node:fs");
  const path = await import("node:path");
  const os = await import("node:os");
  const asal = path.resolve(process.cwd(), "prisma", "dev.db");
  const salinan = path.join(os.tmpdir(), "simpus-posyandu-uji-klaim-actions.db");
  fs.copyFileSync(asal, salinan);
  return { db: new PrismaClient({ datasourceUrl: "file:" + salinan.split(path.sep).join("/") }) };
});

import { kelurahanCocok, pakaiKode, putusKlaimKader } from "@/lib/klaim-actions";
import { db } from "@/lib/db";

/** Token uji yg lolos validasi pakaiKode (/^[A-Z2-9]{8}$/ — TANPA 0/1), pola sama kodeBaru()
 *  di klaim-actions.ts (duplikasi kecil disengaja, hindari export helper privat lintas modul). */
let counterToken = 0;
function tokenUji(): string {
  const HURUF = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let n = Date.now() + counterToken++;
  let s = "";
  for (let i = 0; i < 8; i++) {
    s += HURUF[n % HURUF.length];
    n = Math.floor(n / HURUF.length) + 17;
  }
  return s;
}

/** redirect() Next.js melempar Error ber-.digest = "NEXT_REDIRECT;<type>;<url>;<status>;"
 *  di luar konteks request (lihat next/dist/client/components/redirect.js) — tangkap &
 *  pecah jadi url, pola sama src/lib/sinkron-actions.ts yang membaca ulang error ini. */
async function tangkapRedirect(fn: () => Promise<void>): Promise<string> {
  try {
    await fn();
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) {
      return String((e as { digest: string }).digest).split(";").slice(2, -2).join(";");
    }
    throw e;
  }
  throw new Error("Diharapkan redirect() terlempar, tapi tidak ada.");
}

afterAll(async () => {
  await db.$disconnect();
  try {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const os = await import("node:os");
    fs.rmSync(path.join(os.tmpdir(), "simpus-posyandu-uji-klaim-actions.db"), { force: true });
  } catch { /* Windows kadang menahan lock sesaat — biarkan */ }
});

// ═══ kelurahanCocok — logika murni, tanpa DB ═══

describe("kelurahanCocok", () => {
  it("cocok bila id sama", async () => {
    expect(await kelurahanCocok(1, 1)).toBe(true);
  });
  it("TIDAK cocok bila id beda", async () => {
    expect(await kelurahanCocok(1, 2)).toBe(false);
  });
  it("ortu tanpa kelurahan (null, akun lama) selalu dianggap cocok", async () => {
    expect(await kelurahanCocok(null, 1)).toBe(true);
    expect(await kelurahanCocok(null, 99)).toBe(true);
  });
});

// ═══ putusKlaimKader — kader memutus tautan KlaimAnak (bukan anak) ═══

describe("putusKlaimKader", () => {
  let kaderNesa: { id: number; posyanduBinaan: number }; // posyanduId 1, kelurahan 1
  let ortuUjiId: number;
  let posyanduLuarBinaan: number; // posyandu di kelurahan lain, BUKAN binaan kader.nesa

  beforeEach(async () => {
    const kader = await db.user.findUnique({ where: { username: "kader.nesa" }, include: { binaan: true } });
    if (!kader || kader.binaan.length === 0) throw new Error("seed kader.nesa tak ditemukan di dev.db");
    kaderNesa = { id: kader.id, posyanduBinaan: kader.binaan[0].posyanduId };

    const luar = await db.posyandu.findFirst({ where: { id: { notIn: kader.binaan.map((b) => b.posyanduId) } } });
    if (!luar) throw new Error("butuh minimal 1 posyandu di luar binaan kader.nesa utk uji");
    posyanduLuarBinaan = luar.id;

    const ortu = await db.user.create({
      data: {
        peran: "ORTU", nama: "ZK-uji Ortu Putus", username: `zkuji-ortu-${Date.now()}-${Math.random()}`,
        sandiHash: "x",
      },
    });
    ortuUjiId = ortu.id;

    wajibUserMock.mockReset();
  });

  async function buatAnakBaru(posyanduId: number) {
    return db.anakBaru.create({ data: { posyanduId, dibuatOlehId: kaderNesa.id, iv: "x", tag: "x", data: "x" } });
  }

  it("kader binaan: memutus tautan menghapus KlaimAnak, data anak TIDAK ikut terhapus, log tercatat", async () => {
    wajibUserMock.mockResolvedValue({ id: kaderNesa.id, peran: "KADER" });
    const anak = await buatAnakBaru(kaderNesa.posyanduBinaan);
    const klaim = await db.klaimAnak.create({ data: { userId: ortuUjiId, anakBaruId: anak.id } });

    const fd = new FormData();
    fd.set("id", String(klaim.id));
    fd.set("ref", `b:${anak.id}`);
    const url = await tangkapRedirect(() => putusKlaimKader(fd));

    expect(url).toBe(`/kader/anak/b%3A${anak.id}?ok=${encodeURIComponent("Tautan dengan orang tua diputus.")}`);

    const klaimSetelah = await db.klaimAnak.findUnique({ where: { id: klaim.id } });
    expect(klaimSetelah).toBeNull(); // tautan terhapus

    const anakSetelah = await db.anakBaru.findUnique({ where: { id: anak.id } });
    expect(anakSetelah).not.toBeNull(); // data anak TIDAK terhapus

    const log = await db.logAktivitas.findFirst({ where: { aksi: "KLAIM_DIPUTUS_KADER", userId: kaderNesa.id } });
    expect(log?.detail).toBe(`klaim:${klaim.id}`);

    await db.anakBaru.delete({ where: { id: anak.id } });
  });

  it("kader BUKAN binaan (tamper id): ditolak galat rapi, KlaimAnak TIDAK terhapus", async () => {
    wajibUserMock.mockResolvedValue({ id: kaderNesa.id, peran: "KADER" });
    const anakLuar = await buatAnakBaru(posyanduLuarBinaan);
    const klaimLuar = await db.klaimAnak.create({ data: { userId: ortuUjiId, anakBaruId: anakLuar.id } });

    const fd = new FormData();
    fd.set("id", String(klaimLuar.id));
    fd.set("ref", `b:${anakLuar.id}`); // ref boleh diisi apa saja oleh penyerang — bukan sumber otorisasi
    const url = await tangkapRedirect(() => putusKlaimKader(fd));

    expect(url).toContain("galat=");
    expect(url).not.toContain("ok=");

    const klaimSetelah = await db.klaimAnak.findUnique({ where: { id: klaimLuar.id } });
    expect(klaimSetelah).not.toBeNull(); // tautan TIDAK terhapus

    await db.klaimAnak.delete({ where: { id: klaimLuar.id } });
    await db.anakBaru.delete({ where: { id: anakLuar.id } });
  });

  it("id tak valid/tak ditemukan → galat rapi (bukan crash)", async () => {
    wajibUserMock.mockResolvedValue({ id: kaderNesa.id, peran: "KADER" });
    const fd = new FormData();
    fd.set("id", "999999999");
    fd.set("ref", "b:1");
    const url = await tangkapRedirect(() => putusKlaimKader(fd));
    expect(url).toContain("galat=");
  });
});

// ═══ pakaiKode — deteksi mismatch kelurahan sebelum klaim ═══

describe("pakaiKode — deteksi mismatch kelurahan", () => {
  let ortu: { id: number; kelurahanId: number }; // ortu 081900000001, kelurahan 1
  let posyanduSekelurahan: number; // kelurahan sama dgn ortu
  let posyanduBedaKelurahan: number; // kelurahan BEDA dari ortu
  let kaderId: number;

  beforeEach(async () => {
    const u = await db.user.findUnique({ where: { username: "081900000001" } });
    if (!u || u.kelurahanId === null) throw new Error("seed ortu 081900000001 (dgn kelurahanId) tak ditemukan di dev.db");
    ortu = { id: u.id, kelurahanId: u.kelurahanId };

    const sama = await db.posyandu.findFirst({ where: { kelurahanId: ortu.kelurahanId } });
    const beda = await db.posyandu.findFirst({ where: { kelurahanId: { not: ortu.kelurahanId } } });
    if (!sama || !beda) throw new Error("butuh posyandu di kelurahan sama & beda dari ortu uji");
    posyanduSekelurahan = sama.id;
    posyanduBedaKelurahan = beda.id;

    const kader = await db.user.findFirst({ where: { peran: "KADER" } });
    if (!kader) throw new Error("butuh minimal 1 kader di dev.db utk dibuatOlehId");
    kaderId = kader.id;

    wajibUserMock.mockReset();
    wajibUserMock.mockResolvedValue({ id: ortu.id, peran: "ORTU" });
  });

  async function buatToken(posyanduId: number) {
    const anak = await db.anakBaru.create({ data: { posyanduId, dibuatOlehId: kaderId, iv: "x", tag: "x", data: "x" } });
    const token = await db.klaimToken.create({
      data: {
        token: tokenUji(),
        anakBaruId: anak.id,
        dibuatOlehId: kaderId,
        kedaluwarsa: new Date(Date.now() + 86400000),
      },
    });
    return { anak, token };
  }

  it("(a) kelurahan cocok → alur lama mulus, klaim langsung terbentuk", async () => {
    const { anak, token } = await buatToken(posyanduSekelurahan);
    const fd = new FormData();
    fd.set("kode", token.token);
    const url = await tangkapRedirect(() => pakaiKode(fd));

    expect(url).toBe("/ortu/anakku");
    const klaim = await db.klaimAnak.findFirst({ where: { userId: ortu.id, anakBaruId: anak.id } });
    expect(klaim).not.toBeNull();

    await db.klaimAnak.deleteMany({ where: { anakBaruId: anak.id } });
    await db.klaimToken.delete({ where: { id: token.id } });
    await db.anakBaru.delete({ where: { id: anak.id } });
  });

  it("(b)+(c) kelurahan BEDA, tanpa konfirmasi → layar peringatan, klaim TIDAK terbentuk, log mismatch tercatat", async () => {
    const { anak, token } = await buatToken(posyanduBedaKelurahan);
    const fd = new FormData();
    fd.set("kode", token.token);
    // sengaja TANPA field "konfirmasi" — ini juga mensimulasikan tamper POST langsung
    const url = await tangkapRedirect(() => pakaiKode(fd));

    expect(url).toContain("/ortu/klaim?");
    expect(url).toContain("mismatch=1");

    const klaim = await db.klaimAnak.findFirst({ where: { userId: ortu.id, anakBaruId: anak.id } });
    expect(klaim).toBeNull(); // DITOLAK — belum terklaim

    const tokenSetelah = await db.klaimToken.findUnique({ where: { id: token.id } });
    expect(tokenSetelah?.dipakaiPada).toBeNull(); // token belum terpakai

    const log = await db.logAktivitas.findFirst({ where: { aksi: "KLAIM_BEDA_KELURAHAN", userId: ortu.id } });
    expect(log?.detail).toBe(`b:${anak.id}`); // ref anak TANPA nama

    await db.klaimToken.delete({ where: { id: token.id } });
    await db.anakBaru.delete({ where: { id: anak.id } });
  });

  it("kelurahan BEDA + konfirmasi=1 (\"Tetap hubungkan\") → klaim terbentuk", async () => {
    const { anak, token } = await buatToken(posyanduBedaKelurahan);
    const fd = new FormData();
    fd.set("kode", token.token);
    fd.set("konfirmasi", "1");
    const url = await tangkapRedirect(() => pakaiKode(fd));

    expect(url).toBe("/ortu/anakku");
    const klaim = await db.klaimAnak.findFirst({ where: { userId: ortu.id, anakBaruId: anak.id } });
    expect(klaim).not.toBeNull();

    await db.klaimAnak.deleteMany({ where: { anakBaruId: anak.id } });
    await db.klaimToken.delete({ where: { id: token.id } });
    await db.anakBaru.delete({ where: { id: anak.id } });
  });
});
