import "server-only";
import { Client } from "pg";
import { createDecipheriv } from "crypto";
import { db } from "@/lib/db";
import { segel, type IsiAnak } from "@/lib/brankas";
import { lengkap, SYARAT_IDL, SYARAT_IBL } from "@/lib/vaksin";
import { hitungUsiaBulan, kelompokUsia } from "@/lib/anak";

/** ═══ Sinkron SIMPUS → SIMPUS-POSYANDU (satu arah, baca-saja) ═══
 *  Sumber: database Neon milik SIMPUS petugas (env SIMPUS_DATABASE_URL).
 *  PII anak di sana terenkripsi AES-256-GCM dengan DEK brankas — "amplop layanan"
 *  = DEK yang diekspor pemilik lewat scripts/export-dek-layanan.ts di repo Simpus-Imun,
 *  lalu disimpan di env SIMPUS_DEK (hex 64 karakter). Kunci hanya hidup di server ini.
 *  Hasil: master wilayah + salinan anak (disegel ulang kunci website) + cache dashboard. */

interface HasilSinkron {
  kelurahan: number;
  posyandu: number;
  anak: number;
  gagalDekripsi: number;
  dicocokkan: number; // AnakBaru DIEKSPOR → MASUK_SIMPUS
}

/** Bentuk data anak di dalam blob SIMPUS (subset InputAnak repo Simpus-Imun). */
interface AnakSimpusBlob {
  nama?: string;
  jenisKelamin?: string;
  tglLahir?: string;
  namaOrtu?: string;
  nik?: string;
  noHp?: string;
  alamatLengkap?: string;
  rtRw?: string;
  vaksin?: Record<string, string>;
}

function dekripsiSimpus(row: { iv: string; tag: string; data: string }, dek: Buffer): AnakSimpusBlob {
  const d = createDecipheriv("aes-256-gcm", dek, Buffer.from(row.iv, "base64"));
  d.setAuthTag(Buffer.from(row.tag, "base64"));
  const teks = Buffer.concat([d.update(Buffer.from(row.data, "base64")), d.final()]).toString("utf8");
  return JSON.parse(teks) as AnakSimpusBlob;
}

function keIsiAnak(b: AnakSimpusBlob): IsiAnak {
  return {
    nama: b.nama ?? "",
    tglLahir: b.tglLahir ?? "",
    jk: b.jenisKelamin === "P" ? "P" : b.jenisKelamin === "L" ? "L" : "",
    namaOrtu: b.namaOrtu ?? "",
    nik: b.nik ?? "",
    noHp: b.noHp ?? "",
    alamat: b.alamatLengkap ?? "",
    rtRw: b.rtRw ?? "",
    vaksin: b.vaksin ?? {},
  };
}

/** Jalankan tarikan penuh. Lempar Error dengan pesan ramah bila konfigurasi belum ada. */
export async function jalankanSinkron(): Promise<HasilSinkron> {
  const url = process.env.SIMPUS_DATABASE_URL ?? "";
  const dekHex = process.env.SIMPUS_DEK ?? "";
  if (!url) throw new Error("SIMPUS_DATABASE_URL belum diisi (connection string Neon SIMPUS).");
  if (!/^[0-9a-f]{64}$/i.test(dekHex)) {
    throw new Error("SIMPUS_DEK belum diisi — jalankan scripts/export-dek-layanan.ts di repo Simpus-Imun.");
  }
  const dek = Buffer.from(dekHex, "hex");

  const pg = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await pg.connect();
  try {
    // 1) master wilayah (id SIMPUS dipertahankan)
    const kel = await pg.query<{ id: number; nama: string; urutan: number }>(
      'SELECT id, nama, urutan FROM "Kelurahan" ORDER BY id',
    );
    for (const k of kel.rows) {
      await db.kelurahan.upsert({
        where: { id: k.id },
        create: { id: k.id, nama: k.nama, urutan: k.urutan },
        update: { nama: k.nama, urutan: k.urutan },
      });
    }
    const pos = await pg.query<{ id: number; kelurahanId: number; nama: string; namaPosyandu: string; aktif: boolean; khusus: boolean }>(
      'SELECT id, "kelurahanId", nama, "namaPosyandu", aktif, khusus FROM "Posyandu" ORDER BY id',
    );
    for (const p of pos.rows) {
      await db.posyandu.upsert({
        where: { id: p.id },
        create: { id: p.id, kelurahanId: p.kelurahanId, nama: p.nama, namaPosyandu: p.namaPosyandu, aktif: p.aktif, khusus: p.khusus },
        update: { kelurahanId: p.kelurahanId, nama: p.nama, namaPosyandu: p.namaPosyandu, aktif: p.aktif, khusus: p.khusus },
      });
    }

    // 2) anak: dekripsi (DEK SIMPUS) → segel ulang (kunci website)
    const anak = await pg.query<{ id: number; posyanduId: number; iv: string; tag: string; data: string }>(
      'SELECT id, "posyanduId", iv, tag, data FROM "Anak" ORDER BY id',
    );
    let masuk = 0, gagal = 0;
    const kini = new Date();
    for (const a of anak.rows) {
      try {
        const isi = keIsiAnak(dekripsiSimpus(a, dek));
        if (!isi.nama || !isi.tglLahir) { gagal++; continue; }
        const ulang = segel(isi);
        await db.anakSimpus.upsert({
          where: { idSimpus: a.id },
          create: { idSimpus: a.id, posyanduId: a.posyanduId, ...ulang, sinkronPada: kini },
          update: { posyanduId: a.posyanduId, ...ulang, sinkronPada: kini },
        });
        masuk++;
      } catch {
        gagal++;
      }
    }

    // 3) cocokkan balik AnakBaru DIEKSPOR ↔ AnakSimpus (NIK, atau nama+tglLahir+posyandu)
    const dicocokkan = await cocokkanBalik();

    // 4) cache dashboard (agregat non-PII per posyandu + total puskesmas)
    await bangunCache(kini);

    return { kelurahan: kel.rows.length, posyandu: pos.rows.length, anak: masuk, gagalDekripsi: gagal, dicocokkan };
  } finally {
    await pg.end();
  }
}

