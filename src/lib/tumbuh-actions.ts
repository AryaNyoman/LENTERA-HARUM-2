"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { wajibUser } from "@/lib/sesi";
import { ambilAnak, hitungUsiaBulan } from "@/lib/anak";
import { ambilAnakOrtu } from "@/lib/ortu";

/** Cek hak atas anak: kader/admin lewat binaan, ortu lewat klaim. Kembalikan tglLahir. */
async function cekAkses(ref: string, user: Awaited<ReturnType<typeof wajibUser>>): Promise<{ tglLahir: string } | null> {
  if (user.peran === "ORTU") {
    const a = await ambilAnakOrtu(ref, user);
    return a ? { tglLahir: a.isi.tglLahir } : null;
  }
  const a = await ambilAnak(ref, user);
  return a ? { tglLahir: a.isi.tglLahir } : null;
}

/** Catat pengukuran tumbuh (BB/TB/LK) — bisa dari sisi ortu maupun kader. */
export async function catatTumbuh(formData: FormData): Promise<void> {
  const user = await wajibUser(); // semua peran; scope dicek di cekAkses
  const ref = String(formData.get("ref") ?? "");
  const balik = String(formData.get("balik") ?? "/");
  const tgl = String(formData.get("tgl") ?? "").trim();
  const bb = parseFloat(String(formData.get("bb") ?? ""));
  const tb = parseFloat(String(formData.get("tb") ?? ""));
  const lk = parseFloat(String(formData.get("lk") ?? ""));

  const akses = await cekAkses(ref, user);
  if (!akses) redirect(balik + "?galat=" + encodeURIComponent("Anak tidak ditemukan / bukan hak Anda."));
  if (Number.isNaN(Date.parse(tgl))) redirect(balik + "?galat=" + encodeURIComponent("Tanggal ukur tidak valid."));
  if (Date.parse(tgl) < Date.parse(akses.tglLahir)) {
    redirect(balik + "?galat=" + encodeURIComponent("Tanggal ukur mendahului tanggal lahir."));
  }
  const adaNilai = [bb, tb, lk].some((v) => !Number.isNaN(v) && v > 0);
  if (!adaNilai) redirect(balik + "?galat=" + encodeURIComponent("Isi minimal satu: BB / TB / LK."));
  if (!Number.isNaN(bb) && (bb <= 0 || bb > 40)) redirect(balik + "?galat=" + encodeURIComponent("BB tidak wajar (kg)."));
  if (!Number.isNaN(tb) && (tb <= 20 || tb > 150)) redirect(balik + "?galat=" + encodeURIComponent("TB tidak wajar (cm)."));

  const m = /^([sb]):(\d+)$/.exec(ref)!;
  const usiaBulan = hitungUsiaBulan(akses.tglLahir, new Date(tgl + "T00:00:00"));
  await db.tumbuh.create({
    data: {
      anakSimpusId: m[1] === "s" ? Number(m[2]) : null,
      anakBaruId: m[1] === "b" ? Number(m[2]) : null,
      tgl,
      usiaBulan,
      bb: Number.isNaN(bb) ? null : bb,
      tb: Number.isNaN(tb) ? null : tb,
      lk: Number.isNaN(lk) ? null : lk,
      dicatatOlehId: user.id,
      peranPencatat: user.peran === "ORTU" ? "ORTU" : "KADER",
    },
  });
  await db.logAktivitas.create({ data: { userId: user.id, aksi: "TUMBUH_DICATAT", detail: ref } });
  redirect(balik);
}

/** Daftar pengukuran satu anak (urut tanggal naik). Akses TIDAK dicek di sini —
 *  panggil hanya setelah anak didapat via ambilAnak/ambilAnakOrtu. */
export async function daftarTumbuh(ref: string) {
  const m = /^([sb]):(\d+)$/.exec(ref);
  if (!m) return [];
  return db.tumbuh.findMany({
    where: m[1] === "s" ? { anakSimpusId: Number(m[2]) } : { anakBaruId: Number(m[2]) },
    orderBy: { tgl: "asc" },
  });
}
