"use client";

import { useState } from "react";
import { DOSIS_REGISTRY, UMUR_IDEAL } from "@/lib/vaksin";

const BULAN_ID = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

function tambahBulan(iso: string, n: number): Date {
  const d = new Date(iso + "T00:00:00");
  d.setMonth(d.getMonth() + n);
  return d;
}
function fmt(d: Date): string {
  return `${d.getDate()} ${BULAN_ID[d.getMonth()]} ${d.getFullYear()}`;
}

function status(jatuhTempo: Date): { label: string; bg: string; fg: string } {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const t = new Date(jatuhTempo); t.setHours(0, 0, 0, 0);
  const beda = Math.round((t.getTime() - now.getTime()) / 86400000);
  if (beda < 0) return { label: "terlewat", bg: "#fdecea", fg: "var(--merah)" };
  if (beda === 0) return { label: "hari ini 🎯", bg: "var(--teal-muda)", fg: "var(--teal-tua)" };
  if (beda <= 14) return { label: `${beda} hari lagi`, bg: "#fef7e0", fg: "#a16207" };
  return { label: `${beda} hari lagi`, bg: "var(--bg)", fg: "var(--teks-sekunder)" };
}

export default function Kalkulator() {
  const [tgl, setTgl] = useState("");

  // kelompok per umur ideal
  const grup: [number, string[]][] = [];
  for (const d of DOSIS_REGISTRY) {
    const um = UMUR_IDEAL[d.kode] ?? 0;
    const g = grup.find(([u]) => u === um);
    if (g) g[1].push(d.nama); else grup.push([um, [d.nama]]);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-5">
      <h1 className="text-lg font-extrabold text-[var(--teal-tua)]">Kalkulator Jadwal Imunisasi</h1>
      <p className="mt-0.5 text-xs text-[var(--teks-sekunder)]">
        Masukkan tanggal lahir — jadwal ideal tiap kunjungan langsung terhitung.
      </p>

      <label className="mt-4 block text-xs font-semibold text-[var(--teks-sekunder)]">
        Tanggal lahir anak
        <input
          type="date"
          value={tgl}
          onChange={(e) => setTgl(e.target.value)}
          className="mt-1 w-full rounded-xl border border-[var(--garis)] bg-[var(--kartu)] px-3 py-2.5 text-sm"
        />
      </label>

      {tgl && (
        <div className="mt-4 space-y-2">
          {grup.map(([um, namaDosis]) => {
            const jt = tambahBulan(tgl, um);
            const st = status(jt);
            return (
              <div key={um} className="rounded-2xl border border-[var(--garis)] bg-[var(--kartu)] px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-extrabold text-[var(--teal-tua)]">
                    {um === 0 ? "Saat lahir" : `Usia ${um} bulan`}
                  </p>
                  <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: st.bg, color: st.fg }}>
                    {st.label}
                  </span>
                </div>
                <p className="mt-0.5 text-xs font-semibold">{fmt(jt)}</p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--teks-sekunder)]">
                  {namaDosis.join(" · ")}
                </p>
              </div>
            );
          })}
          <p className="rounded-xl bg-[var(--teal-muda)] px-3 py-2 text-[11px] leading-relaxed text-[var(--teal-tua)]">
            Catatan: jadwal ideal. Interval kejar (28 hari antar dosis, booster 12/6 bulan) &amp;
            aturan merek (Hexavalen tanpa IPV terpisah, Rotarix 2 dosis) mengikuti data anak di
            Daftar Bayi.
          </p>
        </div>
      )}
    </main>
  );
}
