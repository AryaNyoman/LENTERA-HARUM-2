import Link from "next/link";
import { redirect } from "next/navigation";
import { masuk } from "@/lib/akun-actions";
import { ambilUser, rumahPeran } from "@/lib/sesi";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ galat?: string }>;
}) {
  const user = await ambilUser();
  if (user) redirect(rumahPeran(user.peran));
  const { galat } = await searchParams;

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--teal)] text-2xl font-bold text-white">
            SP
          </div>
          <h1 className="text-xl font-extrabold text-[var(--teal-tua)]">SIMPUS-POSYANDU</h1>
          <p className="mt-1 text-xs text-[var(--teks-sekunder)]">
            Puskesmas Cakranegara · Mataram, NTB
          </p>
        </div>

        <form
          action={masuk}
          className="rounded-2xl border border-[var(--garis)] bg-[var(--kartu)] p-6 shadow-sm"
        >
          <h2 className="mb-4 text-sm font-bold">Masuk</h2>
          {galat && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-[var(--merah)]">
              {galat}
            </p>
          )}
          <label className="block text-xs font-semibold text-[var(--teks-sekunder)]">
            Username / No HP
            <input
              name="username"
              autoComplete="username"
              className="mt-1 w-full rounded-lg border border-[var(--garis)] px-3 py-2 text-sm"
              placeholder="kader: username · orang tua: 08…"
            />
          </label>
          <label className="mt-3 block text-xs font-semibold text-[var(--teks-sekunder)]">
            Sandi
            <input
              name="sandi"
              type="password"
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg border border-[var(--garis)] px-3 py-2 text-sm"
              placeholder="••••••••"
            />
          </label>
          <button
            type="submit"
            className="mt-5 w-full rounded-xl bg-[var(--teal)] py-2.5 text-sm font-bold text-white hover:bg-[var(--teal-tua)]"
          >
            Masuk
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-[var(--teks-sekunder)]">
          Orang tua belum punya akun?{" "}
          <Link href="/daftar" className="font-bold text-[var(--coral)]">
            Daftar di sini
          </Link>
        </p>
        <p className="mt-1 text-center text-[11px] text-[var(--teks-sekunder)]">
          Akun kader dibuatkan oleh petugas puskesmas.
        </p>
      </div>
    </main>
  );
}
