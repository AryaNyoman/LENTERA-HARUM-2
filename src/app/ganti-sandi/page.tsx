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
    <main className="flex min-h-dvh items-center justify-center bg-titik-kader p-6">
      <div className="w-full max-w-sm">
        <div
          className="pop mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-3xl"
          style={{ background: "var(--kuning-muda)" }}
        >
          🔑
        </div>
        <form
          action={gantiSandi}
          className="pop pop-1 rounded-[var(--r-kartu)] border-2 border-[var(--krem-border)] bg-[var(--kartu)] p-6"
          style={{ boxShadow: "0 8px 0 var(--teal-pastel)" }}
        >
          <h1 className="font-judul text-base font-extrabold text-[var(--teal-tua)]">Ganti Sandi</h1>
          <p className="mt-1 mb-4 text-xs leading-relaxed text-[var(--teks-sekunder)]">
            {user.perluGantiSandi
              ? "Sandi Anda masih sandi sementara dari petugas. Ganti dulu ya, biar akun aman."
              : `Akun: ${user.username}`}
          </p>
          {galat && (
            <p className="mb-3 rounded-lg bg-[var(--merah-muda)] px-3 py-2 text-xs font-semibold text-[var(--merah-teks)]">
              {galat}
            </p>
          )}
          <label className="block text-xs font-semibold text-[var(--teks-sekunder)]">
            Sandi sekarang
            <input
              name="lama"
              type="password"
              autoComplete="current-password"
              className="mt-1 w-full rounded-[var(--r-input)] border-2 border-[var(--garis)] bg-[var(--krem-input)] px-3 py-2.5 text-base focus:border-[var(--teal)] focus:outline-none"
            />
          </label>
          <label className="mt-3 block text-xs font-semibold text-[var(--teks-sekunder)]">
            Sandi baru (min. 6 karakter)
            <input
              name="baru"
              type="password"
              autoComplete="new-password"
              className="mt-1 w-full rounded-[var(--r-input)] border-2 border-[var(--garis)] bg-[var(--krem-input)] px-3 py-2.5 text-base focus:border-[var(--teal)] focus:outline-none"
            />
          </label>
          <label className="mt-3 block text-xs font-semibold text-[var(--teks-sekunder)]">
            Ulangi sandi baru
            <input
              name="ulang"
              type="password"
              autoComplete="new-password"
              className="mt-1 w-full rounded-[var(--r-input)] border-2 border-[var(--garis)] bg-[var(--krem-input)] px-3 py-2.5 text-base focus:border-[var(--teal)] focus:outline-none"
            />
          </label>
          <button type="submit" className="btn3d btn3d-teal mt-5 w-full py-3 text-sm">
            Simpan sandi baru
          </button>
        </form>
      </div>
    </main>
  );
}
