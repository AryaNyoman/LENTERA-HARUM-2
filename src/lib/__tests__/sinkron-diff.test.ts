import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

// sinkron.ts (dan brankas.ts/anak.ts yang ditariknya) memakai `import "server-only"`,
// yang melempar error di luar bundel Next.js (webpack/turbopack) — termasuk di vitest.
// Ganti dengan modul kosong khusus untuk file test ini saja (tak menyentuh vitest.config.ts).
vi.mock("server-only", () => ({}));

// Untuk test integrasi `terapkanHasil`: alihkan @/lib/db ke SALINAN dev.db di folder temp
// (dev.db asli hanya dibaca utk copy — tidak pernah ditulis oleh test ini).
vi.mock("@/lib/db", async () => {
  const { PrismaClient } = await import("@prisma/client");
  const fs = await import("node:fs");
  const path = await import("node:path");
  const os = await import("node:os");
  const { execSync } = await import("node:child_process");
  const asal = path.resolve(process.cwd(), "prisma", "dev.db");
  const salinan = path.join(os.tmpdir(), "simpus-posyandu-uji-sinkron.db");
  fs.copyFileSync(asal, salinan); // tiap run mulai dari state dev.db yang bersih
  const urlSalinan = "file:" + salinan.split(path.sep).join("/");
  // dev.db asli belum tentu punya tabel model yang baru ditambah ke schema.prisma (mis.
  // JadwalPosyandu, PLAN 2026-07-19 d) — sinkronkan skema HANYA ke salinan temp ini via
  // DATABASE_URL override. dev.db ASLI tidak pernah tersentuh (bukti: md5 tak berubah).
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    env: { ...process.env, DATABASE_URL: urlSalinan },
    stdio: "ignore",
  });
  return { db: new PrismaClient({ datasourceUrl: urlSalinan }) };
});

// segel()/buka() butuh KUNCI_SERVER (vitest tidak memuat .env) — kunci uji deterministik.
process.env.KUNCI_SERVER = "11".repeat(32);

import { stringifyStabil, rencanaDiffAnak, terapkanHasil, type AnakLokal, type AnakSumber, type SumberSinkron, type JadwalSumber } from "@/lib/sinkron";
import { buka, type IsiAnak } from "@/lib/brankas";
import { db } from "@/lib/db";

function jadwal(over: Partial<JadwalSumber> = {}): JadwalSumber {
  return { id: 1, posyanduId: 10, tahun: 2026, bulan: 7, tanggal: 15, namaPosyandu: "Posyandu Melati", ...over };
}

function isi(over: Partial<IsiAnak> = {}): IsiAnak {
  return {
    nama: "Anak Satu",
    tglLahir: "2025-01-01",
    jk: "L",
    namaOrtu: "Ortu Satu",
    nik: "1234567890123456",
    noHp: "081234567890",
    alamat: "Jl. Mawar",
    rtRw: "01/02",
    vaksin: { HB0_1_7H: "2025-01-01", BCG: "2025-02-01" },
    ...over,
  };
}

describe("stringifyStabil — perbandingan plaintext tak peka urutan kunci", () => {
  it("hasil sama walau urutan kunci top-level berbeda", () => {
    const a = isi();
    const b: IsiAnak = {
      vaksin: a.vaksin, nama: a.nama, tglLahir: a.tglLahir, jk: a.jk,
      namaOrtu: a.namaOrtu, nik: a.nik, noHp: a.noHp, alamat: a.alamat, rtRw: a.rtRw,
    };
    expect(stringifyStabil(a)).toBe(stringifyStabil(b));
  });

  it("hasil sama walau urutan kunci vaksin (nested) berbeda", () => {
    const a = isi({ vaksin: { HB0_1_7H: "2025-01-01", BCG: "2025-02-01", POLIO1: "2025-02-01" } });
    const b = isi({ vaksin: { POLIO1: "2025-02-01", BCG: "2025-02-01", HB0_1_7H: "2025-01-01" } });
    expect(stringifyStabil(a)).toBe(stringifyStabil(b));
  });

  it("hasil beda kalau tanggal vaksin beda", () => {
    const a = isi({ vaksin: { BCG: "2025-02-01" } });
    const b = isi({ vaksin: { BCG: "2025-02-02" } });
    expect(stringifyStabil(a)).not.toBe(stringifyStabil(b));
  });

  it("hasil beda kalau ada kode vaksin baru", () => {
    const a = isi({ vaksin: { BCG: "2025-02-01" } });
    const b = isi({ vaksin: { BCG: "2025-02-01", POLIO1: "2025-03-01" } });
    expect(stringifyStabil(a)).not.toBe(stringifyStabil(b));
  });

  it("hasil beda kalau field non-vaksin beda", () => {
    expect(stringifyStabil(isi({ nama: "Anak Satu" }))).not.toBe(stringifyStabil(isi({ nama: "Anak Dua" })));
  });
});

