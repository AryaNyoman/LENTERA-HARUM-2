"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { wajibUser } from "@/lib/sesi";
import { urlSah, KUNCI_POJOK_BACA } from "@/lib/pengaturan";

async function catat(userId: number, aksi: string, detail = "") {
  await db.logAktivitas.create({ data: { userId, aksi, detail } });
}

/** ADMIN mengubah link Pojok Baca (BPJS & Drive) — baris KV di CacheDashboard, lihat
 *  src/lib/pengaturan.ts (KUNCI_POJOK_BACA; BUKAN cache dashboard biasa). Validasi:
 *  tiap link kosong ATAU diawali https:// (urlSah) — bukan URL/tautan PII, aman dicatat. */
export async function simpanPengaturanPojok(formData: FormData): Promise<void> {
  const admin = await wajibUser("ADMIN");
  const linkBpjs = String(formData.get("linkBpjs") ?? "").trim();
  const linkDrive = String(formData.get("linkDrive") ?? "").trim();

  if (!urlSah(linkBpjs) || !urlSah(linkDrive)) {
    redirect("/admin?galat=" + encodeURIComponent("Link harus kosong atau diawali https://"));
  }

  const data = JSON.stringify({ linkBpjs, linkDrive });
  await db.cacheDashboard.upsert({
    where: { kunci: KUNCI_POJOK_BACA },
    create: { kunci: KUNCI_POJOK_BACA, data, sinkronPada: new Date() },
    update: { data, sinkronPada: new Date() },
  });
  await catat(admin.id, "PENGATURAN_POJOK_DIUBAH");
  redirect("/admin?ok=" + encodeURIComponent("Link Pojok Baca tersimpan."));
}
