/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { redirect } from "next/navigation";
import { daftarOrtu } from "@/lib/akun-actions";
import { ambilUser, rumahPeran } from "@/lib/sesi";
import { db } from "@/lib/db";
import InputSandi from "@/components/input-sandi";

export default async function DaftarPage({
  searchParams,
}: {
  searchParams: Promise<{ galat?: string }>;
}) {
  const user = await ambilUser();
  if (user) redirect(rumahPeran(user.peran));
  const { galat } = await searchParams;
  const kelurahan = await db.kelurahan.findMany({ orderBy: { urutan: "asc" } });

  const inp =
    "mt-1.5 h-12 w-full rounded-2xl border-2 border-[var(--krem-border)] bg-[var(--krem-input)] px-4 text-[15px] font-semibold outline-none transition-colors focus:border-[var(--coral)]";
  const lbl = "block text-[12.5px] font-extrabold text-[var(--teks-3)]";

  return (
    <main className="bg-titik-ortu min-h-dvh">
      <div
        className="relative px-6 pb-6 pt-7 text-center text-white"
        style={{ background: "linear-gradient(160deg,#e8704a,#f0906e)" }}
      >
        <div
          className="absolute right-7 top-4 h-[30px] w-[30px] rounded-full"
          style={{ background: "rgba(255,244,214,.4)", animation: "floaty 6s ease-in-out infinite" }}
        />
        <div className="pop relative">
          <img
            src="/gambar/bayi-duduk.png"
            alt=""
            width={64}
            height={64}
            className="mx-auto mb-2 h-16 w-16 object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,.15)]"
            style={{ animation: "floaty 5.5s ease-in-out infinite" }}
          />
          <h1 className="font-judul text-[23px] font-bold leading-tight">Yuk gabung, Bunda &amp; Ayah!</h1>
          <p className="mt-1 text-xs font-semibold text-white/90">
            Pantau imunisasi &amp; tumbuh kembang Si Kecil dari HP
          </p>
        </div>
      </div>
      <div className="scallop" style={{ "--scallop": "#f0906e" } as React.CSSProperties} />

      <div className="mx-auto w-full max-w-md px-5 pb-8 pt-3">
        <form
          action={daftarOrtu}
          className="pop pop-1 rounded-3xl border-2 border-[var(--krem-border)] bg-[var(--kartu)] p-5"
          style={{ boxShadow: "0 8px 0 rgba(231,221,207,.55)" }}
        >
          {galat && (
            <p className="mb-3 rounded-xl bg-[var(--merah-muda)] px-3 py-2 text-xs font-bold text-[var(--merah-teks)]">
              {galat}
            </p>
          )}
          <label className={lbl}>
            Nama lengkap (Bunda/Ayah)
            <input name="nama" className={inp} placeholder="mis. Ni Made Sari" />
          </label>
          <label className={`${lbl} mt-3`}>
            No HP <span className="font-semibold text-[var(--abu)]">(dipakai untuk login)</span>
            <input name="noHp" inputMode="numeric" maxLength={13} className={inp} placeholder="08…" />
          </label>
          <label className={`${lbl} mt-3`}>
            Kelurahan tempat tinggal
            <select name="kelurahanId" defaultValue="" className={inp}>
              <option value="">— pilih kelurahan —</option>
              {kelurahan.map((k) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
          </label>
          <label className={`${lbl} mt-3`}>
            Sandi <span className="font-semibold text-[var(--abu)]">(min. 6 karakter)</span>
            <InputSandi name="sandi" autoComplete="new-password" className={inp.replace("mt-1.5 ", "")} />
          </label>
          <label className={`${lbl} mt-3`}>
            Ulangi sandi
            <InputSandi name="ulang" autoComplete="new-password" className={inp.replace("mt-1.5 ", "")} />
          </label>
          <button
            type="submit"
            className="btn3d btn3d-coral mt-4.5 h-[54px] w-full rounded-[18px] text-[17px]"
            style={{ boxShadow: "0 6px 0 var(--coral-tua)", marginTop: "18px" }}
          >
            Daftar
          </button>
        </form>

        <p className="pop pop-2 mt-3.5 text-center text-xs font-semibold text-[var(--teks-sekunder)]">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-bold text-[var(--teal-tua)]">
            Masuk di sini
          </Link>
        </p>
        <div className="pop pop-3 mt-3 flex items-center gap-2.5 rounded-[18px] bg-[var(--teal-muda)] px-3.5 py-3">
          <span className="shrink-0 text-lg">🔗</span>
          <p className="text-[11px] font-semibold leading-relaxed text-[var(--teal-tua)]">
            Setelah daftar, minta <b>kode QR</b> ke kader posyandu untuk menghubungkan data anak Anda.
          </p>
        </div>
      </div>
    </main>
  );
}