describe("rencanaDiffAnak — klasifikasi baru / ubah / sama", () => {
  it("idSimpus ada di sumber tapi tak ada lokal → baru", () => {
    const sumber: AnakSumber[] = [{ idSimpus: 1, posyanduId: 10, isi: isi() }];
    const hasil = rencanaDiffAnak([], sumber);
    expect(hasil.baru.map((a) => a.idSimpus)).toEqual([1]);
    expect(hasil.ubah).toHaveLength(0);
    expect(hasil.sama).toBe(0);
  });

  it("idSimpus sama, isi identik & posyanduId sama → sama (tak disentuh)", () => {
    const isiSama = isi();
    const lokal: AnakLokal[] = [{ idSimpus: 1, posyanduId: 10, isi: isiSama }];
    // objek beda instance tapi isi logis sama (vaksin di-clone) — harus tetap "sama".
    const sumber: AnakSumber[] = [{ idSimpus: 1, posyanduId: 10, isi: { ...isiSama, vaksin: { ...isiSama.vaksin } } }];
    const hasil = rencanaDiffAnak(lokal, sumber);
    expect(hasil.baru).toHaveLength(0);
    expect(hasil.ubah).toHaveLength(0);
    expect(hasil.sama).toBe(1);
  });

  it("isi berbeda (mis. vaksin baru dicatat sumber) → ubah", () => {
    const lokal: AnakLokal[] = [{ idSimpus: 1, posyanduId: 10, isi: isi({ vaksin: { BCG: "2025-02-01" } }) }];
    const sumber: AnakSumber[] = [
      { idSimpus: 1, posyanduId: 10, isi: isi({ vaksin: { BCG: "2025-02-01", POLIO1: "2025-03-01" } }) },
    ];
    const hasil = rencanaDiffAnak(lokal, sumber);
    expect(hasil.ubah.map((a) => a.idSimpus)).toEqual([1]);
    expect(hasil.baru).toHaveLength(0);
    expect(hasil.sama).toBe(0);
  });

  it("posyanduId pindah walau isi sama → ubah", () => {
    const isiSama = isi();
    const lokal: AnakLokal[] = [{ idSimpus: 1, posyanduId: 10, isi: isiSama }];
    const sumber: AnakSumber[] = [{ idSimpus: 1, posyanduId: 99, isi: isiSama }];
    const hasil = rencanaDiffAnak(lokal, sumber);
    expect(hasil.ubah.map((a) => a.idSimpus)).toEqual([1]);
    expect(hasil.sama).toBe(0);
  });

  it("gagal buka lokal (isi null, kunci beda/data korup) → dianggap ubah, bukan crash", () => {
    const lokal: AnakLokal[] = [{ idSimpus: 1, posyanduId: 10, isi: null }];
    const sumber: AnakSumber[] = [{ idSimpus: 1, posyanduId: 10, isi: isi() }];
    const hasil = rencanaDiffAnak(lokal, sumber);
    expect(hasil.ubah.map((a) => a.idSimpus)).toEqual([1]);
    expect(hasil.baru).toHaveLength(0);
    expect(hasil.sama).toBe(0);
  });

  it("baris lokal yang tak ada di sumber (hilang) diabaikan — bukan dihapus/error", () => {
    const lokal: AnakLokal[] = [
      { idSimpus: 1, posyanduId: 10, isi: isi() },
      { idSimpus: 2, posyanduId: 10, isi: isi({ nama: "Anak Hilang Dari Sumber" }) },
    ];
    const sumber: AnakSumber[] = [{ idSimpus: 1, posyanduId: 10, isi: isi() }];
    const hasil = rencanaDiffAnak(lokal, sumber);
    expect(hasil.baru).toHaveLength(0);
    expect(hasil.ubah).toHaveLength(0);
    expect(hasil.sama).toBe(1);
    // hasil (baru+ubah+sama) selalu mengikuti jumlah baris SUMBER, bukan lokal.
    expect(hasil.baru.length + hasil.ubah.length + hasil.sama).toBe(sumber.length);
  });

  it("campuran baru + ubah + sama sekaligus", () => {
    const lokal: AnakLokal[] = [
      { idSimpus: 1, posyanduId: 10, isi: isi() },
      { idSimpus: 2, posyanduId: 10, isi: isi({ nama: "Nama Lama" }) },
    ];
    const sumber: AnakSumber[] = [
      { idSimpus: 1, posyanduId: 10, isi: isi() },
      { idSimpus: 2, posyanduId: 10, isi: isi({ nama: "Nama Baru" }) },
      { idSimpus: 3, posyanduId: 10, isi: isi({ nama: "Anak Baru" }) },
    ];
    const hasil = rencanaDiffAnak(lokal, sumber);
    expect(hasil.baru.map((a) => a.idSimpus)).toEqual([3]);
    expect(hasil.ubah.map((a) => a.idSimpus)).toEqual([2]);
    expect(hasil.sama).toBe(1);
  });

  it("dev.db kosong (lokal=[]) dgn sumber kosong → tidak ada apa-apa, tak error", () => {
    expect(rencanaDiffAnak([], [])).toEqual({ baru: [], ubah: [], sama: 0 });
  });
});

