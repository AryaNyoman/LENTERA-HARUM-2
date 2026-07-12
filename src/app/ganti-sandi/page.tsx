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

  const inp =
    "mt-1.5 h-12 w-full rounded-2xl border-2 border-[#e2ece7] bg-[#fbfdfc] px-4 text-[15px] font-semibold outline-none transition-colors focus:border-[var(--teal)]";
  const lbl = "block text-[12.5px] font-extrabold text-[var(--teks-3)]";

  return (
    <main className="bg-titik-kader flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="pop mb-4 text-center">
          <div
            className="mx-auto mb-2.5 flex h-16 w-16 items-center justify-center rounded-full border-2 text-[28px]"
            style={{ background: "var(--kuning-muda)", borderColor: "var(--kuning-border)" }}
          >
            🔑
          </div>
          <h1 className="font-judul text-[22px] font-bold text-[var(--teal-gelap)]">Buat Sandi Baru</h1>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-[var(--teks-sekunder)]">
            {user.perluGantiSandi ? (
              <>
                Sandi Anda masih sandi sementara dari petugas.
                <br />
                Ganti dulu ya, biar akun aman.
              </>
            ) : (
              <>Akun: {user.username}</>
            )}
          </p>
        </div>

        <form
          action={gantiSandi}
          className="pop pop-1 rounded-3xl border-2 border-[#e2ece7] bg-[var(--kartu)] p-5"
          style={{ boxShadow: "0 8px 0 rgba(226,236,231,.7)" }}
        >
          {galat && (
            <p className="mb-3 rounded-xl bg-[var(--merah-muda)] px-3 py-2 text-xs font-bold text-[var(--merah-teks)]">
              {galat}
            </p>
          )}
          <label className={lbl}>
            Sandi sekarang
            <input name="lama" type="password" autoComplete="current-password" className={inp} />
          </label>
          <label className={`${lbl} mt-3`}>
            Sandi baru <span className="font-semibold text-[var(--abu)]">(min. 6 karakter)</span>
            <input name="baru" type="password" autoComplete="new-password" className={inp} />
          </label>
          <label className={`${lbl} mt-3`}>
            Ulangi sandi baru
            <input name="ulang" type="password" autoComplete="new-password" className={inp} />
          </label>
          <button
            type="submit"
            className="btn3d btn3d-teal h-[54px] w-full rounded-[18px] text-[17px]"
            style={{ boxShadow: "0 6px 0 var(--teal-tua)", marginTop: "18px" }}
          >
            Simpan sandi baru
          </button>
        </form>

        <p className="pop pop-2 mt-3.5 text-center text-[11px] font-semibold text-[var(--abu)]">
          Tips: gabungkan kata + angka yang mudah Anda ingat 😉
        </p>
      </div>
    </main>
  );
}
