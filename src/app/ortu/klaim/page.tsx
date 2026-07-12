/* eslint-disable @next/next/no-img-element */
import KepalaHalaman from "@/components/kepala-halaman";
import { wajibUser } from "@/lib/sesi";
import { pakaiKode } from "@/lib/klaim-actions";

export default async function KlaimPage({
  searchParams,
}: {
  searchParams: Promise<{ kode?: string; galat?: string }>;
}) {
  await wajibUser("ORTU", "ADMIN");
  const { kode, galat } = await searchParams;

  return (
    <main>
      <KepalaHalaman judul="Hubungkan Anak 🔗" sub="dari menu Anakku" balik="/ortu/anakku" peran="ortu" />

      <div className="mx-auto max-w-md px-4 pt-4">
        <div className="pop flex gap-1.5">
          {[
            { n: 1, t: "Minta kode QR ke kader" },
            { n: 2, t: "Pindai / ketik kodenya" },
            { n: 3, t: "Data Si Kecil muncul 🎉" },
          ].map((s) => (
            <div key={s.n} className="flex-1 rounded-2xl border-2 border-[var(--garis-ortu)] bg-[var(--kartu)] px-2 py-2.5 text-center">
              <p className="font-judul text-base font-bold" style={{ color: "#d95f38" }}>{s.n}</p>
              <p className="text-[10px] font-semibold leading-snug text-[var(--teks-sekunder)]">{s.t}</p>
            </div>
          ))}
        </div>

        <form action={pakaiKode} className="pop pop-1 mt-3.5 rounded-[26px] border-2 border-[var(--coral-pastel)] bg-[var(--kartu)] px-5 py-6 text-center">
          <img
            src="/gambar/bayi-duduk.png" alt="" width={64} height={64}
            className="mx-auto h-16 w-16 object-contain"
            style={{ animation: "floaty 5.5s ease-in-out infinite" }}
          />
          <p className="font-judul mt-2.5 text-[15px] font-bold text-[var(--coral-gelap)]">Masukkan kode dari kader</p>
          {galat && (
            <p className="mt-2.5 rounded-2xl border-2 border-[var(--merah-border)] bg-[var(--merah-muda)] px-3 py-2.5 text-left text-[11px] font-bold leading-snug text-[var(--merah-teks)]">
              😔 {galat}
            </p>
          )}
          <input
            name="kode"
            defaultValue={kode ?? ""}
            autoCapitalize="characters"
            className="font-judul mt-2.5 h-[58px] w-full rounded-[18px] border-[2.5px] border-dashed border-[var(--coral)] bg-[#fdf9f5] text-center text-2xl font-bold uppercase text-[var(--coral-gelap)] outline-none transition-colors focus:border-[var(--coral-tua)] focus:bg-white"
            style={{ letterSpacing: ".25em", textIndent: ".25em" }}
            placeholder="XXXXXXXX"
            maxLength={8}
          />
          <p className="mt-2 text-[10.5px] font-semibold text-[var(--abu)]">8 karakter · huruf besar &amp; angka</p>
          <button className="btn3d btn3d-coral mt-3.5 h-[54px] w-full rounded-[18px] text-base" style={{ boxShadow: "0 6px 0 var(--coral-tua)" }}>
            Hubungkan
          </button>
        </form>

        <div className="pop pop-2 mt-3 flex items-start gap-2.5 rounded-[18px] bg-[var(--teal-muda)] px-3.5 py-2.5">
          <span className="shrink-0 text-[15px]">📱</span>
          <p className="text-[10.5px] font-semibold leading-relaxed text-[var(--teal-tua)]">
            Pindai QR dengan kamera HP juga bisa — halaman ini terbuka otomatis dengan kode sudah terisi.
          </p>
        </div>
      </div>
    </main>
  );
}