// ══ Integrasi kecil (temuan critic H2): ketahanan galat per-baris di jalur tulis ══
// Jalan pada salinan temp dev.db (lihat vi.mock @/lib/db di atas) — tanpa koneksi Neon.

/** Wilayah sumber = persis isi lokal (tak ada perubahan kelurahan/posyandu). */
async function wilayahDariLokal(): Promise<Pick<SumberSinkron, "kelurahan" | "posyandu">> {
  const kel = await db.kelurahan.findMany();
  const pos = await db.posyandu.findMany();
  return {
    kelurahan: kel.map((k) => ({ id: k.id, nama: k.nama, urutan: k.urutan })),
    posyandu: pos.map((p) => ({
      id: p.id, kelurahanId: p.kelurahanId, nama: p.nama, namaPosyandu: p.namaPosyandu, aktif: p.aktif, khusus: p.khusus,
    })),
  };
}

afterAll(async () => {
  await db.$disconnect();
  try {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const os = await import("node:os");
    fs.rmSync(path.join(os.tmpdir(), "simpus-posyandu-uji-sinkron.db"), { force: true });
  } catch { /* Windows kadang menahan lock sesaat — biarkan */ }
});

describe("terapkanHasil — satu baris busuk tidak menjegal sisa sinkron (integrasi)", () => {
  beforeEach(async () => {
    await db.anakSimpus.deleteMany({});
    await db.cacheDashboard.deleteMany({});
  });

  it("duplikat idSimpus di batch createMany: baris sehat tetap masuk, duplikat dihitung gagal", async () => {
    const wilayah = await wilayahDariLokal();
    const pid = wilayah.posyandu[0].id;
    const sumber: SumberSinkron = {
      ...wilayah,
      anak: [
        { idSimpus: 501, posyanduId: pid, isi: isi({ nama: "Duplikat A" }) },
        { idSimpus: 501, posyanduId: pid, isi: isi({ nama: "Duplikat B" }) }, // busuk: unique violation
        { idSimpus: 502, posyanduId: pid, isi: isi({ nama: "Sehat Dua" }) },
        { idSimpus: 503, posyanduId: pid, isi: isi({ nama: "Sehat Tiga" }) },
      ],
      idTidakJelas: [],
      gagalDekripsi: 1,
    };
    const hasil = await terapkanHasil(sumber); // TIDAK boleh melempar
    const tersimpan = await db.anakSimpus.findMany({ select: { idSimpus: true }, orderBy: { idSimpus: "asc" } });
    expect(tersimpan.map((t) => t.idSimpus)).toEqual([501, 502, 503]); // 249 tetangga sehat tak dikorbankan
    expect(hasil.gagalDekripsi).toBe(2); // 1 gagal dekripsi sumber + 1 gagal tulis (duplikat)
    expect(hasil.anak).toBe(3); // 4 baris sumber − 1 gagal tulis
  });

  it("update dgn posyanduId yatim (FK) gagal per-baris saja; update sah lain tetap jalan", async () => {
    const wilayah = await wilayahDariLokal();
    const pid = wilayah.posyandu[0].id;
    const seed: SumberSinkron = {
      ...wilayah,
      anak: [
        { idSimpus: 601, posyanduId: pid, isi: isi({ nama: "Anak Enam Satu" }) },
        { idSimpus: 602, posyanduId: pid, isi: isi({ nama: "Nama Awal" }) },
      ],
      idTidakJelas: [],
      gagalDekripsi: 0,
    };
    await terapkanHasil(seed);

    const ronde2: SumberSinkron = {
      ...wilayah,
      anak: [
        { idSimpus: 601, posyanduId: 999999, isi: isi({ nama: "Anak Enam Satu" }) }, // busuk: FK yatim
        { idSimpus: 602, posyanduId: pid, isi: isi({ nama: "Nama Baru" }) }, // perubahan sah
      ],
      idTidakJelas: [],
      gagalDekripsi: 0,
    };
    const hasil = await terapkanHasil(ronde2); // TIDAK boleh melempar
    expect(hasil.gagalDekripsi).toBe(1);
    expect(hasil.anak).toBe(1);

    const rows = await db.anakSimpus.findMany({ orderBy: { idSimpus: "asc" } });
    expect(rows).toHaveLength(2);
    expect(rows[0].posyanduId).toBe(pid); // 601 tak berubah (update-nya gagal FK)
    expect(buka<IsiAnak>(rows[1]).nama).toBe("Nama Baru"); // 602 tetap diperbarui
  });

  it("revalidateTag di luar konteks request Next tidak menjegal sinkron (kelurahan tetap ditulis)", async () => {
    const wilayah = await wilayahDariLokal();
    const idKel = wilayah.kelurahan[0].id;
    const namaBaru = wilayah.kelurahan[0].nama + " (ubah)";
    const sumber: SumberSinkron = {
      kelurahan: wilayah.kelurahan.map((k) => (k.id === idKel ? { ...k, nama: namaBaru } : k)),
      posyandu: wilayah.posyandu,
      anak: [],
      idTidakJelas: [],
      gagalDekripsi: 0,
    };
    await expect(terapkanHasil(sumber)).resolves.toBeTruthy(); // jalur revalidateTag terlewati tanpa lempar
    const k = await db.kelurahan.findUnique({ where: { id: idKel } });
    expect(k?.nama).toBe(namaBaru);
  });
});

