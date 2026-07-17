/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import Kepala from "@/components/kepala";
import { wajibUser } from "@/lib/sesi";
import { db } from "@/lib/db";
import { ambilAnakBinaan, binaanIds, hitungUsiaBulan, kelompokUsia } from "@/lib/anak";
import { lengkap, SYARAT_IDL, SYARAT_IBL } from "@/lib/vaksin";

function KartuStat({
  nilai, label, img, border, warna, stiker, delay,
}: {
  nilai: React.ReactNode; label: string; img: string; border: string; warna: string; stiker?: string; delay: string;
}) {
  return (
    <div
      className={`pop ${delay} relative rounded-[20px] border-2 bg-[var(--kartu)] p-3.5`}
      style={{ borderColor: border }}
    >
      {stiker && (
        <span
          className="font-judul absolute -top-2.5 right-2.5 rounded-full px-2 py-0.5 text-[9.5px] font-bold text-white"
          style={{ background: "var(--hijau)", transform: "rotate(2.5deg)" }}
        >
          {stiker}
        </span>
      )}
      <div className="flex items-center justify-between gap-1">
        <p className="font-judul text-[26px] font-bold leading-none" style={{ color: warna }}>{nilai}</p>
        <img src={img} alt="" width={34} height={34} className="h-[34px] w-[34px] shrink-0 object-contain" />
      </div>
      <p className="mt-1 text-xs font-extrabold text-[var(--teks-3)]">{label}</p>
    </div>
  );
}

