import type { ReactNode } from "react";
import { catatTumbuh, daftarTumbuh } from "@/lib/tumbuh-actions";
import { getRefBB, getRefTB, statusGizi, statusTinggi } from "@/lib/tumbuh";
import { fmtTglId } from "@/lib/anak";

const GAYA_KLS = {
  normal: { bg: "var(--hijau-muda)", fg: "var(--hijau-teks)", emoji: "🌟" },
  kurang: { bg: "var(--kuning-muda)", fg: "var(--kuning-teks)", emoji: "🌱" },
  lebih: { bg: "var(--merah-muda)", fg: "var(--merah-teks)", emoji: "⚠️" },
} as const;

function ChipStatus({ label, kls, saran }: { label: string; kls: keyof typeof GAYA_KLS; saran: string }) {
  const g = GAYA_KLS[kls];
  return (
    <div className="flex items-start gap-2 rounded-[13px] px-3 py-2" style={{ background: g.bg }}>
      <span className="shrink-0 text-sm">{g.emoji}</span>
      <p className="text-[11px] font-semibold leading-relaxed" style={{ color: g.fg }}>
        <b>{label}</b> — {saran}
      </p>
    </div>
  );
}

/** Bagian Tumbuh Kembang satu anak — dipakai di detail anak (KADER & ORTU, varian kompak)
 *  dan tab Tumbuh ortu (varian penuh: pil angka + form selalu terbuka).
 *  Status dihitung z-score Kemenkes 2020 dari lib (teks saran TIDAK diubah). */
