"use client";

import { useState } from "react";
import { DOSIS_REGISTRY, UMUR_IDEAL } from "@/lib/vaksin";

const BULAN_ID = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

function tambahBulan(iso: string, n: number): Date {
  const d = new Date(iso + "T00:00:00");
  d.setMonth(d.getMonth() + n);
  return d;
}
function fmt(d: Date): string {
  return `${d.getDate()} ${BULAN_ID[d.getMonth()]} ${d.getFullYear()}`;
}

function status(jatuhTempo: Date, terdekat: boolean): { label: string; bg: string; fg: string; border: string; wiggle: boolean } {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const t = new Date(jatuhTempo); t.setHours(0, 0, 0, 0);
  const beda = Math.round((t.getTime() - now.getTime()) / 86400000);
  if (beda < 0) return { label: `terlewat ${-beda} hari`, bg: "var(--merah-muda)", fg: "var(--merah-teks)", border: "var(--merah-border)", wiggle: terdekat };
  if (beda === 0) return { label: "hari ini 🎯", bg: "var(--teal-muda)", fg: "var(--teal-tua)", border: "var(--teal-pastel)", wiggle: true };
  if (beda <= 14) return { label: `${beda} hari lagi`, bg: "var(--kuning-pastel)", fg: "var(--kuning-teks)", border: "var(--kuning-border)", wiggle: terdekat };
  return { label: `${beda} hari lagi`, bg: "var(--bg)", fg: "var(--teks-sekunder)", border: "var(--garis)", wiggle: false };
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

  // baris paling dekat ke "sekarang" (utk wiggle) — dicari setelah tgl terisi
  let idxTerdekat = -1;
  if (tgl) {
    const now = Date.now();
    let min = Infinity;
    grup.forEach(([um], i) => {
      const jarak = Math.abs(tambahBulan(tgl, um).getTime() - now);
      if (jarak < min) { min = jarak; idxTerdekat = i; }
    });
  }

  return (
    <main className="min-h-[calc(100dvh-56px)] bg-titik-kader pb-6">
      <div className="mx-auto max-w-3xl px-4 pt-5">
        <h1 className="font-judul text-lg font-extrabold text-[var(--teal-tua)]">Kalkulator Jadwal Imunisasi</h1>
        <p className="mt-0.5 text-xs text-[var(--teks-sekunder)]">
          Masukkan tanggal lahir — jadwal ideal tiap kunjungan langsung terhitung.
        </p>

        <label className="mt-4 block text-xs font-semibold text-[var(--teks-sekunder)]">
          Tanggal lahir anak
          <input
            type="date"
            value={tgl}
            onChange={(e) => setTgl(e.target.value)}
            className="mt-1 w-full rounded-[var(--r-input)] border-2 border-[var(--garis-kader)] bg-[var(--kartu)] px-3 py-3 text-base focus:border-[var(--teal)] focus:outline-none"
          />
        </label>

        {tgl && (
          <div className="mt-4 space-y-2">
            {grup.map(([um, namaDosis], i) => {
              const jt = tambahBulan(tgl, um);
              const st = status(jt, i === idxTerdekat);
              return (
                <div key={um} className="pop flex gap-3 rounded-2xl border-2 bg-[var(--kartu)] p-3" style={{ borderColor: st.border }}>
                  <div
                    className="font-judul flex w-14 shrink-0 flex-col items-center justify-center rounded-xl text-center"
                    style={{ background: st.bg, color: st.fg }}
                  >
                    <span className="text-lg font-extrabold leading-none">{jt.getDate()}</span>
                    <span className="text-[10px] font-bold uppercase">{BULAN_ID[jt.getMonth()]}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-extrabold text-[var(--teal-tua)]">
                        {um === 0 ? "Saat lahir" : `Usia ${um} bulan`}
                      </p>
                      <span
                        className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold"
                        style={{ background: st.bg, color: st.fg, display: "inline-block", animation: st.wiggle ? "wiggle 2s ease-in-out infinite" : undefined }}
                      >
                        {st.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs font-semibold text-[var(--teks-sekunder)]">{fmt(jt)}</p>
                    <p className="mt-1 text-xs leading-relaxed">{namaDosis.join(" · ")}</p>
                  </div>
                </div>
              );
            })}
            <p className="rounded-xl bg-[var(--teal-muda)] px-3 py-2 text-[11px] leading-relaxed text-[var(--teal-tua)]">
              💡 Catatan: jadwal ideal. Interval kejar (28 hari antar dosis, booster 12/6 bulan) &amp;
              aturan merek (Hexavalen tanpa IPV terpisah, Rotarix 2 dosis) mengikuti data anak di
              Daftar Bayi.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