/** AnakBaru DIEKSPOR yang kini sudah ada di SIMPUS → MASUK_SIMPUS + pindahkan klaim/tumbuh/centang. */
async function cocokkanBalik(): Promise<number> {
  const { buka } = await import("@/lib/brankas");
  const menunggu = await db.anakBaru.findMany({ where: { status: "DIEKSPOR" } });
  if (menunggu.length === 0) return 0;

  let n = 0;
  for (const b of menunggu) {
    let isiB: IsiAnak;
    try { isiB = buka<IsiAnak>({ iv: b.iv, tag: b.tag, data: b.data }); } catch { continue; }

    const kandidat = await db.anakSimpus.findMany({ where: { posyanduId: b.posyanduId } });
    let cocok: number | null = null;
    for (const s of kandidat) {
      try {
        const isiS = buka<IsiAnak>({ iv: s.iv, tag: s.tag, data: s.data });
        const nikSama = isiB.nik && isiS.nik && isiB.nik === isiS.nik;
        const namaTglSama =
          isiB.nama.trim().toLowerCase() === isiS.nama.trim().toLowerCase() &&
          isiB.tglLahir === isiS.tglLahir;
        if (nikSama || namaTglSama) { cocok = s.id; break; }
      } catch { /* lewati */ }
    }
    if (cocok === null) continue;

    await db.$transaction([
      db.anakBaru.update({ where: { id: b.id }, data: { status: "MASUK_SIMPUS", anakSimpusId: cocok } }),
      db.klaimAnak.updateMany({ where: { anakBaruId: b.id }, data: { anakBaruId: null, anakSimpusId: cocok } }),
      db.tumbuh.updateMany({ where: { anakBaruId: b.id }, data: { anakBaruId: null, anakSimpusId: cocok } }),
      db.centangOrtu.updateMany({ where: { anakBaruId: b.id }, data: { anakBaruId: null, anakSimpusId: cocok } }),
    ]);
    n++;
  }
  return n;
}

/** Agregat non-PII per posyandu & total: {total,bayi,baduta,idl,ibl}. */
async function bangunCache(kini: Date): Promise<void> {
  const { buka } = await import("@/lib/brankas");
  const semuaPos = await db.posyandu.findMany({ select: { id: true } });
  const total = { total: 0, bayi: 0, baduta: 0, idl: 0, ibl: 0 };

  for (const p of semuaPos) {
    const rows = await db.anakSimpus.findMany({ where: { posyanduId: p.id } });
    const st = { total: 0, bayi: 0, baduta: 0, idl: 0, ibl: 0 };
    for (const r of rows) {
      try {
        const isi = buka<IsiAnak>({ iv: r.iv, tag: r.tag, data: r.data });
        st.total++;
        const u = kelompokUsia(hitungUsiaBulan(isi.tglLahir, kini));
        if (u === "0-11") st.bayi++; else if (u === "12-24") st.baduta++;
        if (lengkap(isi.vaksin, SYARAT_IDL)) st.idl++;
        if (lengkap(isi.vaksin, SYARAT_IBL)) st.ibl++;
      } catch { /* lewati */ }
    }
    total.total += st.total; total.bayi += st.bayi; total.baduta += st.baduta;
    total.idl += st.idl; total.ibl += st.ibl;
    await db.cacheDashboard.upsert({
      where: { kunci: `posyandu:${p.id}` },
      create: { kunci: `posyandu:${p.id}`, data: JSON.stringify(st), sinkronPada: kini },
      update: { data: JSON.stringify(st), sinkronPada: kini },
    });
  }
  await db.cacheDashboard.upsert({
    where: { kunci: "puskesmas" },
    create: { kunci: "puskesmas", data: JSON.stringify(total), sinkronPada: kini },
    update: { data: JSON.stringify(total), sinkronPada: kini },
  });
}