export default async function DashboardKader() {
  const user = await wajibUser("KADER", "ADMIN");
  const anak = await ambilAnakBinaan(user);
  const cache = await db.cacheDashboard.findFirst({ orderBy: { sinkronPada: "desc" } });
  const ids = await binaanIds(user);
  const posyandu = await db.posyandu.findMany({
    where: { id: { in: ids }, aktif: true },
    include: { kelurahan: true },
    orderBy: { id: "asc" },
  });

  const now = new Date();
  let bayi = 0, baduta = 0, balita = 0, idl = 0, ibl = 0, siapSetor = 0, tungguVerif = 0;
  const perPosyandu = new Map<string, number>();
  for (const a of anak) {
    // tglLahir kosong/invalid → hitungUsiaBulan pulang 0 → ikut kelompok bayi (tetap kehitung di total).
    const u = kelompokUsia(hitungUsiaBulan(a.isi.tglLahir, now));
    if (u === "0-11") bayi++; else if (u === "12-24") baduta++; else balita++;
    if (lengkap(a.isi.vaksin, SYARAT_IDL)) idl++;
    if (lengkap(a.isi.vaksin, SYARAT_IBL)) ibl++;
    if (a.sumber === "BARU" && a.status === "DRAF") {
      // isian ortu yang belum diverifikasi TIDAK ikut export → jangan dihitung "siap disetor"
      if (a.olehOrtu && !a.terverifikasi) tungguVerif++;
      else siapSetor++;
    }
    perPosyandu.set(a.posyanduLabel, (perPosyandu.get(a.posyanduLabel) ?? 0) + 1);
  }

  const satu = posyandu.length === 1 ? posyandu[0] : null;
  const judul = satu ? `Posyandu ${satu.namaPosyandu || satu.nama} 🌼` : "Dashboard Posyandu 🌼";
  const sub = satu
    ? `${satu.nama} · ${satu.kelurahan.nama}`
    : `${posyandu.length} posyandu binaan`;

  return (
    <main className="pb-4">
      <div
        className="px-4 pb-6 pt-3.5"
        style={{ background: "linear-gradient(160deg,#26907f,#3aa895)" }}
      >
        <div className="mx-auto max-w-md">
          <Kepala user={user} />
          <h1 className="font-judul pop mt-3.5 text-[22px] font-bold leading-tight text-white">{judul}</h1>
          <p className="text-xs font-semibold text-white/85">{sub}</p>
        </div>
      </div>
      <div className="scallop" style={{ "--scallop": "#3aa895" } as React.CSSProperties} />

      <div className="mx-auto max-w-md px-4 pt-2.5">
        <div className="grid grid-cols-2 gap-2.5">
          <KartuStat
            nilai={
              <span className="flex flex-col gap-0.5">
                <span className="whitespace-nowrap leading-none">{anak.length}</span>
                <span className="block whitespace-normal text-[10px] font-bold leading-tight text-[var(--abu)]">
                  {bayi} bayi · {baduta} baduta · {balita} balita
                </span>
              </span>
            }
            label="Total anak binaan" img="/gambar/bayi-duduk.png" border="var(--teal-pastel)" warna="var(--teal-gelap)" delay="pop-1"
          />
          <KartuStat
            nilai={
              <span className="flex flex-col gap-1">
                <span className="whitespace-nowrap text-[21px] leading-none">
                  {idl} <span className="text-xs font-bold text-[var(--abu)]">IDL ✓</span>
                </span>
                <span className="whitespace-nowrap text-[21px] leading-none">
                  {ibl} <span className="text-xs font-bold text-[var(--abu)]">IBL ✓</span>
                </span>
              </span>
            }
            label="Anak sudah lengkap" img="/gambar/vaksin-vial.png"
            border="var(--hijau-border)" warna="var(--hijau-teks)" stiker="target!" delay="pop-4"
          />
        </div>

        {siapSetor > 0 && (
          <div className="pop pop-5 mt-3 flex items-center gap-3 rounded-[22px] border-2 border-[var(--coral-border)] bg-[var(--kartu)] px-4 py-3.5">
            <img src="/gambar/petugas-kesehatan.png" alt="" width={52} height={52} className="h-[52px] w-[52px] shrink-0 object-contain" />
            <div className="min-w-0 flex-1">
              <p className="font-judul text-sm font-bold text-[var(--coral-gelap)]">
                {siapSetor} anak baru siap disetor 📦
              </p>
              <p className="text-[11px] font-semibold leading-snug text-[var(--teks-sekunder)]">
                Export Excel, lalu serahkan ke petugas SIMPUS ya!
              </p>
            </div>
            <a href="/kader/export" className="btn3d btn3d-coral flex h-10 shrink-0 items-center rounded-[14px] px-3.5 text-[13px]" style={{ boxShadow: "0 4px 0 var(--coral-tua)" }}>
              Export
            </a>
          </div>
        )}
        {tungguVerif > 0 && (
          <Link
            href="/kader/daftar-bayi"
            className="pop pop-5 mt-3 flex items-center gap-3 rounded-[22px] border-2 bg-[var(--kartu)] px-4 py-3.5 transition-transform active:scale-[.97]"
            style={{ borderColor: "var(--verif-garis)" }}
          >
            <span className="shrink-0 text-[26px]" style={{ display: "inline-block", animation: "wiggle 2.4s ease-in-out infinite" }}>🟡</span>
            <span className="min-w-0 flex-1">
              <span className="font-judul block text-sm font-bold" style={{ color: "var(--verif-teks)" }}>
                {tungguVerif} anak isian ortu menunggu verifikasi
              </span>
              <span className="block text-[11px] font-semibold leading-snug text-[var(--teks-sekunder)]">
                Buka kartunya di Daftar Bayi untuk memeriksa — belum ikut Export sampai diverifikasi.
              </span>
            </span>
          </Link>
        )}

        <div className="pop pop-6 mt-2.5 flex items-center gap-2.5 rounded-[18px] bg-[var(--teal-muda)] px-3.5 py-2.5">
          <span className="text-base">☁️</span>
          <p className="text-[11px] font-semibold leading-relaxed text-[var(--teal-tua)]">
            {cache ? (
              <>Data statistik SIMPUS terakhir ditarik: <b>{cache.sinkronPada.toLocaleString("id-ID")}</b>. Tarikan dilakukan petugas puskesmas.</>
            ) : (
              <>Data SIMPUS belum ditarik — angka dihitung dari catatan website ini dulu. Tarikan dilakukan petugas puskesmas.</>
            )}
          </p>
        </div>

        {perPosyandu.size > 1 && (
          <section className="mt-4">
            <h2 className="font-judul text-sm font-bold text-[var(--teal-gelap)]">Per posyandu</h2>
            <div className="mt-2 space-y-1.5">
              {[...perPosyandu.entries()].map(([nama, n]) => (
                <div key={nama} className="flex items-center justify-between rounded-2xl border-2 border-[var(--garis-kader)] bg-[var(--kartu)] px-4 py-2.5 text-sm">
                  <span className="font-semibold">{nama}</span>
                  <span className="font-judul font-bold text-[var(--teal-gelap)]">{n} anak</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-3 flex gap-2.5">
          <Link
            href="/kader/daftar-bayi"
            className="btn3d btn3d-teal flex h-[50px] flex-1 items-center justify-center text-[15px]"
          >
            Daftar Bayi
          </Link>
          <Link
            href="/kader/anak-baru"
            className="btn-garis flex h-[50px] flex-1 items-center justify-center border-2 text-[15px]"
            style={{ borderColor: "var(--coral)", color: "#d95f38", boxShadow: "0 5px 0 var(--coral-border)" }}
          >
            + Anak Baru
          </Link>
        </div>
      </div>
    </main>
  );
}
