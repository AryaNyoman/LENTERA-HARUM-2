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
    <main className="min-h-dvh bg-titik-ortu">
      <div
        className="relative overflow-hidden px-6 pb-8 pt-10 text-center text-white"
        style={{ background: "linear-gradient(160deg,#e8704a,#f0906e)", "--scallop": "#f0906e" } as React.CSSProperties}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/gambar/bayi-duduk.png"
          alt=""
          width={72}
          height={72}
          className="pop mx-auto mb-2"
          style={{ animation: "floaty 4s ease-in-out infinite" }}
        />
        <h1 className="font-judul pop pop-1 text-xl font-extrabold">Daftar — Orang Tua</h1>
        <p className="pop pop-2 mt-1 text-xs text-white/90">Pantau imunisasi &amp; tumbuh kembang Si Kecil</p>
      </div>
      <div className="scallop" style={{ "--scallop": "#f0906e" } as React.CSSProperties} />

      <div className="mx-auto -mt-2 w-full max-w-sm px-6 pb-8">
        <form
          action={daftarOrtu}
          className="pop pop-3 rounded-[var(--r-kartu)] border-2 border-[var(--krem-border)] bg-[var(--kartu)] p-6"
          style={{ boxShadow: "0 8px 0 var(--coral-pastel)" }}
        >
          {galat && (
            <p className="mb-3 rounded-lg bg-[var(--merah-muda)] px-3 py-2 text-xs font-semibold text-[var(--merah-teks)]">
              {galat}
            </p>
          )}
          <label className="block text-xs font-semibold text-[var(--teks-sekunder)]">
            Nama lengkap (Bunda/Ayah)
            <input
              name="nama"
              className="mt-1 w-full rounded-[var(--r-input)] border-2 border-[var(--garis)] bg-[var(--krem-input)] px-3 py-2.5 text-base focus:border-[var(--coral)] focus:outline-none"
              placeholder="mis. Ni Made Sari"
            />
          </label>
          <label className="mt-3 block text-xs font-semibold text-[var(--teks-sekunder)]">
            No HP (dipakai untuk login)
            <input
              name="noHp"
              inputMode="numeric"
              className="mt-1 w-full rounded-[var(--r-input)] border-2 border-[var(--garis)] bg-[var(--krem-input)] px-3 py-2.5 text-base focus:border-[var(--coral)] focus:outline-none"
              placeholder="08…"
            />
          </label>
          <label className="mt-3 block text-xs font-semibold text-[var(--teks-sekunder)]">
            Sandi (min. 6 karakter)
            <input
              name="sandi"
              type="password"
              autoComplete="new-password"
              className="mt-1 w-full rounded-[var(--r-input)] border-2 border-[var(--garis)] bg-[var(--krem-input)] px-3 py-2.5 text-base focus:border-[var(--coral)] focus:outline-none"
            />
          </label>
          <label className="mt-3 block text-xs font-semibold text-[var(--teks-sekunder)]">
            Ulangi sandi
            <input
              name="ulang"
              type="password"
              autoComplete="new-password"
              className="mt-1 w-full rounded-[var(--r-input)] border-2 border-[var(--garis)] bg-[var(--krem-input)] px-3 py-2.5 text-base focus:border-[var(--coral)] focus:outline-none"
            />
          </label>
          <button type="submit" className="btn3d btn3d-coral mt-5 w-full py-3 text-sm">
            Daftar
          </button>
        </form>

        <p className="pop pop-4 mt-4 text-center text-xs text-[var(--teks-sekunder)]">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-bold text-[var(--teal-tua)]">
            Masuk
          </Link>
        </p>
        <p className="pop pop-5 mt-3 rounded-2xl border-2 border-[var(--teal-pastel)] bg-[var(--teal-muda)] p-3 text-center text-[11px] leading-relaxed text-[var(--teal-tua)]">
          📱 Setelah daftar, minta <b>kode QR</b> ke kader posyandu untuk menghubungkan data anak
          Anda — atau tambahkan sendiri dari menu Anakku.
        </p>
      </div>
    </main>
  );
}
