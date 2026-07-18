"use client";

/** Blok input dosis utk form admin "Isi Tanggal Vaksin" — dicontek dari blok dosis
 *  src/app/kader/anak-baru/form.tsx (baca boleh, TIDAK diimpor — file itu sedang
 *  diedit paralel oleh builder lain). Lebih sederhana dari sumbernya: tglLahir TETAP
 *  (identitas anak read-only di halaman ini), jadi batasDosis dihitung sekali per
 *  render — tak perlu useState utk tglLahir seperti form.tsx. */

import { useState } from "react";
import { DOSIS_REGISTRY, UMUR_IDEAL, VARIAN_MEREK, batasDosis } from "@/lib/vaksin";
import InputTanggal from "@/components/input-tanggal";

/** Merek awal per slot varian dari data tersimpan / default indeks 0 (sama pola form.tsx). */
function merekAwal(vaksin: Record<string, string>): Record<string, string> {
  const m: Record<string, string> = {};
  for (const [slot, varian] of Object.entries(VARIAN_MEREK)) {
    const terisi = varian.find((v) => vaksin[v.kode]);
    m[slot] = terisi ? terisi.kode : varian[0].kode;
  }
  return m;
}

function emojiUsia(um: number): string {
  if (um === 0) return "👼";
  if (um === 1) return "🍼";
  if (um <= 4) return "🧸";
  return "🚶";
}

export default function DosisFormAdmin({
  id,
  tglLahir,
  vaksin,
  action,
}: {
  id: number;
  tglLahir: string;
  vaksin: Record<string, string>;
  action: (formData: FormData) => Promise<void>;
}) {
  const [merek, setMerek] = useState<Record<string, string>>(() => merekAwal(vaksin));
  const jalurHexa = ["PENTA1", "PENTA2", "PENTA3"].some((s) => merek[s]?.startsWith("HEXA"));
  const jalurRotarix = ["ROTA1", "ROTA2"].some((s) => merek[s]?.startsWith("ROTARIX"));

  const grup: [number, typeof DOSIS_REGISTRY][] = [];
  for (const d of DOSIS_REGISTRY) {
    const um = UMUR_IDEAL[d.kode] ?? 0;
    const g = grup.find(([u]) => u === um);
    if (g) g[1].push(d); else grup.push([um, [d]]);
  }

  const inpStyle: React.CSSProperties = { borderColor: "#e2ece7", background: "#fbfdfc" };

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <section className="pop mt-3.5 rounded-[22px] border-2 border-[var(--garis-kader)] bg-[var(--kartu)] p-4">
        <h2 className="font-judul text-[15px] font-bold text-[var(--teal-tua)]">💉 Dosis yang sudah diterima</h2>
        <p className="mt-1 text-[10.5px] font-semibold leading-relaxed text-[var(--abu)]">
          Isi tanggal hanya untuk dosis yang <b>sudah</b> diberikan. Pilihan merek memengaruhi slot:
          Hexavalen menyembunyikan IPV, Rotarix menyembunyikan Rotavirus 3.
        </p>

        <div className="mt-3">
          {grup.map(([um, daftar]) => {
            const tampil = daftar.filter((d) => {
              if (jalurHexa && (d.kode === "IPV1" || d.kode === "IPV2")) return false;
              if (jalurRotarix && d.kode === "ROTA3") return false;
              return true;
            });
            if (tampil.length === 0) return null;
            return (
              <div key={um} className="mt-2 first:mt-0">
                <p className="font-judul mb-1 text-[11.5px] font-bold text-[var(--abu)]">
                  {emojiUsia(um)} {um === 0 ? "LAHIR" : `${um} BULAN`}
                </p>
                {tampil.map((d) => {
                  const varian = VARIAN_MEREK[d.kode];
                  const kodeAktif = varian ? merek[d.kode] : d.kode;
                  const batas = batasDosis({}, kodeAktif, tglLahir);
                  if (!varian) {
                    return (
                      <div key={d.kode} className="flex items-center gap-2.5 py-[5px]">
                        <span className="min-w-0 flex-1 text-[13px] font-bold">{d.nama}</span>
                        <InputTanggal
                          key={`tgl-${kodeAktif}`}
                          name={`vaksin__${kodeAktif}`}
                          min={batas.min}
                          max={batas.max}
                          defaultValue={vaksin[kodeAktif] ?? ""}
                          bungkus="relative inline-block w-[150px] shrink-0"
                          className="h-[42px] w-full rounded-xl border-2 px-2.5 text-sm font-semibold outline-none"
                          style={inpStyle}
                        />
                      </div>
                    );
                  }
                  return (
                    <div key={d.kode} className="py-[5px]">
                      <div className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 text-[13px] font-bold">{d.nama}</span>
                        <span className="inline-flex shrink-0 rounded-full bg-[#f0f5f2] p-[3px]">
                          {varian.map((v) => {
                            const aktifV = merek[d.kode] === v.kode;
                            return (
                              <button
                                key={v.kode}
                                type="button"
                                onClick={() => setMerek((m) => ({ ...m, [d.kode]: v.kode }))}
                                className="font-judul rounded-full px-2.5 py-1 text-[10.5px] font-bold transition-colors"
                                style={{ background: aktifV ? "var(--teal)" : "transparent", color: aktifV ? "#fff" : "var(--teks-sekunder)" }}
                              >
                                {v.merek}
                              </button>
                            );
                          })}
                        </span>
                      </div>
                      <InputTanggal
                        key={`tgl-${kodeAktif}`}
                        name={`vaksin__${kodeAktif}`}
                        min={batas.min}
                        max={batas.max}
                        defaultValue={vaksin[kodeAktif] ?? ""}
                        bungkus="relative mt-1.5 block"
                        className="h-[42px] w-full rounded-xl border-2 px-2.5 text-sm font-semibold outline-none"
                        style={inpStyle}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </section>

      <button
        type="submit"
        className="btn3d btn3d-teal mt-3.5 h-[54px] w-full rounded-[18px] text-base"
        style={{ boxShadow: "0 6px 0 var(--teal-tua)" }}
      >
        Simpan dosis
      </button>
    </form>
  );
}
