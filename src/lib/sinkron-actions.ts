"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { wajibUser } from "@/lib/sesi";
import { jalankanSinkron } from "@/lib/sinkron";
import { cekBatasSinkron, AKSI_SINKRON_DIHITUNG, JENDELA_120_JAM_MS } from "@/lib/batas-sinkron";

/** Tombol admin "Tarik data SIMPUS sekarang". Hasil/galat dibawa lewat query string. */
export async function tarikSimpus(): Promise<void> {
  const user = await wajibUser("ADMIN");

  // Gerbang batas sinkron manual (PLAN 2026-07-19 Y3) — WAJIB dicek SEBELUM jalankanSinkron()
  // dipanggil sama sekali, supaya kalau ditolak, tak ada percobaan konek ke Neon SIMPUS.
  const sekarang = new Date();
  const logSebelumnya = await db.logAktivitas.findMany({
    where: {
      userId: user.id,
      aksi: { in: [...AKSI_SINKRON_DIHITUNG] },
      pada: { gte: new Date(sekarang.getTime() - JENDELA_120_JAM_MS) },
    },
    select: { pada: true },
  });
  const gerbang = cekBatasSinkron(logSebelumnya.map((l) => l.pada), sekarang);
  if (!gerbang.boleh) {
    redirect("/admin?galat=" + encodeURIComponent(gerbang.alasan));
  }

  let pesan: string;
  try {
    const h = await jalankanSinkron();
    pesan = `Sinkron selesai: ${h.kelurahan} kelurahan · ${h.posyandu} posyandu · ${h.anak} anak · ${h.jadwal} jadwal` +
      (h.dicocokkan ? ` · ${h.dicocokkan} anak baru dicocokkan` : "") +
      (h.gagalDekripsi ? ` · ${h.gagalDekripsi} gagal dekripsi` : "");
    await db.logAktivitas.create({ data: { userId: user.id, aksi: "SINKRON_SIMPUS", detail: pesan } });
    redirect("/admin?ok=" + encodeURIComponent(pesan));
  } catch (e) {
    // redirect() bekerja dengan melempar — jangan ditelan
    if (e && typeof e === "object" && "digest" in e) throw e;
    pesan = e instanceof Error ? e.message : "Sinkron gagal.";
    await db.logAktivitas.create({ data: { userId: user.id, aksi: "SINKRON_GAGAL", detail: pesan } });
    redirect("/admin?galat=" + encodeURIComponent(pesan));
  }
}
