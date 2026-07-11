import Link from "next/link";
import { notFound } from "next/navigation";
import { wajibUser } from "@/lib/sesi";
import { ambilAnak, hitungUsiaBulan, labelUsia, fmtTglId } from "@/lib/anak";
import {
  DOSIS_REGISTRY, UMUR_IDEAL, VARIAN_MEREK,
  adaDosis, dosisTakBerlaku, lengkap, SYARAT_IDL, SYARAT_IBL,
} from "@/lib/vaksin";
import { hapusAnakBaru } from "@/lib/anak-actions";

/** Tanggal + label merek utk satu slot (memeriksa varian). */
function isiSlot(vaksin: Record<string, string>, kode: string): { tgl: string; merek?: string } | null {
  const varian = VARIAN_MEREK[kode];
  if (varian) {
    for (const v of varian) if (vaksin[v.kode]) return { tgl: vaksin[v.kode], merek: v.merek };
    return null;
  }
  return vaksin[kode] ? { tgl: vaksin[kode] } : null;
}

export default async function DetailAnak({
  params,
  searchParams,
}: {
  params: Promise<{ ref: string }>;
  searchParams: Promise<{ galat?: string }>;
}) {
  const user = await wajibUser("KADER", "ADMIN");
  const { ref } = await params;
  const { galat } = await searchParams;
  const anak = await ambilAnak(decodeURIComponent(ref), user);
  if (!anak) notFound();

  const usia = hitungUsiaBulan(anak.isi.tglLahir);
  const idl = lengkap(anak.isi.vaksin, SYARAT_IDL);
  const ibl = lengkap(anak.isi.vaksin, SYARAT_IBL);

  // kelompokkan slot per umur ideal
  const grup = new Map<number, typeof DOSIS_REGISTRY>();
  for (const d of DOSIS_REGISTRY) {
    const um = UMUR_IDEAL[d.kode] ?? 0;
    grup.set(um, [...(grup.get(um) ?? []), d]);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-5">
      <Link href="/kader/daftar-bayi" className="text-xs font-bold text-[var(--teks-sekunder)]">
        ← Daftar Bayi
      </Link>
      {galat && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-[var(--merah)]">{galat}</p>
      )}

      <section className="mt-3 rounded-2xl border border-[var(--garis)] bg-[var(--kartu)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-extrabold">{anak.isi.nama}</h1>
            <p className="mt-0.5 text-xs text-[var(--teks-sekunder)]">
              {anak.isi.jk === "P" ? "Perempuan" : "Laki-laki"} · lahir {fmtTglId(anak.isi.tglLahir)} ·{" "}
              {labelUsia(usia)}
            </p>
            <p className="mt-0.5 text-xs text-[var(--teks-sekunder)]">
              {anak.posyanduLabel} — {anak.kelurahan}
              {anak.isi.namaOrtu && <> · ortu: {anak.isi.namaOrtu}</>}
              {anak.isi.noHp && <> · {anak.isi.noHp}</>}
            </p>
            {anak.isi.nik && (
              <p className="mt-0.5 text-xs text-[var(--teks-sekunder)]">NIK: {anak.isi.nik}</p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {idl && <span className="rounded bg-green-50 px-2 py-0.5 text-[11px] font-bold text-[var(--hijau)]">IDL ✓</span>}
            {ibl && <span className="rounded bg-green-50 px-2 py-0.5 text-[11px] font-bold text-[var(--hijau)]">IBL ✓</span>}
            <span
              className="rounded px-2 py-0.5 text-[11px] font-bold"
              style={{
                background: anak.sumber === "SIMPUS" ? "var(--bg)" : "var(--coral-muda)",
                color: anak.sumber === "SIMPUS" ? "var(--teks-sekunder)" : "var(--coral)",
              }}
            >
              {anak.sumber === "SIMPUS" ? "Data SIMPUS" : anak.status === "DRAF" ? "BARU — belum ekspor" : "BARU — diekspor"}
            </span>
          </div>
        </div>

        {anak.sumber === "BARU" ? (
          <div className="mt-3 flex gap-2">
            <Link
              href={`/kader/anak-baru?ref=b:${anak.id}`}
              className="rounded-xl bg-[var(--teal)] px-4 py-2 text-xs font-bold text-white"
            >
              ✎ Edit data & dosis
            </Link>
            {anak.status === "DRAF" && (
              <form action={hapusAnakBaru}>
                <input type="hidden" name="id" value={anak.id} />
                <button className="rounded-xl border border-[var(--merah)] px-4 py-2 text-xs font-bold text-[var(--merah)]">
                  Hapus
                </button>
              </form>
            )}
          </div>
        ) : (
          <p className="mt-3 rounded-lg bg-[var(--teal-muda)] px-3 py-2 text-[11px] leading-relaxed text-[var(--teal-tua)]">
            Salinan dari SIMPUS (baca-saja). Perubahan dosis resmi dicatat lewat SIMPUS petugas;
            centang orang tua &amp; verifikasi kader menyusul di Tahap 6.
          </p>
        )}
      </section>

      <section className="mt-4">
        <h2 className="text-sm font-extrabold">Riwayat Imunisasi</h2>
        <div className="mt-2 space-y-3">
          {[...grup.entries()].map(([um, daftar]) => (
            <div key={um} className="rounded-2xl border border-[var(--garis)] bg-[var(--kartu)] p-3">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-[var(--teal-tua)]">
                {um === 0 ? "Lahir" : `${um} bulan`}
              </p>
              <div className="mt-1.5 space-y-1">
                {daftar.map((d) => {
                  const takBerlaku = dosisTakBerlaku(d.kode, anak.isi.vaksin);
                  const slot = isiSlot(anak.isi.vaksin, d.kode);
                  const sudah = adaDosis(anak.isi.vaksin, d.kode);
                  return (
                    <div key={d.kode} className="flex items-center justify-between gap-2 text-sm">
                      <span className={takBerlaku ? "text-[var(--teks-sekunder)] line-through opacity-60" : ""}>
                        {sudah ? "✅" : takBerlaku ? "➖" : "⬜"} {d.nama}
                        {slot?.merek && (
                          <span className="ml-1 rounded bg-[var(--bg)] px-1 py-0.5 text-[10px] font-bold text-[var(--teks-sekunder)]">
                            {slot.merek}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-xs text-[var(--teks-sekunder)]">
                        {takBerlaku ? "tak berlaku" : slot ? fmtTglId(slot.tgl) : "belum"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-[var(--teks-sekunder)]">
          ➖ = dosis tak berlaku untuk anak ini (Rotarix cukup 2 dosis; Hexavalen sudah mengandung
          IPV). PCV &amp; Rotavirus tetap dicatat namun tidak dihitung ke IDL (definisi 2026).
        </p>
      </section>
    </main>
  );
}
