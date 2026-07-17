"use server";

import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { buatSesi, hapusSesi, ambilUser, wajibUser, rumahPeran } from "@/lib/sesi";

/** Normalisasi No HP: angka saja, format lokal 08xxxxxxxxxx. */
function normHp(no: string): string {
  let n = (no || "").replace(/\D/g, "");
  if (n.startsWith("62")) n = "0" + n.slice(2);
  return n;
}

async function catat(userId: number | null, aksi: string, detail = "") {
  await db.logAktivitas.create({ data: { userId, aksi, detail } });
}

// ═══ LOGIN / LOGOUT ═══

export async function masuk(formData: FormData): Promise<void> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const sandi = String(formData.get("sandi") ?? "");
  if (!username || !sandi) redirect("/login?galat=Isi+username+dan+sandi");

  // ortu login pakai No HP — coba bentuk ternormalisasi juga
  const user =
    (await db.user.findUnique({ where: { username } })) ??
    (await db.user.findUnique({ where: { username: normHp(username) } }));

  if (!user || !(await bcrypt.compare(sandi, user.sandiHash))) {
    redirect("/login?galat=Username+atau+sandi+salah");
  }
  if (!user.aktif) redirect("/login?galat=Akun+dinonaktifkan.+Hubungi+admin");

  await buatSesi(user.id);
  await catat(user.id, "LOGIN");
  redirect(user.perluGantiSandi ? "/ganti-sandi" : rumahPeran(user.peran));
}

export async function keluar(): Promise<void> {
  const u = await ambilUser();
  await hapusSesi();
  if (u) await catat(u.id, "LOGOUT");
  redirect("/login");
}

// ═══ DAFTAR ORANG TUA (mandiri) ═══

export async function daftarOrtu(formData: FormData): Promise<void> {
  const nama = String(formData.get("nama") ?? "").trim();
  const noHp = normHp(String(formData.get("noHp") ?? ""));
  const sandi = String(formData.get("sandi") ?? "");
  const ulang = String(formData.get("ulang") ?? "");
  const kelurahanId = Number(formData.get("kelurahanId") ?? 0) || 0;

  if (nama.length < 3) redirect("/daftar?galat=Nama+minimal+3+huruf");
  if (!/^08\d{8,11}$/.test(noHp)) redirect("/daftar?galat=No+HP+tidak+valid+(mulai+08,+10-13+digit)");
  if (!kelurahanId || !(await db.kelurahan.findUnique({ where: { id: kelurahanId } }))) {
    redirect("/daftar?galat=Pilih+kelurahan+tempat+tinggal");
  }
  if (sandi.length < 6) redirect("/daftar?galat=Sandi+minimal+6+karakter");
  if (sandi !== ulang) redirect("/daftar?galat=Ulangi+sandi+tidak+sama");
  if (await db.user.findUnique({ where: { username: noHp } })) {
    redirect("/daftar?galat=No+HP+sudah+terdaftar+—+silakan+login");
  }

  const user = await db.user.create({
    data: { peran: "ORTU", nama, username: noHp, noHp, kelurahanId, sandiHash: await bcrypt.hash(sandi, 10) },
  });
  await buatSesi(user.id);
  await catat(user.id, "DAFTAR_ORTU");
  redirect("/ortu");
}

// ═══ GANTI SANDI (wajib utk sandi sementara, atau sukarela) ═══

export async function gantiSandi(formData: FormData): Promise<void> {
  const user = await ambilUser();
  if (!user) redirect("/login");
  const lama = String(formData.get("lama") ?? "");
  const baru = String(formData.get("baru") ?? "");
  const ulang = String(formData.get("ulang") ?? "");

  const row = await db.user.findUnique({ where: { id: user.id } });
  if (!row || !(await bcrypt.compare(lama, row.sandiHash))) {
    redirect("/ganti-sandi?galat=Sandi+sekarang+salah");
  }
  if (baru.length < 6) redirect("/ganti-sandi?galat=Sandi+baru+minimal+6+karakter");
  if (baru !== ulang) redirect("/ganti-sandi?galat=Ulangi+sandi+tidak+sama");

  await db.user.update({
    where: { id: user.id },
    data: { sandiHash: await bcrypt.hash(baru, 10), perluGantiSandi: false },
  });
  await catat(user.id, "GANTI_SANDI");
  redirect(rumahPeran(user.peran));
}

