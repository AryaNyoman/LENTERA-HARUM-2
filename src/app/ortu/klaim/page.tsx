import Link from "next/link";
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
    <main className="mx-auto max-w-3xl px-4 py-5">
      <Link href="/ortu/anakku" className="text-xs font-bold text-[var(--teks-sekunder)]">← Anakku</Link>
      <h1 className="font-judul mt-2 text-lg font-extrabold text-[var(--coral-gelap)]">Hubungkan Anak</h1>

      <div className="mt-4 space-y-2">
        {[
          { n: 1, t: "Minta kode QR ke kader posyandu saat kunjungan" },
          { n: 2, t: "Pindai QR dengan kamera HP (halaman ini terbuka otomatis)" },
          { n: 3, t: "Atau ketik kodenya sendiri di bawah" },
        ].map((s) => (
          <div key={s.n} className="flex items-center gap-3 rounded-xl border-2 border-[var(--coral-border)] bg-[var(--coral-muda)] px-3 py-2">
            <span className="font-judul flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--coral)] text-xs font-bold text-white">
              {s.n}
            </span>
            <span className="text-xs text-[var(--coral-gelap)]">{s.t}</span>
          </div>
        ))}
      </div>

      <form action={pakaiKode} className="pop mt-4 rounded-[var(--r-kartu)] border-2 border-[var(--krem-border)] bg-[var(--kartu)] p-5">
        {galat && (
          <p className="mb-3 rounded-lg bg-[var(--merah-muda)] px-3 py-2 text-xs font-semibold text-[var(--merah-teks)]">
            {galat}
          </p>
        )}
        <label className="block text-xs font-semibold text-[var(--teks-sekunder)]">
          Kode dari kader (8 karakter)
          <input
            name="kode"
            defaultValue={kode ?? ""}
            autoCapitalize="characters"
            className="mt-1 w-full rounded-[var(--r-input)] border-2 border-dashed border-[var(--coral)] bg-[var(--krem-input)] px-3 py-3 text-center font-mono text-lg font-extrabold tracking-[0.3em] uppercase focus:outline-none"
            placeholder="XXXXXXXX"
            maxLength={8}
          />
        </label>
        <button className="btn3d btn3d-coral mt-4 w-full py-3 text-sm">Hubungkan</button>
      </form>

      <p className="mt-3 text-center text-[11px] text-[var(--teks-sekunder)]">
        📱 Kode dari pindai QR terisi otomatis di kotak di atas.
      </p>
    </main>
  );
}