// ══ Unit JADWAL (PLAN 2026-07-19 d): batch-diff JadwalPosyandu, pola PERSIS kelurahan/posyandu ══
describe("terapkanHasil — jadwal posyandu (baru/ubah/identik/ketahanan)", () => {
  beforeEach(async () => {
    await db.jadwalPosyandu.deleteMany({});
  });

  it("jadwal baru (tak ada lokal) → createMany; HasilSinkron.jadwal = jumlah baris sumber", async () => {
    const wilayah = await wilayahDariLokal();
    const pid = wilayah.posyandu[0].id;
    const sumber: SumberSinkron = {
      ...wilayah,
      anak: [],
      idTidakJelas: [],
      gagalDekripsi: 0,
      jadwal: [
        jadwal({ id: 9801, posyanduId: pid, bulan: 7, tanggal: 10 }),
        jadwal({ id: 9802, posyanduId: pid, bulan: 8, tanggal: 20 }), // bulan beda — bulan 7 dipakai baris lain (@@unique)
      ],
    };
    const hasil = await terapkanHasil(sumber);
    const rows = await db.jadwalPosyandu.findMany({ orderBy: { id: "asc" } });
    expect(rows.map((r) => r.id)).toEqual([9801, 9802]);
    expect(rows[0].tanggal).toBe(10);
    expect(hasil.jadwal).toBe(2);
  });

  it("jadwal berubah (tanggal beda) → update baris yang berubah saja", async () => {
    const wilayah = await wilayahDariLokal();
    const pid = wilayah.posyandu[0].id;
    await terapkanHasil({
      ...wilayah, anak: [], idTidakJelas: [], gagalDekripsi: 0,
      jadwal: [jadwal({ id: 9811, posyanduId: pid, tanggal: 10 })],
    });

    const hasil = await terapkanHasil({
      ...wilayah, anak: [], idTidakJelas: [], gagalDekripsi: 0,
      jadwal: [jadwal({ id: 9811, posyanduId: pid, tanggal: 17 })], // tanggal berubah
    });
    const row = await db.jadwalPosyandu.findUnique({ where: { id: 9811 } });
    expect(row?.tanggal).toBe(17);
    expect(hasil.jadwal).toBe(1);
  });

  it("identik → createMany/update TIDAK dipanggil sama sekali (tak ada tulis sia-sia)", async () => {
    const wilayah = await wilayahDariLokal();
    const pid = wilayah.posyandu[0].id;
    const tetap = jadwal({ id: 9821, posyanduId: pid, tanggal: 12 });
    await terapkanHasil({ ...wilayah, anak: [], idTidakJelas: [], gagalDekripsi: 0, jadwal: [tetap] });

    const spyCreate = vi.spyOn(db.jadwalPosyandu, "createMany");
    const spyUpdate = vi.spyOn(db.jadwalPosyandu, "update");
    const hasil = await terapkanHasil({ ...wilayah, anak: [], idTidakJelas: [], gagalDekripsi: 0, jadwal: [tetap] });
    expect(spyCreate).not.toHaveBeenCalled();
    expect(spyUpdate).not.toHaveBeenCalled();
    expect(hasil.jadwal).toBe(1);
    spyCreate.mockRestore();
    spyUpdate.mockRestore();
  });

  it("1 baris gagal (duplikat id sintetis) di createMany: baris sehat tetap masuk, duplikat tak menjegal", async () => {
    const wilayah = await wilayahDariLokal();
    const pid = wilayah.posyandu[0].id;
    const sumber: SumberSinkron = {
      ...wilayah, anak: [], idTidakJelas: [], gagalDekripsi: 0,
      jadwal: [
        jadwal({ id: 9831, posyanduId: pid, bulan: 7, tanggal: 5 }),
        jadwal({ id: 9831, posyanduId: pid, bulan: 7, tanggal: 25 }), // busuk: duplikat id (primary key)
        jadwal({ id: 9832, posyanduId: pid, bulan: 8, tanggal: 8 }), // bulan beda dari 9831/9833 (@@unique)
        jadwal({ id: 9833, posyanduId: pid, bulan: 9, tanggal: 9 }),
      ],
    };
    const hasil = await terapkanHasil(sumber); // TIDAK boleh melempar
    const rows = await db.jadwalPosyandu.findMany({ orderBy: { id: "asc" } });
    expect(rows.map((r) => r.id)).toEqual([9831, 9832, 9833]); // tetangga sehat tak dikorbankan
    // Pola sama kelurahan/posyandu (bukan anak): HasilSinkron.jadwal = jumlah baris SUMBER,
    // bukan jumlah yang berhasil ditulis — baris busuk tak dikurangi dari hitungan ini.
    expect(hasil.jadwal).toBe(4);
  });

  // Revisi ronde 2 critic (MAYOR): transisi produksi nyata — kode Wave 1 bisa di-deploy sebelum
  // DDL Wave 3 (tabel JadwalPosyandu) ada di database produksi. Blok jadwal HARUS gagal senyap
  // (bukan menjegal pelaporan sukses langkah 1-5 yang lain) kalau tabelnya belum ada.
  it("tabel JadwalPosyandu belum ada (transisi Wave1→Wave3 produksi) → tak throw, hasil.jadwal=0, field lain tetap benar", async () => {
    // Timeout digenjot (default 5dtk) — cleanup di finally menjalankan `npx prisma db push` lagi
    // (proses baru tiap kali, bukan cuma query sqlite), bisa >5dtk di mesin yang lebih lambat.
    const path = await import("node:path");
    const os = await import("node:os");
    const { execSync } = await import("node:child_process");
    // Path PERSIS sama dgn salinan temp yang dipakai mock @/lib/db di atas.
    const urlSalinan = "file:" + path.join(os.tmpdir(), "simpus-posyandu-uji-sinkron.db").split(path.sep).join("/");

    const wilayah = await wilayahDariLokal();
    await db.$executeRawUnsafe('DROP TABLE "JadwalPosyandu"');
    try {
      const sumber: SumberSinkron = {
        ...wilayah, anak: [], idTidakJelas: [], gagalDekripsi: 0,
        jadwal: [jadwal({ id: 9851, posyanduId: wilayah.posyandu[0].id })],
      };
      const hasil = await terapkanHasil(sumber); // TIDAK boleh melempar walau tabel hilang
      expect(hasil.jadwal).toBe(0); // blok jadwal gagal total → dilaporkan 0, bukan menjegal field lain
      expect(hasil.kelurahan).toBe(wilayah.kelurahan.length); // langkah 1-5 tetap sukses & terlapor benar
      expect(hasil.posyandu).toBe(wilayah.posyandu.length);
    } finally {
      // Pulihkan tabel — beforeEach test berikutnya (deleteMany) butuh tabel ada.
      execSync("npx prisma db push --skip-generate --accept-data-loss", {
        env: { ...process.env, DATABASE_URL: urlSalinan },
        stdio: "ignore",
      });
    }
  }, 20000);
});
