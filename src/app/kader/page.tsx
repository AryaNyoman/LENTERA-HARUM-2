import Link from "next/link";
import { wajibUser } from "@/lib/sesi";
import { db } from "@/lib/db";
import { ambilAnakBinaan, hitungUsiaBulan, kelompokUsia } from "@/lib/anak";
import { lengkap, SYARAT_IDL, SYARAT_IBL } from "@/lib/vaksin";

function Kartu({ nilai, label, sub, warna }: { nilai: string | number; label: string; sub?: string; warna?: string }) {
  return (
    <div className="pop rounded-[var(--r-kartu)] border-2 border-[var(--garis-kader)] bg-[var(--kartu)] p-4">
      <p className="font-judul text-[26px] font-extrabold leading-none" style={{ color: warna ?? "var(--teal-tua)" }}>{nilai}</p>
      <p className="mt-1.5 text-xs font-bold">{label}</p>
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
    <main className="min-h-[calc(100dvh-56px)] bg-titik-kader pb-6">
      <div
        className="relative px-4 pb-7 pt-5 text-white"
        style={{ background: "linear-gradient(160deg,#26907f,#3aa895)", "--scallop": "#3aa895" } as React.CSSProperties}
      >
        <div className="mx-auto max-w-3xl">
          <h1 className="font-judul text-lg font-extrabold">Dashboard Posyandu</h1>
          <p className="mt-0.5 text-xs text-white/90">
            Statistik posyandu binaan · data lokal website{cache ? " + tarikan SIMPUS" : ""}
          </p>
        </div>
      </div>
      <div className="scallop" style={{ "--scallop": "#3aa895" } as React.CSSProperties} />

      <div className="mx-auto -mt-1 max-w-3xl px-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Kartu nilai={anak.length} label="Total anak" sub="dalam binaan" />
          <Kartu nilai={bayi} label="Bayi (0–11 bln)" />
          <Kartu nilai={baduta} label="Baduta (12–24 bln)" />
          <Kartu nilai={idl} label="IDL lengkap" sub="definisi 2026 (tanpa PCV/RV)" warna="var(--hijau-teks)" />
          <Kartu nilai={ibl} label="IBL lengkap" sub="DPT + MR lanjutan" warna="var(--hijau-teks)" />
          <Kartu nilai={draf} label="Belum diekspor" sub="anak baru → SIMPUS" warna={draf > 0 ? "var(--coral-gelap)" : undefined} />
        </div>

        {perPosyandu.size > 1 && (
          <section className="mt-6">
            <h2 className="font-judul text-sm font-extrabold">Per posyandu</h2>
            <div className="mt-2 space-y-1.5">
              {[...perPosyandu.entries()].map(([nama, n]) => (
                <div key={nama} className="flex items-center justify-between rounded-xl border-2 border-[var(--garis-kader)] bg-[var(--kartu)] px-4 py-2.5 text-sm">
                  <span className="font-semibold">{nama}</span>
                  <span className="font-judul font-extrabold text-[var(--teal-tua)]">{n} anak</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="pop pop-1 mt-6 flex items-start gap-3 rounded-[var(--r-kartu)] border-2 border-[var(--coral-border)] bg-[var(--coral-muda)] p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/gambar/petugas-kesehatan.png" alt="" width={40} height={40} className="shrink-0" />
          <p className="text-xs leading-relaxed text-[var(--coral-gelap)]">
            {cache ? (
              <>Data statistik SIMPUS terakhir ditarik: <b>{cache.sinkronPada.toLocaleString("id-ID")}</b>.</>
            ) : (
              <>
                <b>Data SIMPUS belum ditarik</b> — angka dihitung dari catatan website ini dulu.
                Tarikan dilakukan petugas puskesmas.
              </>
            )}
          </p>
        </section>

        <div className="pop pop-2 mt-6 flex gap-2">
          <Link href="/kader/daftar-bayi" className="btn3d btn3d-teal flex-1 py-3 text-center text-sm">
            Buka Daftar Bayi
          </Link>
          <Link
            href="/kader/anak-baru"
            className="btn-garis flex-1 border-2 py-3 text-center text-sm text-[var(--coral-gelap)]"
            style={{ borderColor: "var(--coral)" }}
          >
            + Daftarkan Anak
          </Link>
        </div>
      </div>
    </main>
  );
}
