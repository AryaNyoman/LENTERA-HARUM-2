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
      <h1 className="mt-2 text-lg font-extrabold text-[var(--teal-tua)]">Hubungkan Anak</h1>
      <p className="mt-1 text-xs leading-relaxed text-[var(--teks-sekunder)]">
        Minta <b>kode QR</b> ke kader posyandu saat kunjungan. Pindai QR dengan kamera HP
        (otomatis membuka halaman ini), atau ketik kodenya di bawah.
      </p>

      <form action={pakaiKode} className="mt-4 rounded-2xl border border-[var(--garis)] bg-[var(--kartu)] p-5">
        {galat && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-[var(--merah)]">{galat}</p>
        )}
        <label className="block text-xs font-semibold text-[var(--teks-sekunder)]">
          Kode dari kader (8 karakter)
          <input
            name="kode"
            defaultValue={kode ?? ""}
            autoCapitalize="characters"
            className="mt-1 w-full rounded-lg border border-[var(--garis)] px-3 py-2.5 text-center font-mono text-lg font-extrabold tracking-[0.3em] uppercase"
            placeholder="XXXXXXXX"
            maxLength={8}
          />
        </label>
        <button className="mt-4 w-full rounded-xl bg-[var(--coral)] py-2.5 text-sm font-bold text-white">
          Hubungkan
        </button>
      </form>
    </main>
  );
}
