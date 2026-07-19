import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

// vaksin-admin-actions.ts (dan sesi.ts/brankas.ts yang ditariknya) memakai `import "server-only"`,
// yang melempar error di luar bundel Next.js — sama pola src/lib/__tests__/sinkron-diff.test.ts.
vi.mock("server-only", () => ({}));

// wajibUser (sesi.ts) memanggil next/headers cookies() — butuh request scope Next.js yang
// tak ada di vitest. Admin palsu tetap (satu-satunya peran yang dipakai daftarVaksinAdmin).
vi.mock("@/lib/sesi", () => ({
  wajibUser: vi.fn(async () => ({
    id: 1, peran: "ADMIN", nama: "Admin Uji", username: "admin", perluGantiSandi: false,
  })),
}));

// Alihkan @/lib/db ke SALINAN dev.db di folder temp (pola sama sinkron-diff.test.ts) —
// dev.db asli hanya dibaca utk copy, tak pernah ditulis oleh test ini.
vi.mock("@/lib/db", async () => {
  const { PrismaClient } = await import("@prisma/client");
  const fs = await import("node:fs");
  const path = await import("node:path");
  const os = await import("node:os");
  const asal = path.resolve(process.cwd(), "prisma", "dev.db");
  const salinan = path.join(os.tmpdir(), "simpus-posyandu-uji-vaksin-admin.db");
  fs.copyFileSync(asal, salinan); // tiap run mulai dari state dev.db yang bersih
  return { db: new PrismaClient({ datasourceUrl: "file:" + salinan.split(path.sep).join("/") }) };
});

// segel()/buka() butuh KUNCI_SERVER (vitest tidak memuat .env) — kunci uji deterministik.
process.env.KUNCI_SERVER = "44".repeat(32);

import { daftarVaksinAdmin, ringkasanVaksinAdmin, jumlahSiapExport } from "@/lib/vaksin-admin-actions";
import { segel, type IsiAnak } from "@/lib/brankas";
import { db } from "@/lib/db";

function isi(over: Partial<IsiAnak> = {}): IsiAnak {
  return {
    nama: "Anak Uji",
    tglLahir: "2024-01-01",
    jk: "L",
    namaOrtu: "Ortu Uji",
    nik: "1234567890123456",
    noHp: "081200000000",
    alamat: "Jl. Uji",
    rtRw: "01/01",
    vaksin: {},
    ...over,
  };
}

let posyanduId: number;
let dibuatOlehId: number;

beforeEach(async () => {
  // Salinan privat dev.db ini boleh ditruncate bebas — isolasi penuh antar-test.
  await db.anakBaru.deleteMany({});
  const posyandu = await db.posyandu.findFirst();
  const user = await db.user.findFirst();
  if (!posyandu || !user) throw new Error("dev.db kosong — butuh minimal 1 posyandu & 1 user utk seed uji");
  posyanduId = posyandu.id;
  dibuatOlehId = user.id;
});

afterAll(async () => {
  await db.$disconnect();
  try {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const os = await import("node:os");
    fs.rmSync(path.join(os.tmpdir(), "simpus-posyandu-uji-vaksin-admin.db"), { force: true });
  } catch { /* Windows kadang menahan lock sesaat — biarkan */ }
});

describe("daftarVaksinAdmin — sort ascending 'sudah' (anak belum diisi di atas)", () => {
  it("anak 0-dosis tampil di atas anak lebih-terisi WALAU dibuat belakangan (bukan kebetulan ikut urutan dibuatPada lama)", async () => {
    const sekarang = new Date();
    const lebihTua = new Date(sekarang.getTime() - 60 * 60 * 1000); // 1 jam lebih tua

    await db.anakBaru.create({
      data: {
        posyanduId,
        dibuatOlehId,
        ...segel(isi({ nama: "Anak Dua Dosis", vaksin: { HB0_1_7H: "2024-01-01", BCG: "2024-02-01" } })),
        dibuatPada: sekarang, // dibuat BELAKANGAN tapi lebih terisi — sengaja dibalik dari
      },              // urutan dibuatPada supaya test ini gagal bila sort lama (query-only) dipakai
    });
    await db.anakBaru.create({
      data: {
        posyanduId,
        dibuatOlehId,
        ...segel(isi({ nama: "Anak Nol Dosis", vaksin: {} })),
        dibuatPada: lebihTua, // dibuat LEBIH DULU tapi 0 dosis — harus tetap paling atas
      },
    });

    const hasil = await daftarVaksinAdmin(posyanduId);
    expect(hasil.map((a) => a.nama)).toEqual(["Anak Nol Dosis", "Anak Dua Dosis"]);
    expect(hasil[0].sudah).toBe(0);
    expect(hasil[1].sudah).toBe(2);
  });

  it("tie-break: sudah sama → urutan dibuatPada desc dipertahankan (perilaku lama)", async () => {
    const sekarang = new Date();
    const lebihTua = new Date(sekarang.getTime() - 60 * 60 * 1000);

    await db.anakBaru.create({
      data: { posyanduId, dibuatOlehId, ...segel(isi({ nama: "Anak Tie Tua" })), dibuatPada: lebihTua },
    });
    await db.anakBaru.create({
      data: { posyanduId, dibuatOlehId, ...segel(isi({ nama: "Anak Tie Baru" })), dibuatPada: sekarang },
    });

    const hasil = await daftarVaksinAdmin(posyanduId);
    expect(hasil.map((a) => a.nama)).toEqual(["Anak Tie Baru", "Anak Tie Tua"]);
  });
});

