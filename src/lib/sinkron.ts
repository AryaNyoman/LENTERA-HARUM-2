import "server-only";
import { Client } from "pg";
import { createDecipheriv } from "crypto";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { segel, buka, type IsiAnak } from "@/lib/brankas";
import { lengkap, SYARAT_IDL, SYARAT_IBL } from "@/lib/vaksin";
import { hitungUsiaBulan, kelompokUsia } from "@/lib/anak";

/** ═══ Sinkron SIMPUS → SIMPUS-POSYANDU (satu arah, baca-saja) ═══
 *  Sumber: database Neon milik SIMPUS petugas (env SIMPUS_DATABASE_URL).
 *  PII anak di sana terenkripsi AES-256-GCM dengan DEK brankas — "amplop layanan"
 *  = DEK yang diekspor pemilik lewat scripts/export-dek-layanan.ts di repo Simpus-Imun,
 *  lalu disimpan di env SIMPUS_DEK (hex 64 karakter). Kunci hanya hidup di server ini.
 *  Hasil: master wilayah + salinan anak (disegel ulang kunci website) + cache dashboard.
 *
 *  Prinsip hemat-operasi (PLAN 2026-07-18b/H2): baca lokal SEKALI, bandingkan plaintext
 *  di memori, tulis HANYA yang baru/berubah — bukan upsert per baris tanpa syarat.
 *  `tarikSumber()` (pg, baca+dekripsi saja) dipisah dari `terapkanHasil()` (db lokal saja)
 *  supaya diff bisa diuji dengan sumber sintetis tanpa koneksi Neon. Alur produksi tetap
 *  satu pintu lewat `jalankanSinkron()`. */

interface HasilSinkron {
  kelurahan: number;
  posyandu: number;
  anak: number;
  gagalDekripsi: number;
  dicocokkan: number; // AnakBaru DIEKSPOR → MASUK_SIMPUS
}

/** Anak sebagaimana dibaca dari SUMBER (SIMPUS), sudah didekripsi ke plaintext. */
export interface AnakSumber {
  idSimpus: number;
  posyanduId: number;
  isi: IsiAnak;
}

/** Anak sebagaimana ada di LOKAL saat ini. `isi: null` = gagal buka (kunci beda/data
 *  korup) — diperlakukan sebagai "berubah" (tulis ulang), bukan dilempar sebagai galat. */
export interface AnakLokal {
  idSimpus: number;
  posyanduId: number;
  isi: IsiAnak | null;
}

/** Bahan mentah hasil `tarikSumber()` — cukup untuk `terapkanHasil()` tanpa koneksi pg lagi. */
export interface SumberSinkron {
  kelurahan: { id: number; nama: string; urutan: number }[];
  posyandu: { id: number; kelurahanId: number; nama: string; namaPosyandu: string; aktif: boolean; khusus: boolean }[];
  anak: AnakSumber[];
  idTidakJelas: number[]; // id posyandu keranjang "Alamat Tidak Jelas" — anaknya tak diimpor
  gagalDekripsi: number;
}

/** Stringify stabil (urutan kunci objek diabaikan, termasuk nested `vaksin`) — dipakai
 *  membandingkan plaintext anak apa adanya, tanpa peduli urutan properti JS. */
function stabilkan(nilai: unknown): unknown {
  if (Array.isArray(nilai)) return nilai.map(stabilkan);
  if (nilai !== null && typeof nilai === "object") {
    const obj = nilai as Record<string, unknown>;
    const hasil: Record<string, unknown> = {};
    for (const k of Object.keys(obj).sort()) hasil[k] = stabilkan(obj[k]);
    return hasil;
  }
  return nilai;
}

export function stringifyStabil(isi: IsiAnak): string {
  return JSON.stringify(stabilkan(isi));
}

export interface RencanaDiffAnak {
  baru: AnakSumber[];
  ubah: AnakSumber[];
  sama: number;
}

/** Logika diff murni (tanpa db/crypto side-effect) — bisa diuji langsung tanpa dev.db.
 *  Baris lokal yang tak ada di `sumber` (hilang dari SIMPUS) sengaja DIABAIKAN di sini:
 *  perilaku lama tidak menghapus anak (relasi klaim/tumbuh/centang ber-cascade). */
