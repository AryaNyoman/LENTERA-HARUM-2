import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";

const NAMA_COOKIE = "sp_sesi";
const UMUR_HARI = 30;

export interface UserSesi {
  id: number;
  peran: string; // ADMIN | KADER | ORTU
  nama: string;
  username: string;
  perluGantiSandi: boolean;
}

/** Buat sesi baru untuk user + pasang cookie httpOnly. */
export async function buatSesi(userId: number): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const kedaluwarsa = new Date(Date.now() + UMUR_HARI * 86400000);
  await db.sesi.create({ data: { id: token, userId, kedaluwarsa } });
  const jar = await cookies();
  jar.set(NAMA_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: kedaluwarsa,
    path: "/",
  });
}

/** User dari cookie sesi; null bila tak ada/kedaluwarsa/nonaktif.
 *  Dibungkus cache() — dipanggil layout & page dalam satu request tanpa query dobel. */
export const ambilUser = cache(async (): Promise<UserSesi | null> => {
  const jar = await cookies();
  const token = jar.get(NAMA_COOKIE)?.value;
  if (!token) return null;
  const sesi = await db.sesi.findUnique({ where: { id: token }, include: { user: true } });
  if (!sesi || sesi.kedaluwarsa < new Date() || !sesi.user.aktif) return null;
  const u = sesi.user;
  return { id: u.id, peran: u.peran, nama: u.nama, username: u.username, perluGantiSandi: u.perluGantiSandi };
});

/** Hapus sesi aktif (logout). */
export async function hapusSesi(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(NAMA_COOKIE)?.value;
  if (token) await db.sesi.deleteMany({ where: { id: token } });
  jar.delete(NAMA_COOKIE);
}

/** Guard halaman: wajib login (dan bila diisi, wajib salah satu peran). */
export async function wajibUser(...peran: string[]): Promise<UserSesi> {
  const user = await ambilUser();
  if (!user) redirect("/login");
  if (user.perluGantiSandi) redirect("/ganti-sandi");
  if (peran.length > 0 && !peran.includes(user.peran)) redirect("/");
  return user;
}

/** Rumah default tiap peran. */
export function rumahPeran(peran: string): string {
  if (peran === "ADMIN") return "/admin";
  if (peran === "KADER") return "/kader";
  return "/ortu";
}
