import { catatTumbuh, daftarTumbuh } from "@/lib/tumbuh-actions";
import { getRefBB, getRefTB, statusGizi, statusTinggi } from "@/lib/tumbuh";
import { fmtTglId } from "@/lib/anak";

const WARNA = { normal: "var(--hijau)", kurang: "#a16207", lebih: "var(--merah)" } as const;

/** Bagian Tumbuh Kembang satu anak — dipakai di sisi KADER (detail anak) & ORTU (tab Tumbuh).
 *  Menampilkan status terakhir (z-score Kemenkes 2020), riwayat, dan form catat baru. */
export default async function TumbuhBagian({
  refAnak,
  jk,
  balik,
}: {
  refAnak: string;
  jk: string;
  balik: string;
}) {
  const data = await daftarTumbuh(refAnak);
  const akhir = data[data.length - 1];
  const stBB = akhir?.bb ? statusGizi(akhir.bb, getRefBB(jk, akhir.usiaBulan)) : null;
  const stTB = akhir?.tb ? statusTinggi(akhir.tb, getRefTB(jk, akhir.usiaBulan)) : null;

  const inp = "mt-1 w-full rounded-lg border border-[var(--garis)] px-3 py-2 text-sm";
  const lbl = "block text-xs font-semibold text-[var(--teks-sekunder)]";

  return (
    <section className="mt-4 rounded-2xl border border-[var(--garis)] bg-[var(--kartu)] p-4">
      <h2 className="text-sm font-extrabold text-[var(--teal-tua)]">📏 Tumbuh Kembang</h2>

      {akhir ? (
        <div className="mt-2 space-y-2">
          <p className="text-xs text-[var(--teks-sekunder)]">
            Terakhir diukur {fmtTglId(akhir.tgl)} (usia {akhir.usiaBulan} bln):{" "}
            {akhir.bb ? `BB ${akhir.bb} kg` : ""}{akhir.bb && akhir.tb ? " · " : ""}
            {akhir.tb ? `TB ${akhir.tb} cm` : ""}{akhir.lk ? ` · LK ${akhir.lk} cm` : ""}
          </p>
          {stBB && (
            <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "var(--bg)" }}>
              <span className="font-extrabold" style={{ color: WARNA[stBB.kls] }}>
                BB/U: {stBB.label}
              </span>{" "}
              <span className="text-[var(--teks-sekunder)]">— {stBB.saran}</span>
            </div>
          )}
          {stTB && (
            <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "var(--bg)" }}>
              <span className="font-extrabold" style={{ color: WARNA[stTB.kls] }}>
                TB/U: {stTB.label}
              </span>{" "}
              <span className="text-[var(--teks-sekunder)]">— {stTB.saran}</span>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-2 text-xs text-[var(--teks-sekunder)]">
          Belum ada pengukuran. Catat BB, TB, &amp; lingkar kepala tiap bulan!
        </p>
      )}

      {data.length > 1 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-bold text-[var(--teal-tua)]">
            Riwayat ({data.length} pengukuran)
          </summary>
          <div className="mt-2 space-y-1">
            {[...data].reverse().map((t) => (
              <div key={t.id} className="flex items-center justify-between text-xs">
                <span>
                  {fmtTglId(t.tgl)} · {t.usiaBulan} bln
                  <span className="ml-1 rounded bg-[var(--bg)] px-1 py-0.5 text-[10px] font-bold text-[var(--teks-sekunder)]">
                    {t.peranPencatat === "ORTU" ? "ortu" : "kader"}
                  </span>
                </span>
                <span className="text-[var(--teks-sekunder)]">
                  {t.bb ? `${t.bb}kg` : "—"} · {t.tb ? `${t.tb}cm` : "—"} · {t.lk ? `${t.lk}cm` : "—"}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}

      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-bold text-[var(--coral)]">
          + Catat pengukuran baru
        </summary>
        <form action={catatTumbuh} className="mt-2">
          <input type="hidden" name="ref" value={refAnak} />
          <input type="hidden" name="balik" value={balik} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <label className={lbl}>Tanggal ukur
              <input name="tgl" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className={inp} />
            </label>
            <label className={lbl}>BB (kg)
              <input name="bb" type="number" step="0.1" min="0" className={inp} placeholder="7.0" />
            </label>
            <label className={lbl}>TB (cm)
              <input name="tb" type="number" step="0.1" min="0" className={inp} placeholder="63" />
            </label>
            <label className={lbl}>LK (cm)
              <input name="lk" type="number" step="0.1" min="0" className={inp} placeholder="41" />
            </label>
          </div>
          <button className="mt-2 rounded-xl bg-[var(--teal)] px-4 py-2 text-xs font-bold text-white">
            Simpan pengukuran
          </button>
        </form>
      </details>
    </section>
  );
}