export function rencanaDiffAnak(lokal: AnakLokal[], sumber: AnakSumber[]): RencanaDiffAnak {
  const peta = new Map(lokal.map((l) => [l.idSimpus, l]));
  const baru: AnakSumber[] = [];
  const ubah: AnakSumber[] = [];
  let sama = 0;
  for (const s of sumber) {
    const l = peta.get(s.idSimpus);
    if (!l) { baru.push(s); continue; }
    const berubah = l.isi === null || l.posyanduId !== s.posyanduId || stringifyStabil(l.isi) !== stringifyStabil(s.isi);
    if (berubah) ubah.push(s); else sama++;
  }
  return { baru, ubah, sama };
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

/** Baca + dekripsi SAJA dari Neon SIMPUS (tanpa menyentuh db lokal) — bisa diganti
 *  "sumber sintetis" saat uji, karena `terapkanHasil()` tak butuh koneksi pg. */
export async function tarikSumber(): Promise<SumberSinkron> {
  const url = process.env.SIMPUS_DATABASE_URL ?? "";
  const dekHex = process.env.SIMPUS_DEK ?? "";
  if (!url) throw new Error("SIMPUS_DATABASE_URL belum diisi (connection string Neon SIMPUS).");
  if (!/^[0-9a-f]{64}$/i.test(dekHex)) {
    throw new Error("SIMPUS_DEK belum diisi — jalankan scripts/export-dek-layanan.ts di repo Simpus-Imun.");
  }
  const dek = Buffer.from(dekHex, "hex");

  // Timeout agar tombol tak menggantung selamanya bila Neon SIMPUS lambat/tak terjangkau
  // (server action akan melempar error → dicatat & ditampilkan, bukan diam).
  const pg = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
    query_timeout: 60000,
  });
  await pg.connect();
  try {
    const kel = await pg.query<{ id: number; nama: string; urutan: number }>(
      'SELECT id, nama, urutan FROM "Kelurahan" ORDER BY id',
    );
    const pos = await pg.query<{ id: number; kelurahanId: number; nama: string; namaPosyandu: string; aktif: boolean; khusus: boolean }>(
      'SELECT id, "kelurahanId", nama, "namaPosyandu", aktif, khusus FROM "Posyandu" ORDER BY id',
    );
    // Keranjang "Alamat Tidak Jelas" di SIMPUS bukan posyandu nyata → jangan tampil
    // di pilihan form & anaknya tidak diimpor (permintaan pemilik).
    const idTidakJelas = new Set(
      pos.rows.filter((p) => /alamat tidak jelas/i.test(p.nama)).map((p) => p.id),
    );
    const posyandu = pos.rows.map((p) => ({
      id: p.id,
      kelurahanId: p.kelurahanId,
      nama: p.nama,
      namaPosyandu: p.namaPosyandu,
      aktif: p.aktif && !idTidakJelas.has(p.id),
      khusus: p.khusus,
    }));

    // anak: dekripsi (DEK SIMPUS) → plaintext (segel ulang terjadi di terapkanHasil, hanya utk yang baru/berubah)
    const anakRows = await pg.query<{ id: number; posyanduId: number; iv: string; tag: string; data: string }>(
      'SELECT id, "posyanduId", iv, tag, data FROM "Anak" ORDER BY id',
    );
    const anak: AnakSumber[] = [];
    let gagalDekripsi = 0;
    for (const a of anakRows.rows) {
      if (idTidakJelas.has(a.posyanduId)) continue;
      try {
        const isi = keIsiAnak(dekripsiSimpus(a, dek));
        if (!isi.nama || !isi.tglLahir) { gagalDekripsi++; continue; }
        anak.push({ idSimpus: a.id, posyanduId: a.posyanduId, isi });
      } catch {
        gagalDekripsi++;
      }
    }

    return {
      kelurahan: kel.rows.map((k) => ({ id: k.id, nama: k.nama, urutan: k.urutan })),
      posyandu,
      anak,
      idTidakJelas: [...idTidakJelas],
      gagalDekripsi,
    };
  } finally {
    await pg.end();
  }
}

/** Terapkan sumber (sudah dibaca) ke db lokal: tulis HANYA yang baru/berubah.
 *  Tanpa koneksi pg — bisa dipanggil langsung dgn `SumberSinkron` sintetis saat uji. */
