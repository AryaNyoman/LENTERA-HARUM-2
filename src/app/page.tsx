import { redirect } from "next/navigation";
import { ambilUser, rumahPeran } from "@/lib/sesi";

/** Akar situs: arahkan sesuai sesi — login bila belum, rumah peran bila sudah. */
export default async function Home() {
  const user = await ambilUser();
  if (!user) redirect("/login");
  if (user.perluGantiSandi) redirect("/ganti-sandi");
  redirect(rumahPeran(user.peran));
}
