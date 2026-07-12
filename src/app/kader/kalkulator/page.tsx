"use client";

import { useState } from "react";
import KepalaHalaman from "@/components/kepala-halaman";
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

interface Gaya {
  border: string;
  kotakBg: string;
  kotakFg: string;
  judul: string;
  stiker?: { teks: string; bg: string; fg: string; wiggle?: boolean };
  chip?: string;
}

/** Warna kartu per status jatuh tempo (mockup b-kkalk):
 *  terlewat lama = merah · baru terlewat ≤14 hari = kuning (wiggle) · hari ini/mendatang = teal. */
function gaya(jatuhTempo: Date): Gaya {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const t = new Date(jatuhTempo); t.setHours(0, 0, 0, 0);
  const beda = Math.round((t.getTime() - now.getTime()) / 86400000);
  if (beda < 0 && -beda <= 14) {
    return {
      border: "var(--kuning-border)", kotakBg: "var(--kuning-muda)", kotakFg: "var(--kuning-teks)", judul: "var(--kuning-teks)",
      stiker: { teks: `baru terlewat ${-beda} hari`, bg: "var(--kuning)", fg: "var(--kuning-gelap)", wiggle: true },
    };
  }
  if (beda < 0) {
    return {
      border: "var(--merah-border)", kotakBg: "var(--merah-muda)", kotakFg: "var(--merah-teks)", judul: "var(--merah-teks)",
      stiker: { teks: "terlewat", bg: "var(--merah)", fg: "#fff" },
    };
  }
  if (beda === 0) {
    return {
      border: "var(--teal-pastel)", kotakBg: "var(--teal-muda)", kotakFg: "var(--teal-gelap)", judul: "var(--teal-gelap)",
      stiker: { teks: "hari ini 🎯", bg: "var(--teal)", fg: "#fff", wiggle: true },
    };
  }
  return {
    border: "var(--garis-kader)", kotakBg: "var(--teal-muda)", kotakFg: "var(--teal-gelap)", judul: "var(--teal-gelap)",
    chip: `${beda} hari lagi`,
  };
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
    <main>
      <KepalaHalaman judul="Kalkulator Jadwal 🧮" sub="masukkan tanggal lahir — jadwal langsung terhitung" />
      <div className="mx-auto max-w-md px-4 pt-4">
        <label className="pop block text-[12.5px] font-extrabold text-[var(--teks-3)]">
          Tanggal lahir anak
          <input
            type="date"
            value={tgl}
            onChange={(e) => setTgl(e.target.value)}
            className="mt-1.5 h-[52px] w-full rounded-2xl border-2 border-[var(--teal-pastel)] bg-[var(--kartu)] px-4 text-base font-bold outline-none transition-colors focus:border-[var(--teal)]"
          />
        </label>

        {tgl && (
          <div className="mt-3.5 flex flex-col gap-2.5">
            {grup.map(([um, namaDosis], i) => {
              const jt = tambahBulan(tgl, um);
              const g = gaya(jt);
              const tglJauh = um >= 12;
              return (
                <div
                  key={um}
                  className={`pop pop-${Math.min(i + 1, 6)} relative mt-1 flex items-center gap-3 rounded-[20px] border-2 bg-[var(--kartu)] px-3.5 py-3`}
                  style={{ borderColor: g.border }}
                >
                  {g.stiker && (
                    <span
                      className="font-judul absolute -top-[9px] right-3 rounded-full px-2.5 py-0.5 text-[9.5px] font-bold"
                      style={{
                        background: g.stiker.bg, color: g.stiker.fg,
                        transform: i % 2 === 0 ? "rotate(1.5deg)" : "rotate(-1.5deg)",
                        animation: g.stiker.wiggle ? "wiggle 2.4s ease-in-out infinite" : undefined,
                      }}
                    >
                      {g.stiker.teks}
                    </span>
                  )}
                  <div
                    className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-2xl"
                    style={{ background: g.kotakBg, color: g.kotakFg }}
                  >
                    <span className="font-judul text-sm font-bold leading-none">{jt.getDate()}</span>
                    <span className="text-[8px] font-extrabold uppercase">{BULAN_ID[jt.getMonth()]}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-judul text-[13.5px] font-bold" style={{ color: g.judul }}>
                      {um === 0 ? "Saat lahir" : `Usia ${um} bulan`}
                      {g.chip && (
                        <span className="font-judul ml-1.5 rounded-full bg-[var(--teal-muda)] px-2 py-0.5 text-[10px] font-bold">
                          {g.chip}
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] font-semibold leading-relaxed text-[var(--teks-sekunder)]">
                      {namaDosis.join(" · ")}
                      {tglJauh && <> — {fmt(jt)}</>}
                    </p>
                  </div>
                </div>
              );
            })}
            <div className="pop flex items-start gap-2.5 rounded-[18px] bg-[var(--teal-muda)] px-3.5 py-2.5">
              <span className="shrink-0 text-[15px]">💡</span>
              <p className="text-[10.5px] font-semibold leading-relaxed text-[var(--teal-tua)]">
                Ini jadwal ideal. Interval kejar (28 hari antar dosis, booster 12/6 bulan) &amp; aturan merek
                (Hexavalen tanpa IPV terpisah, Rotarix 2 dosis) mengikuti data anak di Daftar Bayi.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
