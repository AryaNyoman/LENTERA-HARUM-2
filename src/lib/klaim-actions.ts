"use server";

import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { wajibUser } from "@/lib/sesi";
import { ambilAnak } from "@/lib/anak";

/** Kode klaim mudah dibaca (tanpa 0/O/1/I/L): 8 karakter. */
function kodeBaru(): string {
  const HURUF = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const b = randomBytes(8);
  let s = "";
  for (let i = 0; i < 8; i++) s += HURUF[b[i] % HURUF.length];
  return s;
}

/** KADER: buat token klaim untuk satu anak → tampil sebagai QR + kode. Berlaku 7 hari. */
export async function buatTokenKlaim(formData: FormData): Promise<void> {
  const user = await wajibUser("KADER", "ADMIN");
  const ref = String(formData.get("ref") ?? "");
  const anak = await ambilAnak(ref, user);
  if (!anak) redirect("/kader/daftar-bayi");

  const m = /^([sb]):(\d+)$/.exec(ref)!;
  await db.klaimToken.create({
    data: {
      token: kodeBaru(),
      anakSimpusId: m[1] === "s" ? Number(m[2]) : null,
      anakBaruId: m[1] === "b" ? Number(m[2]) : null,
      dibuatOlehId: user.id,
      kedaluwarsa: new Date(Date.now() + 7 * 86400000),
    },
  });
  await db.logAktivitas.create({ data: { userId: user.id, aksi: "TOKEN_KLAIM_DIBUAT", detail: ref } });
  redirect(`/kader/anak/${ref}/qr`);
}

/** ORTU: pakai kode klaim → anak terhubung ke akun. */
export async function pakaiKode(formData: FormData): Promise<void> {
  const user = await wajibUser("ORTU", "ADMIN");
  const kode = String(formData.get("kode") ?? "").trim().toUpperCase();
  const balik = "/ortu/klaim";
  if (!/^[A-Z2-9]{8}$/.test(kode)) {
    redirect(balik + "?galat=" + encodeURIComponent("Format kode tidak valid (8 karakter)."));
  }

  const t = await db.klaimToken.findUnique({ where: { token: kode } });
  if (!t) redirect(balik + "?galat=" + encodeURIComponent("Kode tidak ditemukan. Periksa lagi atau minta kode baru ke kader."));
  if (t.dipakaiPada) redirect(balik + "?galat=" + encodeURIComponent("Kode sudah pernah dipakai. Minta kode baru ke kader."));
  if (t.kedaluwarsa < new Date()) redirect(balik + "?galat=" + encodeURIComponent("Kode kedaluwarsa. Minta kode baru ke kader."));

  const sudah = await db.klaimAnak.findFirst({
    where: {
      userId: user.id,
      ...(t.anakSimpusId ? { anakSimpusId: t.anakSimpusId } : { anakBaruId: t.anakBaruId }),
    },
  });
  if (sudah) redirect("/ortu/anakku?galat=" + encodeURIComponent("Anak ini sudah terhubung ke akun Anda."));

  await db.$transaction([
    db.klaimAnak.create({
      data: { userId: user.id, anakSimpusId: t.anakSimpusId, anakBaruId: t.anakBaruId },
    }),
    db.klaimToken.update({ where: { id: t.id }, data: { dipakaiPada: new Date() } }),
    db.logAktivitas.create({ data: { userId: user.id, aksi: "ANAK_DIKLAIM", detail: kode } }),
  ]);
  redirect("/ortu/anakku");
}
