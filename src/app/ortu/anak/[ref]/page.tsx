import Link from "next/link";
import { notFound } from "next/navigation";
import { wajibUser } from "@/lib/sesi";
import { ambilAnakOrtu } from "@/lib/ortu";
import { hitungUsiaBulan, labelUsia, fmtTglId } from "@/lib/anak";
import {
  DOSIS_REGISTRY, UMUR_IDEAL, VARIAN_MEREK,
  adaDosis, dosisTakBerlaku, lengkap, SYARAT_IDL, SYARAT_IBL,
} from "@/lib/vaksin";
import TumbuhBagian from "@/components/tumbuh-bagian";
import { daftarCentang, tandaiOrtu } from "@/lib/centang-actions";

function isiSlot(vaksin: Record<string, string>, kode: string): { tgl: string; merek?: string } | null {
  const varian = VARIAN_MEREK[kode];
  if (varian) {
    for (const v of varian) if (vaksin[v.kode]) return { tgl: vaksin[v.kode], merek: v.merek };
    return null;
  }
  return vaksin[kode] ? { tgl: vaksin[kode] } : null;
}

export default async function DetailAnakOrtu({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const user = await wajibUser("ORTU", "ADMIN");
  const { ref } = await params;
  const anak = await ambilAnakOrtu(decodeURIComponent(ref), user);
  if (!anak) notFound();

  const usia = hitungUsiaBulan(anak.isi.tglLahir);
  const idl = lengkap(anak.isi.vaksin, SYARAT_IDL);
  const ibl = lengkap(anak.isi.vaksin, SYARAT_IBL);
  const centang = await daftarCentang(anak.ref);
  const centangMap = new Map(centang.map((c) => [c.vaksinKode, c]));
  const relevan = DOSIS_REGISTRY.filter((d) => !dosisTakBerlaku(d.kode, anak.isi.vaksin));
  const sudah = relevan.filter((d) => adaDosis(anak.isi.vaksin, d.kode)).length;
  const persen = Math.round((sudah / relevan.length) * 100);

  const grup = new Map<number, typeof DOSIS_REGISTRY>();
  for (const d of DOSIS_REGISTRY) {
    const um = UMUR_IDEAL[d.kode] ?? 0;
    grup.set(um, [...(grup.get(um) ?? []), d]);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-5">
      <Link href="/ortu/anakku" className="text-xs font-bold text-[var(--teks-sekunder)]">← Anakku</Link>

      <section
        className="mt-3 rounded-[var(--r-kartu)] border-2 border-[var(--coral-border)] p-4"
        style={{ background: "linear-gradient(135deg,var(--coral-muda),#fff)" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-judul text-lg font-extrabold">{anak.isi.nama}</h1>
            <p className="mt-0.5 text-xs text-[var(--teks-sekunder)]">
              {anak.isi.jk === "P" ? "Perempuan" : "Laki-laki"} · lahir {fmtTglId(anak.isi.tglLahir)} · {labelUsia(usia)}
            </p>
            <p className="mt-0.5 text-xs text-[var(--teks-sekunder)]">
              {anak.posyanduLabel} — {anak.kelurahan}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {idl && <span className="rounded bg-[var(--hijau-muda)] px-2 py-0.5 text-[11px] font-bold text-[var(--hijau-teks)]">IDL ✓</span>}
            {ibl && <span className="rounded bg-[var(--hijau-muda)] px-2 py-0.5 text-[11px] font-bold text-[var(--hijau-teks)]">IBL ✓</span>}
          </div>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-[11px] font-bold text-[var(--coral-gelap)]">
            <span>Imunisasi {sudah}/{relevan.length} dosis</span>
            <span>{persen}%</span>
          </div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full" style={{ width: `${persen}%`, background: persen >= 100 ? "var(--hijau)" : "var(--coral)" }} />
          </div>
        </div>
      </section>

      <section className="mt-4">
        <h2 className="font-judul text-sm font-extrabold">Kartu Imunisasi Digital</h2>
        <div className="mt-2 space-y-3">
          {[...grup.entries()].map(([um, daftar]) => (
            <div key={um} className="rounded-2xl border-2 border-[var(--garis-ortu)] bg-[var(--kartu)] p-3">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-[var(--coral-gelap)]">
                {um === 0 ? "Lahir" : `${um} bulan`}
              </p>
              <div className="mt-1.5 space-y-1">
                {daftar.map((d) => {
                  const takBerlaku = dosisTakBerlaku(d.kode, anak.isi.vaksin);
                  const slot = isiSlot(anak.isi.vaksin, d.kode);
                  const sudahD = adaDosis(anak.isi.vaksin, d.kode);
                  const c = !sudahD ? centangMap.get(d.kode) : undefined;
                  const bisaTandai = !sudahD && !takBerlaku && !c;
                  return (
                    <div key={d.kode} className="text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className={takBerlaku ? "text-[var(--teks-sekunder)] line-through opacity-60" : ""}>
                          {sudahD ? "✅" : c ? (c.verified ? "🔵" : "🟡") : takBerlaku ? "➖" : "⚪"} {d.nama}
                          {slot?.merek && (
                            <span className="ml-1 rounded bg-[var(--bg)] px-1 py-0.5 text-[10px] font-bold text-[var(--teks-sekunder)]">
                              {slot.merek}
                            </span>
                          )}
                          {c && (
                            <span className="ml-1 rounded px-1 py-0.5 text-[10px] font-bold"
                              style={{ background: c.verified ? "var(--teal-muda)" : "var(--verif-muda)", color: c.verified ? "var(--teal-tua)" : "var(--verif-teks)" }}>
                              {c.verified ? "✓ diverifikasi kader" : "menunggu verifikasi"}
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 text-xs text-[var(--teks-sekunder)]">
                          {takBerlaku ? "tak berlaku" : slot ? fmtTglId(slot.tgl) : c ? fmtTglId(c.tgl) : "belum"}
                        </span>
                      </div>
                      {bisaTandai && (
                        <details className="mt-0.5 pl-6">
                          <summary className="cursor-pointer text-[11px] font-bold text-[var(--coral)]">
                            tandai sudah ↗
                          </summary>
                          <form action={tandaiOrtu} className="mt-1.5 rounded-xl border-2 border-[var(--coral-border)] bg-[var(--coral-muda)] p-2.5">
                            <input type="hidden" name="ref" value={anak.ref} />
                            <input type="hidden" name="kode" value={d.kode} />
                            <div className="flex flex-wrap items-end gap-2">
                              <label className="text-[10px] font-semibold text-[var(--teks-sekunder)]">
                                Tanggal
                                <input name="tgl" type="date" className="mt-0.5 block rounded-lg border-2 border-[var(--garis)] bg-white px-2 py-1 text-xs" />
                              </label>
                              <label className="text-[10px] font-semibold text-[var(--teks-sekunder)]">
                                Tempat (mis. RS/klinik)
                                <input name="lokasi" className="mt-0.5 block rounded-lg border-2 border-[var(--garis)] bg-white px-2 py-1 text-xs" placeholder="Klinik Anugerah" />
                              </label>
                              <button className="btn3d btn3d-coral px-3 py-1.5 text-[11px]">Simpan</button>
                            </div>
                            <p className="mt-1.5 text-[10px] text-[var(--coral-gelap)]">
                              🟡 Akan berstatus menunggu sampai diverifikasi kader posyandu.
                            </p>
                          </form>
                        </details>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <TumbuhBagian refAnak={anak.ref} jk={anak.isi.jk} balik={`/ortu/anak/${anak.ref}`} />
    </main>
  );
}
