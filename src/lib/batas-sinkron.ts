import "server-only";
import { db } from "@/lib/db";

/** ═══ Batas sinkron manual SIMPUS (PLAN 2026-07-19 Y3) ═══
 *  Lindungi Neon SIMPUS dari overuse tombol "Tarik sekarang": maks 1 percobaan per 24 jam
 *  berjalan (rolling, bukan per-hari-kalender) DAN maks 3 percobaan per 120 jam (5×24) berjalan.
 *  Kedua batas berlaku BERSAMAAN — ditolak bila SALAH SATU terlampaui, bukan alternatif.
 *
 *  File terpisah TANPA "use server" (beda dari sinkron-actions.ts): Next.js App Router
 *  mewajibkan SEMUA export file "use server" jadi async function, sedangkan `cekBatasSinkron`
 *  murni & sync (supaya gampang diuji tanpa mock db/next). `sisaBatasSinkron` async tapi juga
 *  BUKAN server action (dipanggil langsung dari Server Component admin/page.tsx). */

const JAM_MS = 3_600_000;
const JENDELA_24_JAM_MS = 24 * JAM_MS;
const JENDELA_120_JAM_MS = 120 * JAM_MS;
const MAKS_24_JAM = 1;
const MAKS_120_JAM = 3;

/** Aksi log yg dihitung sbg "percobaan" — sukses MAUPUN gagal, keduanya tetap membebani
 *  koneksi ke Neon SIMPUS. Diekspor supaya sinkron-actions.ts pakai daftar yg sama persis. */
export const AKSI_SINKRON_DIHITUNG = ["SINKRON_SIMPUS", "SINKRON_GAGAL"] as const;
export { JENDELA_120_JAM_MS };

/** Ambil yg jatuh dalam jendela `jendelaMs` terakhir, terurut menaik (terlama dulu). */
function dalamJendela(waktu: Date[], sekarang: Date, jendelaMs: number): Date[] {
  return waktu
    .filter((w) => sekarang.getTime() - w.getTime() < jendelaMs)
    .sort((a, b) => a.getTime() - b.getTime());
}

/** Kapan boleh lagi: saat percobaan ke-(n-maks) — yg terlama di antara yg masih "menghalangi" —
 *  keluar dari jendela. (n==maks, kasus normal, → percobaan terlama itu sendiri + jendelaMs.) */
function bolehLagiPada(dalamJendelaAsc: Date[], maks: number, jendelaMs: number): Date {
  const idx = dalamJendelaAsc.length - maks;
  return new Date(dalamJendelaAsc[idx].getTime() + jendelaMs);
}

/** Gerbang murni, tanpa I/O — mudah diuji. `waktuSebelumnya` = waktu tiap percobaan
 *  (SINKRON_SIMPUS/SINKRON_GAGAL) sebelumnya, urutan bebas. */
export function cekBatasSinkron(
  waktuSebelumnya: Date[],
  sekarang: Date,
): { boleh: true } | { boleh: false; alasan: string } {
  const w24 = dalamJendela(waktuSebelumnya, sekarang, JENDELA_24_JAM_MS);
  if (w24.length >= MAKS_24_JAM) {
    const lagi = bolehLagiPada(w24, MAKS_24_JAM, JENDELA_24_JAM_MS);
    return {
      boleh: false,
      alasan: `Sudah menarik data hari ini (maks 1x per 24 jam). Coba lagi ${lagi.toLocaleString("id-ID")}.`,
    };
  }
  const w120 = dalamJendela(waktuSebelumnya, sekarang, JENDELA_120_JAM_MS);
  if (w120.length >= MAKS_120_JAM) {
    const lagi = bolehLagiPada(w120, MAKS_120_JAM, JENDELA_120_JAM_MS);
    return {
      boleh: false,
      alasan: `Sudah 3x dalam 5 hari (maks 3x per 120 jam). Coba lagi ${lagi.toLocaleString("id-ID")}.`,
    };
  }
  return { boleh: true };
}

/** Sisa kuota utk kartu admin (caption di bawah tombol). BUKAN server action — dipanggil
 *  langsung dari Server Component, bukan lewat form client. */
export async function sisaBatasSinkron(userId: number): Promise<{ terkunci: boolean; caption: string }> {
  const sekarang = new Date();
  const sejak = new Date(sekarang.getTime() - JENDELA_120_JAM_MS);
  const baris = await db.logAktivitas.findMany({
    where: { userId, aksi: { in: [...AKSI_SINKRON_DIHITUNG] }, pada: { gte: sejak } },
    select: { pada: true },
  });
  const waktu = baris.map((b) => b.pada);
  const w24 = dalamJendela(waktu, sekarang, JENDELA_24_JAM_MS);
  const w120 = dalamJendela(waktu, sekarang, JENDELA_120_JAM_MS);
  const terkunci = !cekBatasSinkron(waktu, sekarang).boleh;

  if (terkunci) {
    const lagi = w24.length >= MAKS_24_JAM
      ? bolehLagiPada(w24, MAKS_24_JAM, JENDELA_24_JAM_MS)
      : bolehLagiPada(w120, MAKS_120_JAM, JENDELA_120_JAM_MS);
    return { terkunci: true, caption: `Terkunci — coba lagi ${lagi.toLocaleString("id-ID")}.` };
  }
  return {
    terkunci: false,
    caption: `${w24.length}/${MAKS_24_JAM} hari ini · ${w120.length}/${MAKS_120_JAM} dalam 5 hari`,
  };
}
