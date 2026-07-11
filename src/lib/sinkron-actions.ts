"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { wajibUser } from "@/lib/sesi";
import { jalankanSinkron } from "@/lib/sinkron";

/** Tombol admin "Tarik data SIMPUS sekarang". Hasil/galat dibawa lewat query string. */
export async function tarikSimpus(): Promise<void> {
  const user = await wajibUser("ADMIN");
  let pesan: string;
  try {
    const h = await jalankanSinkron();
    pesan = `Sinkron selesai: ${h.kelurahan} kelurahan · ${h.posyandu} posyandu · ${h.anak} anak` +
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
