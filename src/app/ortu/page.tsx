import Kepala from "@/components/kepala";
import { wajibUser } from "@/lib/sesi";
import { db } from "@/lib/db";

export default async function OrtuHome() {
  const user = await wajibUser("ORTU", "ADMIN");
  const jumlahAnak = await db.klaimAnak.count({ where: { userId: user.id } });

  return (
    <div className="min-h-dvh">
      <Kepala user={user} warna="var(--coral)" />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-lg font-extrabold text-[var(--teal-tua)]">Beranda Orang Tua</h1>
        <p className="mt-1 text-sm text-[var(--teks-sekunder)]">
          {jumlahAnak === 0
            ? "Belum ada anak terhubung — minta kode QR ke kader posyandu Anda."
            : `${jumlahAnak} anak terhubung ke akun ini.`}
        </p>
        <div className="mt-6 rounded-2xl border border-dashed border-[var(--garis)] bg-[var(--kartu)] p-6 text-center text-sm text-[var(--teks-sekunder)]">
          Dashboard, Anakku, Jadwal &amp; Tumbuh menyusul di Tahap 5.
        </div>
      </main>
    </div>
  );
}