export async function terapkanHasil(sumber: SumberSinkron): Promise<HasilSinkron> {
  const kini = new Date();

  // Prinsip keandalan (temuan critic H2): satu baris busuk (mis. duplikat idSimpus dari
  // dua run beriringan, atau FK yatim) TIDAK boleh membatalkan sisa sinkron. Kode lama
  // upsert per baris di dalam try/catch, jadi galat per-baris memang tertelan per-baris —
  // pertahankan sifat itu. createMany = SATU statement: gagal → ulang per-baris supaya
  // tetangga sehat di batch yang sama tetap masuk.

  // 1) kelurahan — diff & tulis hanya yang baru/berubah
  const kelLokal = await db.kelurahan.findMany();
  const petaKelLokal = new Map(kelLokal.map((k) => [k.id, k]));
  const kelBaru = sumber.kelurahan.filter((k) => !petaKelLokal.has(k.id));
  const kelUbah = sumber.kelurahan.filter((k) => {
    const l = petaKelLokal.get(k.id);
    return l !== undefined && (l.nama !== k.nama || l.urutan !== k.urutan);
  });
  if (kelBaru.length > 0) {
    try {
      await db.kelurahan.createMany({ data: kelBaru });
    } catch {
      for (const k of kelBaru) {
        try { await db.kelurahan.create({ data: k }); } catch { /* lewati baris busuk */ }
      }
    }
  }
  for (const k of kelUbah) {
    try {
      await db.kelurahan.update({ where: { id: k.id }, data: { nama: k.nama, urutan: k.urutan } });
    } catch { /* lewati */ }
  }
  if (kelBaru.length > 0 || kelUbah.length > 0) {
    // Best-effort: di luar konteks request Next (skrip/cron/uji) revalidateTag melempar
    // "static generation store missing" — invalidasi cache tak boleh menjegal sinkron data.
    try { revalidateTag("kelurahan"); } catch { /* abaikan */ }
  }

  // 2) posyandu — pola sama
  const posLokal = await db.posyandu.findMany();
  const petaPosLokal = new Map(posLokal.map((p) => [p.id, p]));
  const posBaru = sumber.posyandu.filter((p) => !petaPosLokal.has(p.id));
  const posUbah = sumber.posyandu.filter((p) => {
    const l = petaPosLokal.get(p.id);
    return l !== undefined && (
      l.kelurahanId !== p.kelurahanId || l.nama !== p.nama || l.namaPosyandu !== p.namaPosyandu ||
      l.aktif !== p.aktif || l.khusus !== p.khusus
    );
  });
  if (posBaru.length > 0) {
    try {
      await db.posyandu.createMany({ data: posBaru });
    } catch {
      for (const p of posBaru) {
        try { await db.posyandu.create({ data: p }); } catch { /* lewati baris busuk */ }
      }
    }
  }
  for (const p of posUbah) {
    try {
      await db.posyandu.update({
        where: { id: p.id },
        data: { kelurahanId: p.kelurahanId, nama: p.nama, namaPosyandu: p.namaPosyandu, aktif: p.aktif, khusus: p.khusus },
      });
    } catch { /* lewati */ }
  }

  // 3) anak — baca lokal SEKALI, diff plaintext, tulis hanya baru/berubah
  if (sumber.idTidakJelas.length > 0) {
    await db.anakSimpus.deleteMany({ where: { posyanduId: { in: sumber.idTidakJelas } } });
  }
  const anakLokalRows = await db.anakSimpus.findMany({
    select: { idSimpus: true, posyanduId: true, iv: true, tag: true, data: true },
  });
  const anakLokal: AnakLokal[] = anakLokalRows.map((a) => {
    let isi: IsiAnak | null;
    try { isi = buka<IsiAnak>({ iv: a.iv, tag: a.tag, data: a.data }); } catch { isi = null; }
    return { idSimpus: a.idSimpus, posyanduId: a.posyanduId, isi };
  });
  const { baru, ubah } = rencanaDiffAnak(anakLokal, sumber.anak);

  // Gagal-tulis anak dihitung ke `gagalDekripsi` — kode lama juga begitu (catch di sekeliling
  // upsert lama menangkap galat tulis, bukan cuma galat dekripsi).
  let gagalTulis = 0;
  for (let i = 0; i < baru.length; i += 250) {
    const batch = baru.slice(i, i + 250).map((a) => ({
      idSimpus: a.idSimpus, posyanduId: a.posyanduId, ...segel(a.isi), sinkronPada: kini,
    }));
    try {
      await db.anakSimpus.createMany({ data: batch });
    } catch {
      for (const baris of batch) {
        try { await db.anakSimpus.create({ data: baris }); } catch { gagalTulis++; }
      }
    }
  }
  for (const a of ubah) {
    try {
      await db.anakSimpus.update({
        where: { idSimpus: a.idSimpus },
        data: { posyanduId: a.posyanduId, ...segel(a.isi), sinkronPada: kini },
      });
    } catch { gagalTulis++; }
  }

  // 4) cocokkan balik AnakBaru DIEKSPOR ↔ AnakSimpus (NIK, atau nama+tglLahir+posyandu)
  const dicocokkan = await cocokkanBalik();

  // 5) cache dashboard — pakai ulang plaintext yang sudah di memori (langkah 3), 0 query per-posyandu:
  //    baris hidup dari sumber (fresh) + baris lokal yang tak ada di sumber (hilang/gagal-dekripsi
  //    ronde ini, tak disentuh di atas → tetap hidup, pakai plaintext lokal yang berhasil dibuka).
  const idSumberAnak = new Set(sumber.anak.map((a) => a.idSimpus));
  const hidup: { posyanduId: number; isi: IsiAnak }[] = [
    ...sumber.anak.map((a) => ({ posyanduId: a.posyanduId, isi: a.isi })),
    ...anakLokal
      .filter((l): l is AnakLokal & { isi: IsiAnak } => l.isi !== null && !idSumberAnak.has(l.idSimpus))
      .map((l) => ({ posyanduId: l.posyanduId, isi: l.isi })),
  ];
  const semuaPosyanduId = new Set<number>([...petaPosLokal.keys(), ...posBaru.map((p) => p.id)]);
  await bangunCache(kini, hidup, semuaPosyanduId);

  return {
    kelurahan: sumber.kelurahan.length,
    posyandu: sumber.posyandu.length,
    anak: sumber.anak.length - gagalTulis, // semantik lama: baris yang sukses diproses ronde ini
    gagalDekripsi: sumber.gagalDekripsi + gagalTulis,
    dicocokkan,
  };
}