// ═══ KELOLA AKUN (khusus ADMIN) ═══

export interface HasilBuatKader {
  ok?: string;
  sandi?: string;
  galat?: string;
}

export async function buatKader(
  _prev: HasilBuatKader,
  formData: FormData,
): Promise<HasilBuatKader> {
  await wajibUser("ADMIN");
  const nama = String(formData.get("nama") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const posyanduIds = formData.getAll("posyandu").map((v) => Number(v)).filter((n) => n > 0);
  const noHp = normHp(String(formData.get("noHp") ?? ""));

  if (nama.length < 3) return { galat: "Nama minimal 3 huruf." };
  if (!/^[a-z0-9._-]{3,}$/.test(username)) {
    return { galat: "Username minimal 3 karakter (huruf kecil/angka/titik)." };
  }
  if (posyanduIds.length === 0) return { galat: "Pilih minimal 1 posyandu binaan." };
  if (noHp && !/^08\d{8,11}$/.test(noHp)) {
    return { galat: "No HP tidak valid (mulai 08, 10-13 digit)." };
  }
  if (await db.user.findUnique({ where: { username } })) {
    return { galat: "Username sudah dipakai." };
  }

  const sandi = randomBytes(6).toString("base64url");
  const user = await db.user.create({
    data: {
      peran: "KADER",
      nama,
      username,
      noHp,
      sandiHash: await bcrypt.hash(sandi, 10),
      perluGantiSandi: true,
      binaan: { create: posyanduIds.map((posyanduId) => ({ posyanduId })) },
    },
  });
  await catat(user.id, "AKUN_KADER_DIBUAT", `oleh admin; binaan ${posyanduIds.join(",")}`);
  return { ok: `Akun kader "${username}" dibuat.`, sandi };
}

export async function buatOrtu(
  _prev: HasilBuatKader,
  formData: FormData,
): Promise<HasilBuatKader> {
  await wajibUser("ADMIN");
  const nama = String(formData.get("nama") ?? "").trim();
  const noHp = normHp(String(formData.get("noHp") ?? ""));
  const kelurahanId = Number(formData.get("kelurahanId") ?? 0) || 0;

  if (nama.length < 3) return { galat: "Nama minimal 3 huruf." };
  if (!/^08\d{8,11}$/.test(noHp)) return { galat: "No HP tidak valid (mulai 08, 10-13 digit)." };
  if (!kelurahanId || !(await db.kelurahan.findUnique({ where: { id: kelurahanId } }))) {
    return { galat: "Pilih kelurahan tempat tinggal." };
  }
  if (await db.user.findUnique({ where: { username: noHp } })) {
    return { galat: "No HP sudah terdaftar." };
  }

  const sandi = randomBytes(6).toString("base64url");
  const user = await db.user.create({
    data: {
      peran: "ORTU",
      nama,
      username: noHp,
      noHp,
      kelurahanId,
      sandiHash: await bcrypt.hash(sandi, 10),
      perluGantiSandi: true,
    },
  });
  await catat(user.id, "AKUN_ORTU_DIBUAT_ADMIN", `oleh admin; kelurahan ${kelurahanId}`);
  return { ok: `Akun ortu "${noHp}" dibuat.`, sandi };
}

export async function setAktif(formData: FormData): Promise<void> {
  const admin = await wajibUser("ADMIN");
  const id = Number(formData.get("id")) || 0;
  const aktif = String(formData.get("aktif")) === "1";
  if (!Number.isInteger(id) || id <= 0) redirect("/admin?galat=Akun+tidak+ditemukan");
  if (id === admin.id) redirect("/admin?galat=Tidak+bisa+menonaktifkan+akun+sendiri");
  await db.user.update({ where: { id }, data: { aktif } });
  if (!aktif) await db.sesi.deleteMany({ where: { userId: id } });
  await catat(admin.id, aktif ? "AKUN_DIAKTIFKAN" : "AKUN_DINONAKTIFKAN", `user ${id}`);
  redirect("/admin");
}

/** Isi/ubah No HP akun (ADMIN atau KADER) — dipakai Admin utk mencantumkan kontak
 *  dirinya sendiri & kader di Pojok Baca. ORTU tidak lewat sini (No HP ortu = username,
 *  diisi saat daftar). Kosong = hapus dari daftar kontak (bukan galat). Nomornya sendiri
 *  TIDAK dicatat ke log aktivitas (data pribadi) — hanya username target. */
export async function setNoHp(formData: FormData): Promise<void> {
  const admin = await wajibUser("ADMIN");
  const id = Number(formData.get("id")) || 0;
  if (!Number.isInteger(id) || id <= 0) redirect("/admin?galat=Akun+tidak+ditemukan");
  const target = await db.user.findUnique({ where: { id } });
  if (!target) redirect("/admin?galat=Akun+tidak+ditemukan");
  if (target.peran !== "ADMIN" && target.peran !== "KADER") {
    redirect("/admin?galat=Akun+ini+tidak+bisa+diubah+dari+sini");
  }
  const noHp = normHp(String(formData.get("noHp") ?? ""));
  if (noHp && !/^08\d{8,11}$/.test(noHp)) {
    redirect("/admin?galat=No+HP+tidak+valid+(mulai+08,+10-13+digit)");
  }
  await db.user.update({ where: { id }, data: { noHp } });
  await catat(admin.id, "NO_HP_DIUBAH", target.username);
  redirect("/admin");
}

/** Hapus akun kader/ortu (bukan admin). Relasi Sesi/UserPosyandu/KlaimAnak ikut terhapus
 *  (onDelete: Cascade di schema). Khusus ortu: bersihkan dulu anak sampah murni miliknya
 *  (draf isian sendiri, belum diverifikasi/diekspor/tercocok) — yang sudah diverifikasi
 *  atau sudah tercocok ke SIMPUS TIDAK disentuh. */
export async function hapusAkun(formData: FormData): Promise<void> {
  const admin = await wajibUser("ADMIN");
  const id = Number(formData.get("id")) || 0;
  if (!Number.isInteger(id) || id <= 0) redirect("/admin?galat=Akun+tidak+ditemukan");
  if (id === admin.id) redirect("/admin?galat=Tidak+bisa+menghapus+akun+sendiri");
  const target = await db.user.findUnique({ where: { id } });
  if (!target) redirect("/admin");
  if (target.peran === "ADMIN") redirect("/admin?galat=Akun+admin+tidak+bisa+dihapus+dari+sini");

  if (target.peran === "ORTU") {
    await db.anakBaru.deleteMany({
      where: { dibuatOlehId: id, olehOrtu: true, status: "DRAF", terverifikasi: false, anakSimpusId: null },
    });
  }
  await db.user.delete({ where: { id } });
  await catat(admin.id, "AKUN_DIHAPUS", `${target.username} (${target.peran})`);
  redirect("/admin");
}

export async function resetSandi(
  _prev: HasilBuatKader,
  formData: FormData,
): Promise<HasilBuatKader> {
  const admin = await wajibUser("ADMIN");
  const id = Number(formData.get("id")) || 0;
  if (!Number.isInteger(id) || id <= 0) return { galat: "Akun tidak ditemukan." };
  const target = await db.user.findUnique({ where: { id } });
  if (!target) return { galat: "Akun tidak ditemukan." };
  const sandi = randomBytes(6).toString("base64url");
  await db.user.update({
    where: { id },
    data: { sandiHash: await bcrypt.hash(sandi, 10), perluGantiSandi: true },
  });
  await db.sesi.deleteMany({ where: { userId: id } });
  await catat(admin.id, "RESET_SANDI", `user ${id} (${target.username})`);
  return { ok: `Sandi "${target.username}" di-reset.`, sandi };
}
