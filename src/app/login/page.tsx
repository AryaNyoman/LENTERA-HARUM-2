/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { redirect } from "next/navigation";
import { masuk } from "@/lib/akun-actions";
import { ambilUser, rumahPeran } from "@/lib/sesi";
import InputSandi from "@/components/input-sandi";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ galat?: string }>;
}) {
  const user = await ambilUser();
  if (user) redirect(rumahPeran(user.peran));
  const { galat } = await searchParams;

  const inp =
    "mt-1.5 h-[50px] w-full rounded-2xl border-2 border-[var(--krem-border)] bg-[var(--krem-input)] px-4 text-[15px] font-semibold outline-none transition-colors focus:border-[var(--teal)]";

  return (
    <main className="bg-titik-gerbang flex min-h-dvh flex-col">
      <div
        className="relative px-6 pb-8 pt-9 text-center text-white"
        style={{ background: "linear-gradient(160deg,#2e9e8f,#45b3a3)" }}
      >
        <div
          className="absolute left-6 top-5 h-[34px] w-[34px] rounded-full bg-white/15"
          style={{ animation: "floaty 5s ease-in-out infinite" }}
        />
        <div
          className="absolute right-8 top-10 h-5 w-5 rounded-full bg-white/20"
          style={{ animation: "floaty 7s ease-in-out infinite" }}
        />
        <div className="pop relative">
          <img
            src="/gambar/logo-lentera-harum.png"
            alt="Lentera Harum"
            width={220}
            height={220}
            className="mx-auto mb-2 h-auto w-full max-w-[220px] rounded-3xl shadow-[0_10px_24px_rgba(23,79,71,.28)]"
          />
          <h1 className="font-judul text-2xl font-bold leading-tight">Halo! Selamat datang 👋</h1>
          <p className="mt-1 text-[12.5px] font-semibold text-white/90">
            Lentera Harum Posyandu · Puskesmas Cakranegara
          </p>
        </div>
      </div>
      <div className="scallop" style={{ "--scallop": "#45b3a3" } as React.CSSProperties} />

      <div className="mx-auto w-full max-w-md flex-1 px-5 pt-4">
        <form
          action={masuk}
          className="pop pop-1 rounded-3xl border-2 border-[var(--krem-border)] bg-[var(--kartu)] p-6"
          style={{ boxShadow: "0 8px 0 rgba(231,221,207,.55)" }}
        >
          {galat && (
            <p className="mb-3 rounded-xl bg-[var(--merah-muda)] px-3 py-2 text-xs font-bold text-[var(--merah-teks)]">
              {galat}
            </p>
          )}
          <label className="block text-[12.5px] font-extrabold text-[var(--teks-3)]">
            Username / No HP
            <input name="username" autoComplete="username" className={inp} placeholder="kader: username · ortu: 08…" />
          </label>
          <label className="mt-3.5 block text-[12.5px] font-extrabold text-[var(--teks-3)]">
            Sandi
            <InputSandi name="sandi" autoComplete="current-password" className={inp.replace("mt-1.5 ", "")} placeholder="••••••••" />
          </label>
          <button
            type="submit"
            className="btn3d btn3d-teal mt-5 h-[54px] w-full rounded-[18px] text-[17px]"
            style={{ boxShadow: "0 6px 0 var(--teal-tua)" }}
          >
            Masuk
          </button>
        </form>

        <Link
          href="/daftar"
          className="pop pop-2 mt-4 flex items-center gap-3 rounded-[20px] border-2 border-[var(--coral-border)] bg-[var(--coral-muda)] px-4 py-3.5"
        >
          <img src="/gambar/anak-perempuan.png" alt="" width={44} height={44} className="h-11 w-11 shrink-0 object-contain" />
          <span className="text-xs font-semibold leading-relaxed text-[var(--teks-sekunder)]">
            Bunda/Ayah baru di sini? <b style={{ color: "#d95f38" }}>Daftar dulu yuk</b> — cukup No HP &amp; sandi, gratis.
          </span>
        </Link>

        <p className="pop pop-3 mt-3.5 text-center text-[11px] font-semibold text-[var(--abu)]">
          Akun kader dibuatkan oleh petugas puskesmas 💚
        </p>
      </div>

      <p className="flex items-center justify-center gap-1.5 px-4 pb-4 pt-3 text-center text-[10.5px] font-semibold text-[var(--abu)]">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        Data anak terenkripsi &amp; hanya untuk posyandu Anda
      </p>
    </main>
  );
}