describe("ringkasanVaksinAdmin — badge kuning per kelurahan & posyandu (SATU findMany)", () => {
  it("menghitung anak belum lengkap saja (lengkap semua dosis relevan tak masuk badge), dipisah per kelurahan/posyandu", async () => {
    const posyanduList = await db.posyandu.findMany({ orderBy: { id: "asc" } });
    const posA = posyanduList[0];
    const posB = posyanduList.find((p) => p.kelurahanId !== posA.kelurahanId);
    if (!posB) throw new Error("butuh ≥2 kelurahan berbeda di dev.db utk uji ini");

    // Semua kode DOSIS_REGISTRY terisi (varian dasar, bukan Hexa/Rotarix) → "lengkap",
    // TIDAK boleh masuk hitungan badge.
    const semuaKodeTerisi = Object.fromEntries(
      ["HB0_1_7H","BCG","POLIO1","PENTA1","POLIO2","PCV1","ROTA1","PENTA2","POLIO3","PCV2",
       "ROTA2","PENTA3","POLIO4","IPV1","ROTA3","MR","IPV2","PCV3","DPT_BADUTA","MR_BADUTA"]
        .map((k) => [k, "2024-01-01"]),
    );

    await db.anakBaru.create({
      data: { posyanduId: posA.id, dibuatOlehId, ...segel(isi({ nama: "Belum Lengkap A", vaksin: {} })) },
    });
    await db.anakBaru.create({
      data: { posyanduId: posA.id, dibuatOlehId, ...segel(isi({ nama: "Lengkap A", vaksin: semuaKodeTerisi })) },
    });
    await db.anakBaru.create({
      data: { posyanduId: posB.id, dibuatOlehId, ...segel(isi({ nama: "Lengkap B", vaksin: semuaKodeTerisi })) },
    });

    const ringkasan = await ringkasanVaksinAdmin();
    expect(ringkasan.perKelurahan[posA.kelurahanId]).toBe(1);
    expect(ringkasan.perPosyandu[posA.id]).toBe(1);
    // posB hanya berisi anak lengkap — tak boleh muncul di badge sama sekali.
    expect(ringkasan.perKelurahan[posB.kelurahanId]).toBeUndefined();
    expect(ringkasan.perPosyandu[posB.id]).toBeUndefined();
  });
});

describe("jumlahSiapExport — WHERE PERSIS sama /kader/export (status DRAF/DIEKSPOR, minus isian ortu belum diverifikasi)", () => {
  it("cocok dgn hitungan manual query yang sama", async () => {
    await db.anakBaru.create({
      data: { posyanduId, dibuatOlehId, status: "DRAF", ...segel(isi({ nama: "Draf Kader" })) },
    });
    await db.anakBaru.create({
      data: { posyanduId, dibuatOlehId, status: "DIEKSPOR", ...segel(isi({ nama: "Sudah Diekspor" })) },
    });
    await db.anakBaru.create({
      data: {
        posyanduId, dibuatOlehId, status: "DRAF", olehOrtu: true, terverifikasi: false,
        ...segel(isi({ nama: "Isian Ortu Belum Verif" })),
      },
    });
    await db.anakBaru.create({
      data: {
        posyanduId, dibuatOlehId, status: "DRAF", olehOrtu: true, terverifikasi: true,
        ...segel(isi({ nama: "Isian Ortu Sudah Verif" })),
      },
    });
    await db.anakBaru.create({
      data: { posyanduId, dibuatOlehId, status: "MASUK_SIMPUS", ...segel(isi({ nama: "Sudah Masuk SIMPUS" })) },
    });

    const manual = await db.anakBaru.count({
      where: { status: { in: ["DRAF", "DIEKSPOR"] }, NOT: { olehOrtu: true, terverifikasi: false } },
    });
    expect(manual).toBe(3);
    expect(await jumlahSiapExport()).toBe(manual);
  });
});
