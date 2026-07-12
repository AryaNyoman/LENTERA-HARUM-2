import "server-only";
import { db } from "@/lib/db";
import { buka, type IsiAnak } from "@/lib/brankas";
import type { UserSesi } from "@/lib/sesi";

/** Satu anak (gabungan sumber SIMPUS & pendaftaran baru) yang sudah dibuka segelnya
 *  untuk pemakaian server-side. ref = "s:<id>" (AnakSimpus) | "b:<id>" (AnakBaru). */
export interface AnakView {
  ref: string;
  sumber: "SIMPUS" | "BARU";
  id: number;
  posyanduId: number;
  posyanduLabel: string; // "Nesa Timur (Seruni)"
  kelurahan: string;
  status?: string; // AnakBaru: DRAF | DIEKSPOR | MASUK_SIMPUS
  olehOrtu?: boolean; // AnakBaru: true = diinput orang tua sendiri
  terverifikasi?: boolean; // AnakBaru: ortu-input belum diverifikasi kader?
  isi: IsiAnak;
}

function labelPos(p: { nama: string; namaPosyandu: string }): string {
  return p.namaPosyandu ? `${p.nama} (${p.namaPosyandu})` : p.nama;
}

/** Posyandu yang boleh diakses user: binaan (KADER) / semua (ADMIN). */
export async function binaanIds(user: UserSesi): Promise<number[]> {
  if (user.peran === "ADMIN") {
    return (await db.posyandu.findMany({ select: { id: true } })).map((p) => p.id);
  }
  const rows = await db.userPosyandu.findMany({ where: { userId: user.id } });
  return rows.map((r) => r.posyanduId);
}

type RowPos = { posyandu: { nama: string; namaPosyandu: string; kelurahan: { nama: string } } };

function bukaAman(row: { id: number; iv: string; tag: string; data: string }): IsiAnak | null {
  try {
    return buka<IsiAnak>({ iv: row.iv, tag: row.tag, data: row.data });
  } catch {
    return null; // kunci salah / data rusak → jangan runtuhkan seluruh daftar
  }
}

/** Seluruh anak dalam scope user (AnakSimpus + AnakBaru yang belum masuk SIMPUS), urut nama. */
export async function ambilAnakBinaan(user: UserSesi): Promise<AnakView[]> {
  const ids = await binaanIds(user);
  if (ids.length === 0) return [];
  const [simpus, baru] = await Promise.all([
    db.anakSimpus.findMany({
      where: { posyanduId: { in: ids } },
      include: { posyandu: { include: { kelurahan: true } } },
    }),
    db.anakBaru.findMany({
      where: { posyanduId: { in: ids }, status: { not: "MASUK_SIMPUS" } },
      include: { posyandu: { include: { kelurahan: true } } },
    }),
  ]);

  const out: AnakView[] = [];
  for (const a of simpus as (typeof simpus[number] & RowPos)[]) {
    const isi = bukaAman(a);
    if (isi)
      out.push({
        ref: `s:${a.id}`, sumber: "SIMPUS", id: a.id, posyanduId: a.posyanduId,
        posyanduLabel: labelPos(a.posyandu), kelurahan: a.posyandu.kelurahan.nama, isi,
      });
  }
  for (const a of baru as (typeof baru[number] & RowPos)[]) {
    const isi = bukaAman(a);
    if (isi)
      out.push({
        ref: `b:${a.id}`, sumber: "BARU", id: a.id, posyanduId: a.posyanduId,
        posyanduLabel: labelPos(a.posyandu), kelurahan: a.posyandu.kelurahan.nama,
        status: a.status, olehOrtu: a.olehOrtu, terverifikasi: a.terverifikasi, isi,
      });
  }
  return out.sort((x, y) => x.isi.nama.localeCompare(y.isi.nama, "id"));
}

/** Satu anak by ref, dengan pemeriksaan hak akses (kader: posyandu binaan; admin: semua).
 *  null bila tak ditemukan / di luar scope. */
export async function ambilAnak(ref: string, user: UserSesi): Promise<AnakView | null> {
  const m = /^([sb]):(\d+)$/.exec(ref);
  if (!m) return null;
  const id = Number(m[2]);
  const ids = await binaanIds(user);

  if (m[1] === "s") {
    const a = await db.anakSimpus.findUnique({
      where: { id }, include: { posyandu: { include: { kelurahan: true } } },
    });
    if (!a || !ids.includes(a.posyanduId)) return null;
    const isi = bukaAman(a);
    return isi && {
      ref, sumber: "SIMPUS", id, posyanduId: a.posyanduId,
      posyanduLabel: labelPos(a.posyandu), kelurahan: a.posyandu.kelurahan.nama, isi,
    };
  }
  const a = await db.anakBaru.findUnique({
    where: { id }, include: { posyandu: { include: { kelurahan: true } } },
  });
  if (!a || !ids.includes(a.posyanduId)) return null;
  const isi = bukaAman(a);
  return isi && {
    ref, sumber: "BARU", id, posyanduId: a.posyanduId,
    posyanduLabel: labelPos(a.posyandu), kelurahan: a.posyandu.kelurahan.nama,
    status: a.status, olehOrtu: a.olehOrtu, terverifikasi: a.terverifikasi, isi,
  };
}

// ═══ util usia & tanggal (murni) ═══

/** Umur bulan penuh dari YYYY-MM-DD ke acuan (pola hitungUmurBulan SIMPUS). Min 0. */
export function hitungUsiaBulan(tglLahir: string, acuan: Date = new Date()): number {
  const lahir = new Date(tglLahir + "T00:00:00");
  if (Number.isNaN(lahir.getTime())) return 0;
  let bulan = (acuan.getFullYear() - lahir.getFullYear()) * 12 + (acuan.getMonth() - lahir.getMonth());
  if (acuan.getDate() < lahir.getDate()) bulan -= 1;
  return Math.max(0, bulan);
}

export function labelUsia(bulan: number): string {
  if (bulan < 12) return `${bulan} bln`;
  const th = Math.floor(bulan / 12);
  const sisa = bulan % 12;
  return sisa === 0 ? `${th} th` : `${th} th ${sisa} bln`;
}

const BULAN_ID = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

/** "2026-03-06" → "6 Maret 2026" (kosong/invalid → "—"). */
export function fmtTglId(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "");
  if (!m) return "—";
  return `${Number(m[3])} ${BULAN_ID[Number(m[2]) - 1]} ${m[1]}`;
}

/** Kelompok filter usia daftar bayi. */
export function kelompokUsia(bulan: number): "0-11" | "12-24" | ">24" {
  if (bulan <= 11) return "0-11";
  if (bulan <= 24) return "12-24";
  return ">24";
}