export default async function TumbuhBagian({
  refAnak,
  jk,
  balik,
  penuh = false,
  kepala,
}: {
  refAnak: string;
  jk: string;
  balik: string;
  /** true = tab Tumbuh ortu: kartu angka (pil) + kartu form selalu terbuka. */
  penuh?: boolean;
  /** Baris identitas anak (avatar+nama) di atas kartu angka — hanya varian penuh. */
  kepala?: ReactNode;
}) {
  const data = await daftarTumbuh(refAnak);
  const akhir = data[data.length - 1];
  const stBB = akhir?.bb ? statusGizi(akhir.bb, getRefBB(jk, akhir.usiaBulan)) : null;
  const stTB = akhir?.tb ? statusTinggi(akhir.tb, getRefTB(jk, akhir.usiaBulan)) : null;

  const lbl = "block text-[11.5px] font-extrabold text-[var(--teks-3)]";
  const inp =
    "mt-1 h-[46px] w-full rounded-[14px] border-2 border-[#e2ece7] bg-[#fbfdfc] px-3 text-sm font-semibold outline-none transition-colors focus:border-[var(--teal)]";

  const riwayat = data.length > 1 && (
    <details className="mt-3">
      <summary className="font-judul cursor-pointer text-xs font-bold text-[var(--teal-tua)]">
        Riwayat ({data.length} pengukuran)
      </summary>
      <div className="mt-2 space-y-1">
        {[...data].reverse().map((t) => (
          <div key={t.id} className="flex items-center justify-between text-xs font-semibold">
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
  );

  const formIsi = (
    <form action={catatTumbuh}>
      <input type="hidden" name="ref" value={refAnak} />
      <input type="hidden" name="balik" value={balik} />
      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        <label className={lbl}>
          Tanggal ukur
          <input name="tgl" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className={inp} />
        </label>
        <label className={lbl}>
          Berat (kg)
          <input name="bb" type="number" step="0.1" min="0" className={inp} placeholder="7.0" />
        </label>
        <label className={lbl}>
          Tinggi (cm)
          <input name="tb" type="number" step="0.1" min="0" className={inp} placeholder="63" />
        </label>
        <label className={lbl}>
          L. kepala (cm)
          <input name="lk" type="number" step="0.1" min="0" className={inp} placeholder="41" />
        </label>
      </div>
      <button className="btn3d btn3d-teal mt-3 h-[50px] w-full text-[15px]">Simpan pengukuran</button>
      <p className="mt-2 text-center text-[10px] font-semibold text-[var(--abu)]">
        Status gizi dihitung otomatis (standar Kemenkes 2020)
      </p>
    </form>
  );

  if (penuh) {
    return (
      <>
        <section className="pop overflow-hidden rounded-3xl border-2 border-[var(--coral-pastel)] bg-[var(--kartu)]">
          {kepala}
          <div className="px-4 pb-4 pt-3.5">
            {akhir ? (
              <>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { n: akhir.bb, sat: " kg", l: "BERAT" },
                    { n: akhir.tb, sat: " cm", l: "TINGGI" },
                    { n: akhir.lk, sat: " cm", l: "L. KEPALA" },
                  ].map((k) => (
                    <div key={k.l} className="rounded-2xl bg-[var(--coral-muda)] px-1 py-2.5">
                      <p className="font-judul text-[19px] font-bold leading-none" style={{ color: "#d95f38" }}>
                        {k.n ?? "—"}
                        {k.n != null && <span className="text-[11px]">{k.sat}</span>}
                      </p>
                      <p className="mt-1 text-[9px] font-extrabold text-[var(--abu)]">{k.l}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-2.5 flex flex-col gap-1.5">
                  {stBB && <ChipStatus label={`BB/U: ${stBB.label}`} kls={stBB.kls} saran={stBB.saran} />}
                  {stTB && <ChipStatus label={`TB/U: ${stTB.label}`} kls={stTB.kls} saran={stTB.saran} />}
                </div>
              </>
            ) : (
              <p className="text-xs font-semibold leading-relaxed text-[var(--teks-sekunder)]">
                Belum ada pengukuran. Yuk catat BB, TB &amp; lingkar kepala tiap bulan!
              </p>
            )}
            {riwayat}
          </div>
        </section>

        <section className="pop pop-1 mt-3 rounded-3xl border-2 border-[var(--garis-kader)] bg-[var(--kartu)] p-4">
          <p className="font-judul text-[15px] font-bold text-[var(--teal-gelap)]">✏️ Catat pengukuran baru</p>
          <p className="mt-0.5 text-[10.5px] font-semibold leading-snug text-[var(--abu)]">
            Habis dari posyandu? Salin angka dari buku KIA ke sini.
          </p>
          {formIsi}
        </section>
      </>
    );
  }

  return (
    <section className="pop mt-4 rounded-[22px] border-2 border-[var(--garis-kader)] bg-[var(--kartu)] px-4 py-3.5">
      <h2 className="font-judul text-[15px] font-bold text-[var(--teal-gelap)]">📏 Tumbuh Kembang</h2>

      {akhir ? (
        <div className="mt-1.5">
          <p className="text-[11.5px] font-semibold leading-relaxed text-[var(--teks-sekunder)]">
            Terakhir diukur <b>{fmtTglId(akhir.tgl)}</b> ({akhir.usiaBulan} bln):{" "}
            {akhir.bb ? `BB ${akhir.bb} kg` : ""}{akhir.bb && akhir.tb ? " · " : ""}
            {akhir.tb ? `TB ${akhir.tb} cm` : ""}{akhir.lk ? ` · LK ${akhir.lk} cm` : ""}
          </p>
          <div className="mt-2 flex flex-col gap-1.5">
            {stBB && <ChipStatus label={`BB/U: ${stBB.label}`} kls={stBB.kls} saran={stBB.saran} />}
            {stTB && <ChipStatus label={`TB/U: ${stTB.label}`} kls={stTB.kls} saran={stTB.saran} />}
          </div>
        </div>
      ) : (
        <p className="mt-1.5 text-[11.5px] font-semibold leading-relaxed text-[var(--teks-sekunder)]">
          Belum ada pengukuran. Yuk catat BB, TB &amp; lingkar kepala tiap bulan!
        </p>
      )}

      {riwayat}

      <details className="mt-2.5">
        <summary className="btn-garis inline-flex h-[42px] cursor-pointer list-none items-center border-2 border-[var(--coral)] px-4 text-[12.5px] text-[#d95f38] [&::-webkit-details-marker]:hidden" style={{ borderRadius: "13px" }}>
          + Catat pengukuran
        </summary>
        {formIsi}
      </details>
    </section>
  );
}
