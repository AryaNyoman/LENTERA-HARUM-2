"use client";

import { useState, type ReactNode } from "react";
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

function emojiUsia(um: number): string {
  if (um === 0) return "👼";
  if (um === 1) return "🍼";
  if (um <= 4) return "🧸";
  return "🚶";
}

export default function FormAnak({
  posyandu,
  idEdit,
  awal,
  galat,
  action,
  labelSimpan,
  catatan,
  aksen = "var(--teal)",
  aksenTua = "var(--teal-tua)",
  tema = "kader",
}: {
  posyandu: PosyanduOpsi[];
  idEdit?: number;
  awal?: IsiAnak & { posyanduId: number };
  galat?: string;
  /** Server action tujuan submit (default: simpanAnakBaru untuk kader). */
  action?: (formData: FormData) => Promise<void>;
  labelSimpan?: string;
  catatan?: ReactNode;
  /** Warna aksen judul/tombol/fokus — teal (kader, default) atau coral (ortu). */
  aksen?: string;
  aksenTua?: string;
  /** Tema border/latar input mengikuti sisi pemakai. */
  tema?: "kader" | "ortu";
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

  const ortu = tema === "ortu";
  const garis = ortu ? "var(--garis-ortu)" : "#e2ece7";
  const latar = ortu ? "var(--krem-input)" : "#fbfdfc";
  const warnaGrup = ortu ? "#c9a689" : "var(--abu)";
  const kartu = `rounded-[22px] border-2 bg-[var(--kartu)] p-4`;
  const lbl = "block text-xs font-extrabold text-[var(--teks-3)]";
  const wajib = <span className="text-[var(--merah)]">*</span>;

  const inpStyle: React.CSSProperties = { borderColor: garis, background: latar };
  const inp = "mt-1.5 h-[46px] w-full rounded-[14px] border-2 px-3.5 text-base font-semibold outline-none transition-colors";
  const inpTgl = "h-[42px] w-[150px] shrink-0 rounded-xl border-2 px-2.5 text-sm font-semibold outline-none";

  return (
    <form action={action ?? simpanAnakBaru}>
      {idEdit && <input type="hidden" name="id" value={idEdit} />}
      {galat && (
        <div className="pop mb-3 flex items-center gap-2.5 rounded-2xl border-2 border-[var(--merah-border)] bg-[var(--merah-muda)] px-3.5 py-2.5">
          <span className="shrink-0 text-[15px]">😅</span>
          <p className="text-[11px] font-bold leading-snug text-[var(--merah-teks)]">{galat}</p>
        </div>
      )}

      <section className={`pop ${kartu}`} style={{ borderColor: ortu ? "var(--garis-ortu)" : "var(--garis-kader)" }}>
        <h2 className="font-judul mb-3 text-[15px] font-bold" style={{ color: aksenTua }}>🪪 Identitas Anak</h2>
        <label className={lbl}>
          Nama anak {wajib}
          <input name="nama" defaultValue={awal?.nama} className={inp} style={inpStyle} placeholder="nama lengkap sesuai KIA" />
        </label>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <label className={`${lbl} min-w-0`}>
            Tanggal lahir {wajib}
            <input name="tglLahir" type="date" value={tglLahir} onChange={(e) => setTglLahir(e.target.value)} className={inp} style={inpStyle} />
          </label>
          <label className={`${lbl} min-w-0`}>
            Jenis kelamin {wajib}
            <select name="jk" defaultValue={awal?.jk ?? ""} className={inp} style={inpStyle}>
              <option value="">— pilih —</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </label>
        </div>
        <label className={`${lbl} mt-3`}>
          Posyandu {wajib}{" "}
          {ortu && <span className="font-semibold text-[var(--abu)]">— tempat anak diperiksa</span>}
          <select
            name="posyanduId"
            defaultValue={awal?.posyanduId ?? posyandu[0]?.id}
            className={`${inp} min-w-0 ${ortu ? "font-bold" : ""}`}
            style={ortu ? { borderColor: "var(--coral)", background: "#fdf9f5" } : inpStyle}
          >
            {posyandu.map((p) => (
              <option key={p.id} value={p.id}>{p.label} — {p.kelurahan}</option>
            ))}
          </select>
        </label>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <label className={`${lbl} min-w-0`}>
            Nama orang tua
            <input name="namaOrtu" defaultValue={awal?.namaOrtu} className={inp} style={inpStyle} />
          </label>
          <label className={`${lbl} min-w-0`}>
            No HP ortu
            <input name="noHp" inputMode="numeric" defaultValue={awal?.noHp} className={inp} style={inpStyle} placeholder="08…" />
          </label>
        </div>
        <label className={`${lbl} mt-3`}>
          NIK anak <span className="font-semibold text-[var(--abu)]">(16 digit, boleh kosong)</span>
          <input name="nik" inputMode="numeric" defaultValue={awal?.nik} className={inp} style={inpStyle} />
        </label>
        <div className="mt-3 grid grid-cols-[2fr_1fr] gap-2.5">
          <label className={`${lbl} min-w-0`}>
            Alamat
            <input name="alamat" defaultValue={awal?.alamat} className={inp} style={inpStyle} />
          </label>
          <label className={`${lbl} min-w-0`}>
            RT/RW
            <input name="rtRw" defaultValue={awal?.rtRw} className={inp} style={inpStyle} placeholder="003/001" />
          </label>
        </div>
      </section>

      <section className={`pop pop-1 mt-3.5 ${kartu}`} style={{ borderColor: ortu ? "var(--garis-ortu)" : "var(--garis-kader)" }}>
        <h2 className="font-judul text-[15px] font-bold" style={{ color: aksenTua }}>💉 Dosis yang sudah diterima</h2>
        <p className="mt-1 text-[10.5px] font-semibold leading-relaxed text-[var(--abu)]">
          {ortu ? (
            <>Lihat buku KIA Si Kecil — isi tanggal hanya untuk dosis yang <b>sudah</b> diberikan. Belum ada / tidak yakin? Kosongkan saja, kader akan melengkapi.</>
          ) : (
            <>Isi tanggal hanya untuk dosis yang <b>sudah</b> diberikan. Pilihan merek memengaruhi slot: Hexavalen menyembunyikan IPV, Rotarix menyembunyikan Rotavirus 3.</>
          )}
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
                <p className="font-judul mb-1 text-[11.5px] font-bold" style={{ color: warnaGrup }}>
                  {emojiUsia(um)} {um === 0 ? "LAHIR" : `${um} BULAN`}
                </p>
                {tampil.map((d) => {
                  const varian = VARIAN_MEREK[d.kode];
                  const kodeAktif = varian ? merek[d.kode] : d.kode;
                  if (!varian) {
                    return (
                      <div key={d.kode} className="flex items-center gap-2.5 py-[5px]">
                        <span className="min-w-0 flex-1 text-[13px] font-bold">{d.nama}</span>
                        <input
                          name={`vaksin__${kodeAktif}`}
                          type="date"
                          min={tglLahir || undefined}
                          defaultValue={awal?.vaksin?.[kodeAktif] ?? ""}
                          className={inpTgl}
                          style={inpStyle}
                        />
                      </div>
                    );
                  }
                  return (
                    <div key={d.kode} className="py-[5px]">
                      <div className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 text-[13px] font-bold">{d.nama}</span>
                        <span className="inline-flex shrink-0 rounded-full p-[3px]" style={{ background: ortu ? "#f6ede4" : "#f0f5f2" }}>
                          {varian.map((v) => {
                            const aktifV = merek[d.kode] === v.kode;
                            return (
                              <button
                                key={v.kode}
                                type="button"
                                onClick={() => setMerek((m) => ({ ...m, [d.kode]: v.kode }))}
                                className="font-judul rounded-full px-2.5 py-1 text-[10.5px] font-bold transition-colors"
                                style={{ background: aktifV ? aksen : "transparent", color: aktifV ? "#fff" : "var(--teks-sekunder)" }}
                              >
                                {v.merek}
                              </button>
                            );
                          })}
                        </span>
                      </div>
                      <input
                        name={`vaksin__${kodeAktif}`}
                        type="date"
                        min={tglLahir || undefined}
                        defaultValue={awal?.vaksin?.[kodeAktif] ?? ""}
                        className="mt-1.5 h-[42px] w-full rounded-xl border-2 px-2.5 text-sm font-semibold outline-none"
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
        className="btn3d mt-3.5 h-[54px] w-full rounded-[18px] text-base"
        style={{ background: aksen, boxShadow: `0 6px 0 ${aksenTua === "var(--teal-tua)" ? "var(--teal-tua)" : "var(--coral-tua)"}` }}
      >
        {labelSimpan ?? (idEdit ? "Simpan perubahan" : "Daftarkan anak 🎉")}
      </button>
      {catatan ? (
        <div className="mt-2.5 flex items-center gap-2 rounded-2xl border-[1.5px] px-3.5 py-2.5" style={{ background: "var(--verif-muda)", borderColor: "var(--verif-garis)" }}>
          <span className="shrink-0 text-[15px]">🟡</span>
          <p className="text-[10.5px] font-semibold leading-relaxed text-[var(--verif-teks)]">{catatan}</p>
        </div>
      ) : (
        <p className="mt-2.5 text-center text-[10.5px] font-semibold leading-relaxed text-[var(--abu)]">
          Anak tersimpan sebagai <b>draf</b> dulu — nanti disetor ke SIMPUS lewat tombol Export Excel.
        </p>
      )}
    </form>
  );
}
