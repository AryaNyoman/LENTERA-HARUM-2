"use client";

import { useState, type ReactNode } from "react";
import { simpanAnakBaru } from "@/lib/anak-actions";
import { DOSIS_REGISTRY, UMUR_IDEAL, VARIAN_MEREK, batasDosis } from "@/lib/vaksin";
import type { IsiAnak } from "@/lib/brankas";
import InputTanggal from "@/components/input-tanggal";

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

/** Format ketikan RT/RW jadi "###/###" — buang non-digit, maks 6 digit, sisip "/" setelah digit ke-3. */
function formatRtRw(raw: string): string {
  const digit = raw.replace(/\D/g, "").slice(0, 6);
  return digit.length > 3 ? `${digit.slice(0, 3)}/${digit.slice(3)}` : digit;
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
  kunciKelurahan,
  namaOrtuTetap,
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
  /** Kunci kelurahan ke domisili ortu (nama kelurahan) — pilihan posyandu ikut menyempit. */
  kunciKelurahan?: string;
  /** Kunci "Nama orang tua" ke nama akun ortu (tetap terkirim sebagai field form). */
  namaOrtuTetap?: string;
}) {
  const [merek, setMerek] = useState<Record<string, string>>(() => merekAwal(awal?.vaksin ?? {}));
  const [tglLahir, setTglLahir] = useState(awal?.tglLahir ?? "");
  const [rtRw, setRtRw] = useState(awal?.rtRw ?? "");

  // pilih kelurahan dulu → daftar posyandu menyempit (tidak panjang sekali)
  const daftarKelurahan = [...new Set(posyandu.map((p) => p.kelurahan))];
  // kunci hanya berlaku bila kelurahan itu memang punya posyandu aktif
  if (kunciKelurahan && !daftarKelurahan.includes(kunciKelurahan)) kunciKelurahan = undefined;
  const kelurahanAwal =
    kunciKelurahan ??
    posyandu.find((p) => p.id === awal?.posyanduId)?.kelurahan ??
    daftarKelurahan[0] ?? "";
  const [kelurahan, setKelurahan] = useState(kelurahanAwal);
  const posyanduTersaring = posyandu.filter((p) => p.kelurahan === kelurahan);
  const [posyanduId, setPosyanduId] = useState<number>(
    awal?.posyanduId ?? posyanduTersaring[0]?.id ?? posyandu[0]?.id,
  );

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
  const inpTgl = "h-[42px] w-full rounded-xl border-2 px-2.5 text-sm font-semibold outline-none";

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
            <InputTanggal
              name="tglLahir"
              value={tglLahir}
              onChange={(e) => setTglLahir(e.target.value)}
              bungkus="relative mt-1.5 block"
              className="h-[46px] w-full rounded-[14px] border-2 px-3.5 text-base font-semibold outline-none transition-colors"
              style={inpStyle}
            />
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
          Kelurahan {wajib}
          {kunciKelurahan ? (
            <span
              className="mt-1.5 flex h-[46px] w-full items-center justify-between rounded-[14px] border-2 px-3.5 text-base font-semibold text-[var(--teks-sekunder)]"
              style={{ borderColor: garis, background: latar }}
            >
              {kunciKelurahan}
              <span className="font-judul rounded-full px-2 py-0.5 text-[9.5px] font-bold" style={{ background: "var(--teal-muda)", color: "var(--teal-gelap)" }}>
                sesuai domisili Anda
              </span>
            </span>
          ) : (
            <select
              value={kelurahan}
              onChange={(e) => {
                setKelurahan(e.target.value);
                const pertama = posyandu.find((p) => p.kelurahan === e.target.value);
                if (pertama) setPosyanduId(pertama.id);
              }}
              className={`${inp} min-w-0`}
              style={inpStyle}
            >
              {daftarKelurahan.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          )}
        </label>
        <label className={`${lbl} mt-3`}>
          Posyandu {wajib}{" "}
          {ortu && <span className="font-semibold text-[var(--abu)]">— tempat anak diperiksa</span>}
          <select
            name="posyanduId"
            value={posyanduId}
            onChange={(e) => setPosyanduId(Number(e.target.value))}
            className={`${inp} min-w-0 ${ortu ? "font-bold" : ""}`}
            style={ortu ? { borderColor: "var(--coral)", background: "#fdf9f5" } : inpStyle}
          >
            {posyanduTersaring.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </label>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <label className={`${lbl} min-w-0`}>
            Nama orang tua
            <input
              name="namaOrtu"
              defaultValue={namaOrtuTetap ?? awal?.namaOrtu}
              readOnly={Boolean(namaOrtuTetap)}
              className={`${inp} ${namaOrtuTetap ? "text-[var(--teks-sekunder)]" : ""}`}
              style={inpStyle}
              title={namaOrtuTetap ? "Terisi otomatis dari akun Anda" : undefined}
            />
          </label>
          <label className={`${lbl} min-w-0`}>
            No HP ortu
            <input name="noHp" inputMode="numeric" maxLength={13} defaultValue={awal?.noHp} className={inp} style={inpStyle} placeholder="08…" />
          </label>
        </div>
        <label className={`${lbl} mt-3`}>
          NIK anak <span className="font-semibold text-[var(--abu)]">(16 digit, boleh kosong)</span>
          <input name="nik" inputMode="numeric" maxLength={16} pattern="\d{16}" title="16 digit angka" defaultValue={awal?.nik} className={inp} style={inpStyle} />
        </label>
        <div className="mt-3 grid grid-cols-[2fr_1fr] gap-2.5">
          <label className={`${lbl} min-w-0`}>
            Alamat
            <input name="alamat" defaultValue={awal?.alamat} className={inp} style={inpStyle} />
          </label>
          <label className={`${lbl} min-w-0`}>
            RT/RW
            <input
              name="rtRw"
              inputMode="numeric"
              maxLength={7}
              value={rtRw}
              onChange={(e) => setRtRw(formatRtRw(e.target.value))}
              className={inp}
              style={inpStyle}
              placeholder="003/001"
            />
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
                  const batas = tglLahir ? batasDosis({}, kodeAktif, tglLahir) : undefined;
                  if (!varian) {
                    return (
                      <div key={d.kode} className="flex items-center gap-2.5 py-[5px]">
                        <span className="min-w-0 flex-1 text-[13px] font-bold">{d.nama}</span>
                        <InputTanggal
                          key={`tgl-${kodeAktif}`}
                          name={`vaksin__${kodeAktif}`}
                          min={batas?.min}
                          max={batas?.max}
                          defaultValue={awal?.vaksin?.[kodeAktif] ?? ""}
                          bungkus="relative inline-block w-[150px] shrink-0"
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
                      <InputTanggal
                        key={`tgl-${kodeAktif}`}
                        name={`vaksin__${kodeAktif}`}
                        min={batas?.min}
                        max={batas?.max}
                        defaultValue={awal?.vaksin?.[kodeAktif] ?? ""}
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
