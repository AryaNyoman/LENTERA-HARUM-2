import Kepala from "@/components/kepala";
import { wajibUser } from "@/lib/sesi";
import { db } from "@/lib/db";

export default async function KaderHome() {
  const user = await wajibUser("KADER", "ADMIN");
  const binaan = await db.userPosyandu.findMany({
    where: { userId: user.id },
    include: { posyandu: { include: { kelurahan: true } } },
  });

  return (
    <div className="min-h-dvh">
      <Kepala user={user} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-lg font-extrabold text-[var(--teal-tua)]">Beranda Kader</h1>
        <p className="mt-1 text-sm text-[var(--teks-sekunder)]">
          Posyandu binaan Anda:{" "}
          {binaan.length === 0
            ? "belum diatur (hubungi admin)"
            : binaan
                .map((b) => `${b.posyandu.nama} (${b.posyandu.namaPosyandu}) — ${b.posyandu.kelurahan.nama}`)
                .join(" · ")}
        </p>
        <div className="mt-6 rounded-2xl border border-dashed border-[var(--garis)] bg-[var(--kartu)] p-6 text-center text-sm text-[var(--teks-sekunder)]">
          Dashboard, Daftar Bayi, Kalkulator &amp; Panduan menyusul di Tahap 4.
        </div>
      </main>
    </div>
  );
}
