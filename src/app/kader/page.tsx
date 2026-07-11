import Link from "next/link";
import { wajibUser } from "@/lib/sesi";
import { db } from "@/lib/db";
import { ambilAnakBinaan, hitungUsiaBulan, kelompokUsia } from "@/lib/anak";
import { lengkap, SYARAT_IDL, SYARAT_IBL } from "@/lib/vaksin";

function Kartu({ nilai, label, sub, warna }: { nilai: string | number; label: string; sub?: string; warna?: string }) {
  return (
    <div className="rounded-2xl border border-[var(--garis)] bg-[var(--kartu)] p-4">
      <p className="text-2xl font-extrabold" style={{ color: warna ?? "var(--teal-tua)" }}>{nilai}</p>
      <p className="mt-0.5 text-xs font-bold">{label}</p>
      {sub && <p className="text-[11px] text-[var(--teks-sekunder)]">{sub}</p>}
    </div>
  );
}

export default async function DashboardKader() {
  const user = await wajibUser("KADER", "ADMIN");
  const anak = await ambilAnakBinaan(user);
  const cache = await db.cacheDashboard.findFirst({ orderBy: { sinkronPada: "desc" } });

  const now = new Date();
  let bayi = 0, baduta = 0, lebih = 0, idl = 0, ibl = 0, draf = 0;
  const perPosyandu = new Map<string, number>();
  for (const a of anak) {
    const u = kelompokUsia(hitungUsiaBulan(a.isi.tglLahir, now));
    if (u === "0-11") bayi++; else if (u === "12-24") baduta++; else lebih++;
    if (lengkap(a.isi.vaksin, SYARAT_IDL)) idl++;
    if (lengkap(a.isi.vaksin, SYARAT_IBL)) ibl++;
    if (a.sumber === "BARU" && a.status === "DRAF") draf++;
    perPosyandu.set(a.posyanduLabel, (perPosyandu.get(a.posyanduLabel) ?? 0) + 1);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-5">
      <h1 className="text-lg font-extrabold text-[var(--teal-tua)]">Dashboard Posyandu</h1>
      <p className="mt-0.5 text-xs text-[var(--teks-sekunder)]">
        Statistik posyandu binaan · data lokal website{cache ? " + tarikan SIMPUS" : ""}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Kartu nilai={anak.length} label="Total anak" sub="dalam binaan" />
        <Kartu nilai={bayi} label="Bayi (0–11 bln)" />
        <Kartu nilai={baduta} label="Baduta (12–24 bln)" />
        <Kartu nilai={idl} label="IDL lengkap" sub="definisi 2026 (tanpa PCV/RV)" warna="var(--hijau)" />
        <Kartu nilai={ibl} label="IBL lengkap" sub="DPT + MR lanjutan" warna="var(--hijau)" />
        <Kartu nilai={draf} label="Belum diekspor" sub="anak baru → SIMPUS" warna={draf > 0 ? "var(--coral)" : undefined} />
      </div>

      {perPosyandu.size > 1 && (
        <section className="mt-6">
          <h2 className="text-sm font-extrabold">Per posyandu</h2>
          <div className="mt-2 space-y-1.5">
            {[...perPosyandu.entries()].map(([nama, n]) => (
              <div key={nama} className="flex items-center justify-between rounded-xl border border-[var(--garis)] bg-[var(--kartu)] px-4 py-2.5 text-sm">
                <span className="font-semibold">{nama}</span>
                <span className="font-extrabold text-[var(--teal-tua)]">{n} anak</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6 rounded-2xl border border-[var(--garis)] bg-[var(--teal-muda)] p-4 text-xs leading-relaxed text-[var(--teal-tua)]">
        {cache ? (
          <>Data statistik SIMPUS terakhir ditarik: {cache.sinkronPada.toLocaleString("id-ID")}.</>
        ) : (
          <>
            <b>Belum tersambung SIMPUS.</b> Setelah Tahap 7 (sinkron), dashboard ini juga
            menampilkan cakupan resmi (IDL/IBL per kelurahan) hasil tarikan mingguan dari SIMPUS
            petugas. Sekarang angka dihitung dari data di website ini saja.
          </>
        )}
      </section>

      <div className="mt-6 flex gap-2">
        <Link href="/kader/daftar-bayi" className="flex-1 rounded-xl bg-[var(--teal)] py-2.5 text-center text-sm font-bold text-white">
          Buka Daftar Bayi
        </Link>
        <Link href="/kader/anak-baru" className="flex-1 rounded-xl border-2 border-[var(--coral)] py-2.5 text-center text-sm font-bold text-[var(--coral)]">
          + Daftarkan Anak
        </Link>
      </div>
    </main>
  );
}
