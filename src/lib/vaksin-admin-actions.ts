"use server";

/** Menu ADMIN "Isi Tanggal Vaksin" — HANYA untuk AnakBaru yang belum masuk SIMPUS
 *  (anakSimpusId == null; DRAF/DIEKSPOR). Anak yang sudah masuk SIMPUS diisi lewat
 *  SIMPUS (sumber kebenaran) — lihat PLAN-2026-07-18(c) keputusan #4.
 *  File BARU, sengaja TIDAK mengimpor src/lib/anak-actions.ts (sedang diedit paralel
 *  oleh builder lain) — beberapa helper kecil (KODE_SAH, galatKe, bacaVaksin) diduplikasi
 *  dari pola di sana. Duplikasi kecil ini disengaja (lihat PLAN W2 poin 3); rapikan saat
 *  merge W1+W2 bila relevan. */

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { segel, buka, type IsiAnak } from "@/lib/brankas";
import { wajibUser } from "@/lib/sesi";
import { hitungUsiaBulan } from "@/lib/anak";
import {
  DOSIS_REGISTRY, VARIAN_MEREK, namaKode, validasiDosis, adaDosis, dosisTakBerlaku,
} from "@/lib/vaksin";

/** Semua kode input dosis yang sah (kode slot + seluruh varian merek) — sama isinya
 *  dgn KODE_SAH di anak-actions.ts (duplikasi kecil disengaja, lihat komentar atas). */
const KODE_SAH = new Set<string>([
  ...DOSIS_REGISTRY.map((d) => d.kode),
  ...Object.values(VARIAN_MEREK).flat().map((v) => v.kode),
]);

function galatKe(url: string, pesan: string): never {
  redirect(`${url}?galat=${encodeURIComponent(pesan)}`);
}

async function catat(userId: number, aksi: string, detail = "") {
  await db.logAktivitas.create({ data: { userId, aksi, detail } });
}

function bukaAman(row: { iv: string; tag: string; data: string }): IsiAnak | null {
  try {
    return buka<IsiAnak>(row);
  } catch {
    return null;
  }
}

// ═══ BACA (dipakai halaman list & detail) ═══

export interface AnakVaksinRingkas {
  id: number;
  nama: string;
  usiaBulan: number;
  sudah: number;
  total: number;
}

/** Daftar AnakBaru anakSimpusId==null di satu posyandu, ringkas utk kartu daftar. */
export async function daftarVaksinAdmin(posyanduId: number): Promise<AnakVaksinRingkas[]> {
  await wajibUser("ADMIN");
  if (!Number.isInteger(posyanduId) || posyanduId <= 0) return [];
  const rows = await db.anakBaru.findMany({
    where: { posyanduId, anakSimpusId: null },
    orderBy: { dibuatPada: "desc" },
  });
  const out: AnakVaksinRingkas[] = [];
  for (const a of rows) {
    const isi = bukaAman(a);
    if (!isi) continue;
    const relevan = DOSIS_REGISTRY.filter((d) => !dosisTakBerlaku(d.kode, isi.vaksin));
    out.push({
      id: a.id,
      nama: isi.nama,
      usiaBulan: hitungUsiaBulan(isi.tglLahir),
      sudah: relevan.filter((d) => adaDosis(isi.vaksin, d.kode)).length,
      total: relevan.length,
    });
  }
  // Anak yang paling belum diisi (sudah terkecil) paling atas — supaya admin lihat PR
  // dulu. Array.prototype.sort dijamin stabil (ES2019+/Node modern), jadi anak dengan
  // `sudah` sama tetap dalam urutan `dibuatPada desc` dari query di atas (tie-break lama
  // dipertahankan otomatis, tanpa perlu bandingkan dibuatPada di sini).
  out.sort((a, b) => a.sudah - b.sudah);
  return out;
}

export interface AnakVaksinDetail {
  id: number;
  nama: string;
  tglLahir: string;
  jk: "L" | "P" | "";
  posyanduLabel: string;
  vaksin: Record<string, string>;
}

/** Satu anak utk form isi dosis admin — null bila tak ada / sudah masuk SIMPUS / rusak. */
export async function ambilVaksinAdmin(id: number): Promise<AnakVaksinDetail | null> {
  await wajibUser("ADMIN");
  if (!Number.isInteger(id) || id <= 0) return null;
  const a = await db.anakBaru.findUnique({ where: { id }, include: { posyandu: true } });
  if (!a || a.anakSimpusId != null) return null;
  const isi = bukaAman(a);
  if (!isi) return null;
  return {
    id: a.id,
    nama: isi.nama,
    tglLahir: isi.tglLahir,
    jk: isi.jk,
    posyanduLabel: a.posyandu.namaPosyandu ? `${a.posyandu.nama} (${a.posyandu.namaPosyandu})` : a.posyandu.nama,
    vaksin: isi.vaksin,
  };
}

// ═══ SIMPAN ═══

/** ADMIN menyimpan tanggal dosis anak DRAF/DIEKSPOR (belum masuk SIMPUS). Guard id
 *  integer (pola hapusAkun di akun-actions.ts) + target WAJIB AnakBaru anakSimpusId==null
 *  (tamper id / anak yang sudah masuk SIMPUS → galat rapi, bukan crash). Dosis:
 *  input name "vaksin__<KODE>" (sama konvensi bacaFormAnak) — validasiDosis dgn
 *  vaksinLama = dosis tersimpan (grandfather, sama pola simpanAnakBaru mode edit).
 *  Log aktivitas HANYA ref anak (b:<id>) — TIDAK PERNAH tanggal/isi dosis (PII). */
export async function simpanVaksinAdmin(formData: FormData): Promise<void> {
  const admin = await wajibUser("ADMIN");
  const id = Number(formData.get("id")) || 0;
  if (!Number.isInteger(id) || id <= 0) redirect("/admin/vaksin?galat=" + encodeURIComponent("Anak tidak ditemukan."));

  const target = await db.anakBaru.findUnique({ where: { id } });
  if (!target) redirect("/admin/vaksin?galat=" + encodeURIComponent("Anak tidak ditemukan."));
  if (target.anakSimpusId != null) {
    redirect("/admin/vaksin?galat=" + encodeURIComponent("Anak ini sudah masuk SIMPUS — isi lewat SIMPUS."));
  }
  const isi = bukaAman(target);
  if (!isi) redirect("/admin/vaksin?galat=" + encodeURIComponent("Data anak tidak terbaca."));

  const balik = `/admin/vaksin/${id}`;
  const vaksinBaru: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (!k.startsWith("vaksin__")) continue;
    const kode = k.slice(8);
    const tgl = String(v).trim();
    if (!tgl) continue;
    if (!KODE_SAH.has(kode)) continue;
    if (Number.isNaN(Date.parse(tgl))) galatKe(balik, `Tanggal ${namaKode(kode)} tidak valid.`);
    if (Date.parse(tgl) < Date.parse(isi.tglLahir)) galatKe(balik, `Tanggal ${namaKode(kode)} mendahului tanggal lahir.`);
    vaksinBaru[kode] = tgl;
  }

  const galatDosis = validasiDosis(vaksinBaru, isi.tglLahir, isi.vaksin ?? {});
  if (galatDosis) galatKe(balik, galatDosis);

  const tersegel = segel({ ...isi, vaksin: vaksinBaru });
  await db.anakBaru.update({ where: { id }, data: tersegel });
  await catat(admin.id, "VAKSIN_DIISI_ADMIN", `b:${id}`);
  redirect(`${balik}?ok=${encodeURIComponent("Dosis tersimpan.")}`);
}
