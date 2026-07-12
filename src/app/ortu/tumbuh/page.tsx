import Link from "next/link";
import { wajibUser } from "@/lib/sesi";
import { anakKlaim } from "@/lib/ortu";
import TumbuhBagian from "@/components/tumbuh-bagian";

/** Tab Tumbuh ORTU: bagian tumbuh kembang untuk tiap anak klaiman. */
export default async function TumbuhOrtu({
  searchParams,
}: {
  searchParams: Promise<{ galat?: string }>;
}) {
  const user = await wajibUser("ORTU", "ADMIN");
  const { galat } = await searchParams;
  const daftar = await anakKlaim(user);

  return (
    <main className="mx-auto max-w-3xl px-4 py-5">
      <h1 className="font-judul text-lg font-extrabold text-[var(--coral-gelap)]">Tumbuh Kembang 📈</h1>
      <p className="mt-0.5 text-xs text-[var(--teks-sekunder)]">
        Catat BB/TB/lingkar kepala tiap bulan — status dihitung standar Kemenkes 2020.
      </p>
      {galat && (
        <p className="mt-3 rounded-lg bg-[var(--merah-muda)] px-3 py-2 text-xs font-semibold text-[var(--merah-teks)]">{galat}</p>
      )}

      {daftar.length === 0 && (
        <p className="mt-5 rounded-[var(--r-kartu)] border-2 border-dashed border-[var(--garis-ortu)] bg-[var(--kartu)] p-6 text-center text-sm text-[var(--teks-sekunder)]">
          Hubungkan anak dulu di menu <Link href="/ortu/anakku" className="font-bold text-[var(--coral)]">Anakku</Link>.
        </p>
      )}

      {daftar.map((a) => (
        <div key={a.ref}>
          <h2 className="font-judul mt-5 text-sm font-extrabold text-[var(--coral-gelap)]">{a.isi.nama}</h2>
          <TumbuhBagian refAnak={a.ref} jk={a.isi.jk} balik="/ortu/tumbuh" />
        </div>
      ))}
    </main>
  );
}
