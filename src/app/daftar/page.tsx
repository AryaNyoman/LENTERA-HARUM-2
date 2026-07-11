import Link from "next/link";
import { redirect } from "next/navigation";
import { daftarOrtu } from "@/lib/akun-actions";
import { ambilUser, rumahPeran } from "@/lib/sesi";

export default async function DaftarPage({
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
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--coral)] text-2xl font-bold text-white">
            SP
          </div>
          <h1 className="text-xl font-extrabold text-[var(--teal-tua)]">Daftar — Orang Tua</h1>
          <p className="mt-1 text-xs text-[var(--teks-sekunder)]">
            Pantau imunisasi &amp; tumbuh kembang Si Kecil
          </p>
        </div>

        <form
          action={daftarOrtu}
          className="rounded-2xl border border-[var(--garis)] bg-[var(--kartu)] p-6 shadow-sm"
        >
          {galat && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-[var(--merah)]">
              {galat}
            </p>
          )}
          <label className="block text-xs font-semibold text-[var(--teks-sekunder)]">
            Nama lengkap (Bunda/Ayah)
            <input
              name="nama"
              className="mt-1 w-full rounded-lg border border-[var(--garis)] px-3 py-2 text-sm"
              placeholder="mis. Ni Made Sari"
            />
          </label>
          <label className="mt-3 block text-xs font-semibold text-[var(--teks-sekunder)]">
            No HP (dipakai untuk login)
            <input
              name="noHp"
              inputMode="numeric"
              className="mt-1 w-full rounded-lg border border-[var(--garis)] px-3 py-2 text-sm"
              placeholder="08…"
            />
          </label>
          <label className="mt-3 block text-xs font-semibold text-[var(--teks-sekunder)]">
            Sandi (min. 6 karakter)
            <input
              name="sandi"
              type="password"
              autoComplete="new-password"
              className="mt-1 w-full rounded-lg border border-[var(--garis)] px-3 py-2 text-sm"
            />
          </label>
          <label className="mt-3 block text-xs font-semibold text-[var(--teks-sekunder)]">
            Ulangi sandi
            <input
              name="ulang"
              type="password"
              autoComplete="new-password"
              className="mt-1 w-full rounded-lg border border-[var(--garis)] px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            className="mt-5 w-full rounded-xl bg-[var(--coral)] py-2.5 text-sm font-bold text-white hover:opacity-90"
          >
            Daftar
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-[var(--teks-sekunder)]">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-bold text-[var(--teal-tua)]">
            Masuk
          </Link>
        </p>
        <p className="mt-2 text-center text-[11px] leading-relaxed text-[var(--teks-sekunder)]">
          Setelah daftar, minta <b>kode QR</b> ke kader posyandu untuk menghubungkan data anak
          Anda.
        </p>
      </div>
    </main>
  );
}
