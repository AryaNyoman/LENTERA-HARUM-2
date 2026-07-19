"use server";

import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { wajibUser } from "@/lib/sesi";
import { ambilAnak, binaanIds } from "@/lib/anak";

/** Kode klaim mudah dibaca (tanpa 0/O/1/I/L): 8 karakter. */
function kodeBaru(): string {
  const HURUF = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const b = randomBytes(8);
  let s = "";
  for (let i = 0; i < 8; i++) s += HURUF[b[i] % HURUF.length];
  return s;
}

async function catat(userId: number, aksi: string, detail = "") {
  await db.logAktivitas.create({ data: { userId, aksi, detail } });
}

/** Pure (tapi async — file "use server" mewajibkan SEMUA export jadi async function):
 *  kelurahan ortu & anak (posyandu target) cocok? Ortu tanpa kelurahan (null, akun lama)
 *  dianggap cocok — jangan blokir alur lama. */
export async function kelurahanCocok(kelurahanOrtuId: number | null, kelurahanAnakId: number): Promise<boolean> {
  return kelurahanOrtuId === null || kelurahanOrtuId === kelurahanAnakId;
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

/** ORTU: pakai kode klaim → anak terhubung ke akun. Mendeteksi mismatch kelurahan (ortu
 *  vs posyandu anak target) sebelum klaim jalan — beda kelurahan butuh konfirmasi eksplisit
 *  (flag "konfirmasi=1"), gerbangnya DI SINI (server), bukan cuma di UI, supaya tamper POST
 *  langsung tanpa lewat layar peringatan tetap ditolak. */
export async function pakaiKode(formData: FormData): Promise<void> {
  const user = await wajibUser("ORTU", "ADMIN");
  const kode = String(formData.get("kode") ?? "").trim().toUpperCase();
  const konfirmasi = String(formData.get("konfirmasi") ?? "") === "1";
  const balik = "/ortu/klaim";
  if (!/^[A-Z2-9]{8}$/.test(kode)) {
    redirect(balik + "?galat=" + encodeURIComponent("Format kode tidak valid (8 karakter)."));
  }

  const t = await db.klaimToken.findUnique({ where: { token: kode } });
  if (!t) redirect(balik + "?galat=" + encodeURIComponent("Kode tidak ditemukan. Periksa lagi atau minta kode baru ke kader."));
  if (t.dipakaiPada) redirect(balik + "?galat=" + encodeURIComponent("Kode sudah pernah dipakai. Minta kode baru ke kader."));
  if (t.kedaluwarsa < new Date()) redirect(balik + "?galat=" + encodeURIComponent("Kode kedaluwarsa. Minta kode baru ke kader."));

  const targetPosyandu = t.anakSimpusId
    ? (await db.anakSimpus.findUnique({ where: { id: t.anakSimpusId }, include: { posyandu: { include: { kelurahan: true } } } }))?.posyandu
    : (await db.anakBaru.findUnique({ where: { id: t.anakBaruId! }, include: { posyandu: { include: { kelurahan: true } } } }))?.posyandu;
  if (!targetPosyandu) redirect(balik + "?galat=" + encodeURIComponent("Anak pada kode ini tidak ditemukan."));

  const ortuRow = await db.user.findUnique({ where: { id: user.id }, include: { kelurahan: true } });
  const cocok = await kelurahanCocok(ortuRow?.kelurahanId ?? null, targetPosyandu.kelurahanId);

  if (!cocok && !konfirmasi) {
    const ref = t.anakSimpusId ? `s:${t.anakSimpusId}` : `b:${t.anakBaruId}`;
    await catat(user.id, "KLAIM_BEDA_KELURAHAN", ref);
    const posyanduLabel = targetPosyandu.namaPosyandu ? `${targetPosyandu.nama} (${targetPosyandu.namaPosyandu})` : targetPosyandu.nama;
    const q = new URLSearchParams({
      kode,
      mismatch: "1",
      posyandu: posyanduLabel,
      kelX: ortuRow?.kelurahan?.nama ?? "",
      kelY: targetPosyandu.kelurahan.nama,
    });
    redirect(`${balik}?${q.toString()}`);
  }

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

/** KADER: putuskan tautan ortu↔anak (hapus KlaimAnak SAJA — anak SIMPUS/BARU TIDAK
 *  dihapus, data tetap utuh; hanya hilang dari menu Anakku ortu tsb). Dipakai saat ortu
 *  keliru scan QR anak orang lain. Menegakkan binaan kader — klaim atas anak di luar
 *  posyandu binaan ditolak dengan galat rapi (juga menutup jalur tamper id lintas-binaan). */
export async function putusKlaimKader(formData: FormData): Promise<void> {
  const kader = await wajibUser("KADER", "ADMIN");
  const id = Number(formData.get("id")) || 0;
  const ref = String(formData.get("ref") ?? "");
  const balik = `/kader/anak/${encodeURIComponent(ref)}`;
  if (!Number.isInteger(id) || id <= 0) redirect(balik + "?galat=" + encodeURIComponent("Tautan tidak ditemukan."));

  const klaim = await db.klaimAnak.findUnique({
    where: { id },
    include: {
      anakSimpus: { select: { posyanduId: true } },
      anakBaru: { select: { posyanduId: true } },
    },
  });
  if (!klaim) redirect(balik + "?galat=" + encodeURIComponent("Tautan tidak ditemukan."));

  const posyanduId = klaim.anakSimpus?.posyanduId ?? klaim.anakBaru?.posyanduId ?? 0;
  const ids = await binaanIds(kader);
  if (!posyanduId || !ids.includes(posyanduId)) {
    redirect(balik + "?galat=" + encodeURIComponent("Anak ini di luar posyandu binaan Anda."));
  }

  await db.klaimAnak.delete({ where: { id } });
  await catat(kader.id, "KLAIM_DIPUTUS_KADER", `klaim:${id}`);
  redirect(balik + "?ok=" + encodeURIComponent("Tautan dengan orang tua diputus."));
}
