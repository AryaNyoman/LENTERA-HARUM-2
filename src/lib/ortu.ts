import "server-only";
import { db } from "@/lib/db";
import { buka, type IsiAnak } from "@/lib/brankas";
import type { UserSesi } from "@/lib/sesi";
import type { AnakView } from "@/lib/anak";

function labelPos(p: { nama: string; namaPosyandu: string }): string {
  return p.namaPosyandu ? `${p.nama} (${p.namaPosyandu})` : p.nama;
}

type KlaimRow = {
  anakSimpus: ({ id: number; posyanduId: number; iv: string; tag: string; data: string; posyandu: { nama: string; namaPosyandu: string; kelurahan: { nama: string } } }) | null;
  anakBaru: ({ id: number; posyanduId: number; iv: string; tag: string; data: string; status: string; olehOrtu: boolean; terverifikasi: boolean; posyandu: { nama: string; namaPosyandu: string; kelurahan: { nama: string } } }) | null;
};

function keView(k: KlaimRow): AnakView | null {
  const a = k.anakSimpus ?? k.anakBaru;
  if (!a) return null;
  try {
    const isi = buka<IsiAnak>({ iv: a.iv, tag: a.tag, data: a.data });
    return {
      ref: k.anakSimpus ? `s:${a.id}` : `b:${a.id}`,
      sumber: k.anakSimpus ? "SIMPUS" : "BARU",
      id: a.id,
      posyanduId: a.posyanduId,
      posyanduLabel: labelPos(a.posyandu),
      kelurahan: a.posyandu.kelurahan.nama,
      status: k.anakBaru?.status,
      olehOrtu: k.anakBaru?.olehOrtu,
      terverifikasi: k.anakBaru?.terverifikasi,
      isi,
    };
  } catch {
    return null;
  }
}

const SERTAKAN = {
  anakSimpus: { include: { posyandu: { include: { kelurahan: true } } } },
  anakBaru: { include: { posyandu: { include: { kelurahan: true } } } },
} as const;

/** Seluruh anak yang diklaim orang tua ini (dibuka segelnya), urut nama. */
export async function anakKlaim(user: UserSesi): Promise<AnakView[]> {
  const rows = await db.klaimAnak.findMany({ where: { userId: user.id }, include: SERTAKAN });
  return rows
    .map((r) => keView(r as unknown as KlaimRow))
    .filter((x): x is AnakView => x !== null)
    .sort((a, b) => a.isi.nama.localeCompare(b.isi.nama, "id"));
}

/** Satu anak by ref DENGAN cek kepemilikan klaim (ortu). ADMIN ikut jalur ini juga boleh. */
export async function ambilAnakOrtu(ref: string, user: UserSesi): Promise<AnakView | null> {
  const m = /^([sb]):(\d+)$/.exec(ref);
  if (!m) return null;
  const id = Number(m[2]);
  const where =
    m[1] === "s"
      ? { userId: user.id, anakSimpusId: id }
      : { userId: user.id, anakBaruId: id };
  const k = await db.klaimAnak.findFirst({ where, include: SERTAKAN });
  if (!k) return null;
  return keView(k as unknown as KlaimRow);
}
