import { redirect } from "next/navigation";
import { gantiSandi } from "@/lib/akun-actions";
import { ambilUser } from "@/lib/sesi";

export default async function GantiSandiPage({
  searchParams,
}: {
  searchParams: Promise<{ galat?: string }>;
}) {
  const user = await ambilUser();
  if (!user) redirect("/login");
  const { galat } = await searchParams;

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <form
          action={gantiSandi}
          className="rounded-2xl border border-[var(--garis)] bg-[var(--kartu)] p-6 shadow-sm"
        >
          <h1 className="text-base font-extrabold text-[var(--teal-tua)]">Ganti Sandi</h1>
          <p className="mt-1 mb-4 text-xs text-[var(--teks-sekunder)]">
            {user.perluGantiSandi
              ? "Sandi Anda masih sandi sementara — buat sandi baru dulu."
              : `Akun: ${user.username}`}
          </p>
          {galat && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-[var(--merah)]">
              {galat}
            </p>
          )}
          <label className="block text-xs font-semibold text-[var(--teks-sekunder)]">
            Sandi sekarang
            <input
              name="lama"
              type="password"
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg border border-[var(--garis)] px-3 py-2 text-sm"
            />
          </label>
          <label className="mt-3 block text-xs font-semibold text-[var(--teks-sekunder)]">
            Sandi baru (min. 6 karakter)
            <input
              name="baru"
              type="password"
              autoComplete="new-password"
              className="mt-1 w-full rounded-lg border border-[var(--garis)] px-3 py-2 text-sm"
            />
          </label>
          <label className="mt-3 block text-xs font-semibold text-[var(--teks-sekunder)]">
            Ulangi sandi baru
            <input
              name="ulang"
              type="password"
              autoComplete="new-password"
              className="mt-1 w-full rounded-lg border border-[var(--garis)] px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            className="mt-5 w-full rounded-xl bg-[var(--teal)] py-2.5 text-sm font-bold text-white hover:bg-[var(--teal-tua)]"
          >
            Simpan sandi baru
          </button>
        </form>
      </div>
    </main>
  );
}
