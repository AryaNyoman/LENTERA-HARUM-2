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
    <main className="min-h-dvh bg-titik-kader">
      <div
        className="relative overflow-hidden px-6 pb-8 pt-10 text-center text-white"
        style={{ background: "linear-gradient(160deg,#26907f,#3aa895)", "--scallop": "#3aa895" } as React.CSSProperties}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon-192.png"
          alt=""
          width={64}
          height={64}
          className="pop mx-auto mb-3 rounded-2xl bg-white/95 p-2 shadow-lg"
          style={{ animation: "floaty 4s ease-in-out infinite" }}
        />
        <h1 className="font-judul pop pop-1 text-xl font-extrabold">SIMPUS-POSYANDU</h1>
        <p className="pop pop-2 mt-1 text-xs text-white/90">Puskesmas Cakranegara · Mataram, NTB</p>
      </div>
      <div className="scallop" style={{ "--scallop": "#3aa895" } as React.CSSProperties} />

      <div className="mx-auto -mt-2 w-full max-w-sm px-6 pb-8">
        <form
          action={masuk}
          className="pop pop-3 rounded-[var(--r-kartu)] border-2 border-[var(--krem-border)] bg-[var(--kartu)] p-6"
          style={{ boxShadow: "0 8px 0 var(--teal-pastel)" }}
        >
          <h2 className="font-judul mb-4 text-sm font-bold text-[var(--teal-tua)]">Masuk</h2>
          {galat && (
            <p className="mb-3 rounded-lg bg-[var(--merah-muda)] px-3 py-2 text-xs font-semibold text-[var(--merah-teks)]">
              {galat}
            </p>
          )}
          <label className="block text-xs font-semibold text-[var(--teks-sekunder)]">
            Username / No HP
            <input
              name="username"
              autoComplete="username"
              className="mt-1 w-full rounded-[var(--r-input)] border-2 border-[var(--garis)] bg-[var(--krem-input)] px-3 py-2.5 text-base focus:border-[var(--teal)] focus:outline-none"
              placeholder="kader: username · orang tua: 08…"
            />
          </label>
          <label className="mt-3 block text-xs font-semibold text-[var(--teks-sekunder)]">
            Sandi
            <input
              name="sandi"
              type="password"
              autoComplete="current-password"
              className="mt-1 w-full rounded-[var(--r-input)] border-2 border-[var(--garis)] bg-[var(--krem-input)] px-3 py-2.5 text-base focus:border-[var(--teal)] focus:outline-none"
              placeholder="••••••••"
            />
          </label>
          <button type="submit" className="btn3d btn3d-teal mt-5 w-full py-3 text-sm">
            Masuk
          </button>
        </form>

        <Link
          href="/daftar"
          className="pop pop-4 mt-4 flex items-center gap-3 rounded-2xl border-2 border-[var(--coral-border)] bg-[var(--coral-muda)] p-4 text-left"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/gambar/anak-perempuan.png" alt="" width={44} height={44} className="shrink-0" />
          <span className="min-w-0">
            <span className="font-judul block text-sm font-bold text-[var(--coral-gelap)]">
              Orang tua belum punya akun?
            </span>
            <span className="block text-xs text-[var(--teks-sekunder)]">Daftar di sini →</span>
          </span>
        </Link>

        <p className="pop pop-5 mt-4 text-center text-[11px] leading-relaxed text-[var(--teks-sekunder)]">
          🔒 Akun kader dibuatkan oleh petugas puskesmas. Data anak Anda tersimpan aman & terenkripsi.
        </p>
      </div>
    </main>
  );
}
