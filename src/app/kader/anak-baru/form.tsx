"use client";

import { useState } from "react";
import { simpanAnakBaru } from "@/lib/anak-actions";
import { DOSIS_REGISTRY, UMUR_IDEAL, VARIAN_MEREK } from "@/lib/vaksin";
import type { IsiAnak } from "@/lib/brankas";

interface PosyanduOpsi { id: number; label: string; kelurahan: string }

/** Merek awal per slot varian dari data tersimpan (edit) / default indeks 0. */
function merekAwal(vaksin: Record<string, string>): Record<string, string> {
  const m: Record<string, string> = {};
  for (const [slot, varian] of Object.entries(VARIAN_MEREK)) {
    const terisi = varian.find((v) => vaksin[v.kode]);
    m[slot] = terisi ? terisi.kode : varian[0].kode;
  }
  return m;
}

export default function FormAnak({
  posyandu,
  idEdit,
  awal,
  galat,
}: {
  posyandu: PosyanduOpsi[];
  idEdit?: number;
  awal?: IsiAnak & { posyanduId: number };
  galat?: string;
}) {
  const [merek, setMerek] = useState<Record<string, string>>(() => merekAwal(awal?.vaksin ?? {}));
  const [tglLahir, setTglLahir] = useState(awal?.tglLahir ?? "");

  const jalurHexa = ["PENTA1", "PENTA2", "PENTA3"].some((s) => merek[s]?.startsWith("HEXA"));
  const jalurRotarix = ["ROTA1", "ROTA2"].some((s) => merek[s]?.startsWith("ROTARIX"));

  // kelompokkan slot per umur ideal
  const grup: [number, typeof DOSIS_REGISTRY][] = [];
  for (const d of DOSIS_REGISTRY) {
    const um = UMUR_IDEAL[d.kode] ?? 0;
    const g = grup.find(([u]) => u === um);
    if (g) g[1].push(d); else grup.push([um, [d]]);
  }

  const inp = "mt-1 w-full rounded-lg border border-[var(--garis)] px-3 py-2 text-sm";
  const lbl = "block text-xs font-semibold text-[var(--teks-sekunder)]";

  return (
    <form action={simpanAnakBaru}>
      {idEdit && <input type="hidden" name="id" value={idEdit} />}
      {galat && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-[var(--merah)]">{galat}</p>
      )}

      <section className="rounded-2xl border border-[var(--garis)] bg-[var(--kartu)] p-4">
        <h2 className="text-sm font-extrabold text-[var(--teal-tua)]">Identitas Anak</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className={lbl}>Nama anak *
            <input name="nama" defaultValue={awal?.nama} className={inp} placeholder="nama lengkap" />
          </label>
          <label className={lbl}>Tanggal lahir *
            <input name="tglLahir" type="date" value={tglLahir} onChange={(e) => setTglLahir(e.target.value)} className={inp} />
          </label>
          <label className={lbl}>Jenis kelamin *
            <select name="jk" defaultValue={awal?.jk ?? ""} className={inp}>
              <option value="">— pilih —</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </label>
          <label className={lbl}>Posyandu *
            <select name="posyanduId" defaultValue={awal?.posyanduId ?? posyandu[0]?.id} className={inp}>
              {posyandu.map((p) => (
                <option key={p.id} value={p.id}>{p.label} — {p.kelurahan}</option>
              ))}
            </select>
          </label>
          <label className={lbl}>Nama orang tua
            <input name="namaOrtu" defaultValue={awal?.namaOrtu} className={inp} />
          </label>
          <label className={lbl}>NIK anak (16 digit, boleh kosong)
            <input name="nik" inputMode="numeric" defaultValue={awal?.nik} className={inp} />
          </label>
          <label className={lbl}>No HP ortu
            <input name="noHp" inputMode="numeric" defaultValue={awal?.noHp} className={inp} placeholder="08…" />
          </label>
          <label className={lbl}>RT/RW
            <input name="rtRw" defaultValue={awal?.rtRw} className={inp} placeholder="003/001" />
          </label>
          <label className={`${lbl} sm:col-span-2`}>Alamat
            <input name="alamat" defaultValue={awal?.alamat} className={inp} />
          </label>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-[var(--garis)] bg-[var(--kartu)] p-4">
        <h2 className="text-sm font-extrabold text-[var(--teal-tua)]">Dosis yang sudah diterima</h2>
        <p className="mt-1 text-[11px] leading-relaxed text-[var(--teks-sekunder)]">
          Isi tanggal hanya untuk dosis yang SUDAH diberikan. Merek DPT (Penta/Hexa) &amp;
          Rotavirus (Rotavac/Rotarix) memengaruhi slot: Hexavalen menyembunyikan IPV, Rotarix
          menyembunyikan Rotavirus 3.
        </p>

        <div className="mt-3 space-y-4">
          {grup.map(([um, daftar]) => {
            const tampil = daftar.filter((d) => {
              if (jalurHexa && (d.kode === "IPV1" || d.kode === "IPV2")) return false;
              if (jalurRotarix && d.kode === "ROTA3") return false;
              return true;
            });
            if (tampil.length === 0) return null;
            return (
              <div key={um}>
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-[var(--teal-tua)]">
                  {um === 0 ? "Lahir" : `${um} bulan`}
                </p>
                <div className="mt-1.5 grid gap-3 sm:grid-cols-2">
                  {tampil.map((d) => {
                    const varian = VARIAN_MEREK[d.kode];
                    const kodeAktif = varian ? merek[d.kode] : d.kode;
                    return (
                      <div key={d.kode}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold">{d.nama}</span>
                          {varian && (
                            <select
                              value={merek[d.kode]}
                              onChange={(e) => setMerek((m) => ({ ...m, [d.kode]: e.target.value }))}
                              className="rounded border border-[var(--garis)] px-1.5 py-0.5 text-[11px]"
                            >
                              {varian.map((v) => (
                                <option key={v.kode} value={v.kode}>{v.merek}</option>
                              ))}
                            </select>
                          )}
                        </div>
                        <input
                          name={`vaksin__${kodeAktif}`}
                          type="date"
                          min={tglLahir || undefined}
                          defaultValue={awal?.vaksin?.[kodeAktif] ?? ""}
                          className="mt-1 w-full rounded-lg border border-[var(--garis)] px-3 py-1.5 text-sm"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <button
        type="submit"
        className="mt-4 w-full rounded-xl bg-[var(--teal)] py-3 text-sm font-bold text-white hover:bg-[var(--teal-tua)]"
      >
        {idEdit ? "Simpan perubahan" : "Daftarkan anak"}
      </button>
      <p className="mt-2 text-center text-[11px] text-[var(--teks-sekunder)]">
        Anak tersimpan sebagai <b>BARU (draf)</b> — nanti diekspor ke SIMPUS lewat Excel (Tahap 8).
      </p>
    </form>
  );
}