/** Jalankan tarikan penuh. Lempar Error dengan pesan ramah bila konfigurasi belum ada. */
export async function jalankanSinkron(): Promise<HasilSinkron> {
  const sumber = await tarikSumber();
  return terapkanHasil(sumber);
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

interface Agregat { total: number; bayi: number; baduta: number; idl: number; ibl: number }
function agregatKosong(): Agregat {
  return { total: 0, bayi: 0, baduta: 0, idl: 0, ibl: 0 };
}

/** Agregat non-PII per posyandu & total: {total,bayi,baduta,idl,ibl}. Dihitung di memori dari
 *  `hidup` (plaintext yang sudah dibaca langkah 3 di `terapkanHasil` — TANPA findMany per posyandu).
 *  Baca cache lama SEKALI, upsert hanya kunci yang JSON-nya berubah + "puskesmas" (selalu ditulis
 *  supaya `sinkronPada` "tarikan terakhir" yang dibaca dashboard kader/ortu tetap maju). */
async function bangunCache(kini: Date, hidup: { posyanduId: number; isi: IsiAnak }[], posyanduIds: Set<number>): Promise<void> {
  const perPosyandu = new Map<number, Agregat>();
  for (const { posyanduId, isi } of hidup) {
    const st = perPosyandu.get(posyanduId) ?? agregatKosong();
    st.total++;
    const u = kelompokUsia(hitungUsiaBulan(isi.tglLahir, kini));
    if (u === "0-11") st.bayi++; else if (u === "12-24") st.baduta++;
    if (lengkap(isi.vaksin, SYARAT_IDL)) st.idl++;
    if (lengkap(isi.vaksin, SYARAT_IBL)) st.ibl++;
    perPosyandu.set(posyanduId, st);
  }

  const total = agregatKosong();
  for (const st of perPosyandu.values()) {
    total.total += st.total; total.bayi += st.bayi; total.baduta += st.baduta;
    total.idl += st.idl; total.ibl += st.ibl;
  }

  const cacheLama = await db.cacheDashboard.findMany({ select: { kunci: true, data: true } });
  const dataLama = new Map(cacheLama.map((c) => [c.kunci, c.data]));

  for (const id of posyanduIds) {
    const kunci = `posyandu:${id}`;
    const json = JSON.stringify(perPosyandu.get(id) ?? agregatKosong());
    if (dataLama.get(kunci) === json) continue; // tak berubah — jangan sentuh
    try {
      await db.cacheDashboard.upsert({
        where: { kunci },
        create: { kunci, data: json, sinkronPada: kini },
        update: { data: json, sinkronPada: kini },
      });
    } catch { /* satu kunci gagal jangan menjegal sisanya — tarikan berikut menyembuhkan */ }
  }
  try {
    await db.cacheDashboard.upsert({
      where: { kunci: "puskesmas" },
      create: { kunci: "puskesmas", data: JSON.stringify(total), sinkronPada: kini },
      update: { data: JSON.stringify(total), sinkronPada: kini },
    });
  } catch { /* idem */ }
}
