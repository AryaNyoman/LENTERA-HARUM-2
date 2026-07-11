import Link from "next/link";
import { wajibUser } from "@/lib/sesi";
import { db } from "@/lib/db";
import { anakKlaim } from "@/lib/ortu";
import { buka, type IsiAnak } from "@/lib/brankas";
import { hitungUsiaBulan, kelompokUsia } from "@/lib/anak";
import { lengkap, SYARAT_IDL } from "@/lib/vaksin";

/** Dashboard ORTU = statistik POSYANDU keseluruhan (posyandu tempat anak-anaknya),
 *  bukan cuma anak sendiri — sesuai keputusan pemilik. Angka = agregat tanpa nama. */
export default async function DashboardOrtu() {
  const user = await wajibUser("ORTU", "ADMIN");
  const anakku = await anakKlaim(user);
  const posyanduIds = [...new Set(anakku.map((a) => a.posyanduId))];
  const cache = await db.cacheDashboard.findFirst({ orderBy: { sinkronPada: "desc" } });

  const statistik: { label: string; total: number; bayi: number; baduta: number; idl: number }[] = [];
  for (const pid of posyanduIds) {
    const pos = await db.posyandu.findUnique({ where: { id: pid } });
    const [simpus, baru] = await Promise.all([
      db.anakSimpus.findMany({ where: { posyanduId: pid } }),
      db.anakBaru.findMany({ where: { posyanduId: pid, status: { not: "MASUK_SIMPUS" } } }),
    ]);
    let total = 0, bayi = 0, baduta = 0, idl = 0;
    const now = new Date();
    for (const row of [...simpus, ...baru]) {
      try {
        const isi = buka<IsiAnak>({ iv: row.iv, tag: row.tag, data: row.data });
        total++;
        const u = kelompokUsia(hitungUsiaBulan(isi.tglLahir, now));
        if (u === "0-11") bayi++; else if (u === "12-24") baduta++;
        if (lengkap(isi.vaksin, SYARAT_IDL)) idl++;
      } catch { /* lewati data rusak */ }
    }
    statistik.push({
      label: pos ? (pos.namaPosyandu ? `${pos.nama} (${pos.namaPosyandu})` : pos.nama) : `Posyandu ${pid}`,
      total, bayi, baduta, idl,
    });
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-5">
      <h1 className="text-lg font-extrabold text-[var(--teal-tua)]">Dashboard Posyandu</h1>
      <p className="mt-0.5 text-xs text-[var(--teks-sekunder)]">
        Kondisi imunisasi di posyandu Si Kecil{cache ? " · + data SIMPUS" : ""}
      </p>

      {anakku.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-[var(--garis)] bg-[var(--kartu)] p-6 text-center">
          <p className="text-sm font-bold">Belum ada anak terhubung</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--teks-sekunder)]">
            Minta <b>kode QR</b> ke kader posyandu Anda, lalu hubungkan lewat menu Anakku.
            Setelah terhubung, dashboard posyandu tampil di sini.
          </p>
          <Link href="/ortu/anakku" className="mt-3 inline-block rounded-xl bg-[var(--coral)] px-4 py-2 text-xs font-bold text-white">
            Buka Anakku
          </Link>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {statistik.map((s) => (
            <section key={s.label} className="rounded-2xl border border-[var(--garis)] bg-[var(--kartu)] p-4">
              <h2 className="text-sm font-extrabold text-[var(--teal-tua)]">{s.label}</h2>
              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                <div><p className="text-xl font-extrabold text-[var(--teal-tua)]">{s.total}</p><p className="text-[10px] font-bold text-[var(--teks-sekunder)]">Anak</p></div>
                <div><p className="text-xl font-extrabold text-[var(--teal-tua)]">{s.bayi}</p><p className="text-[10px] font-bold text-[var(--teks-sekunder)]">Bayi 0–11</p></div>
                <div><p className="text-xl font-extrabold text-[var(--teal-tua)]">{s.baduta}</p><p className="text-[10px] font-bold text-[var(--teks-sekunder)]">Baduta</p></div>
                <div><p className="text-xl font-extrabold" style={{ color: "var(--hijau)" }}>{s.idl}</p><p className="text-[10px] font-bold text-[var(--teks-sekunder)]">IDL ✓</p></div>
              </div>
            </section>
          ))}
          <p className="rounded-xl bg-[var(--teal-muda)] px-3 py-2 text-[11px] leading-relaxed text-[var(--teal-tua)]">
            {cache
              ? `Data SIMPUS terakhir ditarik ${cache.sinkronPada.toLocaleString("id-ID")}.`
              : "Cakupan resmi puskesmas (tarikan SIMPUS) akan tampil setelah sinkron aktif."}
          </p>
        </div>
      )}
    </main>
  );
}
