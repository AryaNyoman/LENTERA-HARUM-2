import Link from "next/link";
import { notFound } from "next/navigation";
import { wajibUser } from "@/lib/sesi";
import { ambilAnak, hitungUsiaBulan, labelUsia, fmtTglId } from "@/lib/anak";
import {
  DOSIS_REGISTRY, UMUR_IDEAL, VARIAN_MEREK,
  adaDosis, dosisTakBerlaku, lengkap, SYARAT_IDL, SYARAT_IBL,
} from "@/lib/vaksin";
import { hapusAnakBaru, verifikasiAnak } from "@/lib/anak-actions";
import { daftarCentang, verifikasiCentang } from "@/lib/centang-actions";
import TumbuhBagian from "@/components/tumbuh-bagian";

/** Tanggal + label merek utk satu slot (memeriksa varian). */
function isiSlot(vaksin: Record<string, string>, kode: string): { tgl: string; merek?: string } | null {
  const varian = VARIAN_MEREK[kode];
  if (varian) {
    for (const v of varian) if (vaksin[v.kode]) return { tgl: vaksin[v.kode], merek: v.merek };
    return null;
  }
  return vaksin[kode] ? { tgl: vaksin[kode] } : null;
}

function emojiUsia(um: number): string {
  if (um === 0) return "👶";
  if (um <= 4) return "🍼";
  if (um <= 12) return "🩹";
  return "💉";
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
  const centang = await daftarCentang(anak.ref);
  const centangMap = new Map(centang.map((c) => [c.vaksinKode, c]));
  const menunggu = centang.filter((c) => !c.verified);
  const belumVerifOrtu = anak.olehOrtu && !anak.terverifikasi;

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
        <p className="mt-3 rounded-lg bg-[var(--merah-muda)] px-3 py-2 text-xs font-semibold text-[var(--merah-teks)]">{galat}</p>
      )}

      <section
        className="relative mt-3 rounded-[var(--r-kartu)] border-2 border-[var(--teal-pastel)] p-4"
        style={{ background: "linear-gradient(135deg,var(--teal-muda),#fff)", marginTop: belumVerifOrtu ? "22px" : "12px" }}
      >
        {belumVerifOrtu && (
          <span
            className="stiker"
            style={{ left: "16px", top: "-14px", background: "var(--verif)", color: "var(--verif-pekat)" }}
          >
            🟡 diisi ortu
          </span>
        )}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-judul text-lg font-extrabold">{anak.isi.nama}</h1>
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
            {idl && <span className="rounded bg-[var(--hijau-muda)] px-2 py-0.5 text-[11px] font-bold text-[var(--hijau-teks)]">IDL ✓</span>}
            {ibl && <span className="rounded bg-[var(--hijau-muda)] px-2 py-0.5 text-[11px] font-bold text-[var(--hijau-teks)]">IBL ✓</span>}
            <span
              className="rounded px-2 py-0.5 text-[11px] font-bold"
              style={{
                background: anak.sumber === "SIMPUS" ? "var(--bg)" : "var(--coral-muda)",
                color: anak.sumber === "SIMPUS" ? "var(--teks-sekunder)" : "var(--coral-gelap)",
              }}
            >
              {anak.sumber === "SIMPUS" ? "Data SIMPUS" : anak.status === "DRAF" ? "BARU — belum ekspor" : "BARU — diekspor"}
            </span>
            {anak.olehOrtu && anak.terverifikasi && (
              <span className="rounded-full border-[1.5px] px-2 py-0.5 text-[11px] font-bold" style={{ background: "var(--teal-muda)", color: "var(--teal-tua)", borderColor: "var(--teal-pastel)" }}>
                diisi ortu ✓
              </span>
            )}
          </div>
        </div>

        {anak.sumber === "BARU" ? (
          <>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/kader/anak-baru?ref=b:${anak.id}`} className="btn3d btn3d-teal px-4 py-2 text-xs">
              ✎ Edit data &amp; dosis
            </Link>
            <Link
              href={`/kader/anak/${anak.ref}/qr`}
              className="btn-garis border-2 px-4 py-2 text-xs text-[var(--coral-gelap)]"
              style={{ borderColor: "var(--coral)" }}
            >
              🔗 QR Orang Tua
            </Link>
            {anak.status === "DRAF" && (
              <form action={hapusAnakBaru}>
                <input type="hidden" name="id" value={anak.id} />
                <button className="btn-garis border-2 border-[var(--merah)] px-4 py-2 text-xs text-[var(--merah-teks)]">
                  Hapus
                </button>
              </form>
            )}
          </div>
          {belumVerifOrtu && (
            <div className="pop mt-3 rounded-2xl border-2 p-3" style={{ borderColor: "var(--verif-garis)", background: "var(--verif-muda)" }}>
              <p className="font-judul text-xs font-bold" style={{ color: "var(--verif-pekat)" }}>🟡 Diisi orang tua — belum diverifikasi</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--teks-sekunder)]">
                Anak ini didaftarkan sendiri oleh orang tua. Periksa datanya (cocokkan buku KIA,
                hindari duplikat dengan anak yang sudah ada). Setelah diverifikasi, anak bisa ikut Export SIMPUS.
              </p>
              <form action={verifikasiAnak} className="mt-2">
                <input type="hidden" name="id" value={anak.id} />
                <button className="btn3d btn3d-teal px-4 py-2 text-xs">✓ Verifikasi anak ini</button>
              </form>
            </div>
          )}
          </>
        ) : (
          <div className="mt-3">
            <Link
              href={`/kader/anak/${anak.ref}/qr`}
              className="btn-garis inline-block border-2 px-4 py-2 text-xs text-[var(--coral-gelap)]"
              style={{ borderColor: "var(--coral)" }}
            >
              🔗 QR Orang Tua
            </Link>
            <p className="mt-2 rounded-lg bg-[var(--teal-muda)] px-3 py-2 text-[11px] leading-relaxed text-[var(--teal-tua)]">
              Salinan dari SIMPUS (baca-saja). Perubahan dosis resmi dicatat lewat SIMPUS petugas.
            </p>
          </div>
        )}
      </section>

      <section className="mt-4">
        <h2 className="font-judul text-sm font-extrabold">Riwayat Imunisasi</h2>
        <div className="mt-2 space-y-3">
          {[...grup.entries()].map(([um, daftar]) => (
            <div key={um} className="rounded-2xl border-2 border-[var(--garis-kader)] bg-[var(--kartu)] p-3">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-[var(--teal-tua)]">
                {emojiUsia(um)} {um === 0 ? "Lahir" : `${um} bulan`}
              </p>
              <div className="mt-1.5 space-y-1">
                {daftar.map((d) => {
                  const takBerlaku = dosisTakBerlaku(d.kode, anak.isi.vaksin);
                  const slot = isiSlot(anak.isi.vaksin, d.kode);
                  const sudah = adaDosis(anak.isi.vaksin, d.kode);
                  const c = !sudah ? centangMap.get(d.kode) : undefined;
                  return (
                    <div key={d.kode} className="flex items-center justify-between gap-2 text-sm">
                      <span className={takBerlaku ? "text-[var(--teks-sekunder)] line-through opacity-60" : ""}>
                        {sudah ? "✅" : c ? (c.verified ? "🔵" : "🟡") : takBerlaku ? "➖" : "⬜"} {d.nama}
                        {slot?.merek && (
                          <span className="ml-1 rounded bg-[var(--bg)] px-1 py-0.5 text-[10px] font-bold text-[var(--teks-sekunder)]">
                            {slot.merek}
                          </span>
                        )}
                        {c && (
                          <span className="ml-1 rounded px-1 py-0.5 text-[10px] font-bold"
                            style={{ background: c.verified ? "var(--teal-muda)" : "var(--verif-muda)", color: c.verified ? "var(--teal-tua)" : "var(--verif-teks)" }}>
                            {c.verified ? "verifikasi kader" : "centang ortu"}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-xs text-[var(--teks-sekunder)]">
                        {takBerlaku ? "tak berlaku" : slot ? fmtTglId(slot.tgl) : c ? fmtTglId(c.tgl) : "belum"}
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

      {menunggu.length > 0 && (
        <section className="pop mt-4 rounded-2xl border-2 p-4" style={{ borderColor: "var(--verif-garis)", background: "var(--kartu)" }}>
          <h2 className="font-judul flex items-center gap-1.5 text-sm font-extrabold" style={{ color: "var(--verif-teks)" }}>
            <span style={{ display: "inline-block", animation: "wiggle 2s ease-in-out infinite" }}>🟡</span>
            Centang Orang Tua — menunggu verifikasi ({menunggu.length})
          </h2>
          <p className="mt-1 text-[11px] text-[var(--teks-sekunder)]">
            Orang tua menandai dosis ini diberikan di faskes lain. Verifikasi bila sesuai bukti
            (buku KIA/kartu), tolak bila tidak.
          </p>
          <div className="mt-2 space-y-2">
            {menunggu.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2 rounded-xl bg-[var(--bg)] px-3 py-2 text-sm">
                <span>
                  <b>{c.vaksinKode}</b> · {fmtTglId(c.tgl)}
                  {c.lokasi && <span className="text-[var(--teks-sekunder)]"> · {c.lokasi}</span>}
                </span>
                <span className="flex shrink-0 gap-1.5">
                  <form action={verifikasiCentang}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="aksi" value="terima" />
                    <button className="rounded-lg bg-[var(--teal)] px-3 py-1.5 text-[11px] font-bold text-white">
                      ✓ Verifikasi
                    </button>
                  </form>
                  <form action={verifikasiCentang}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="aksi" value="tolak" />
                    <button className="rounded-lg border border-[var(--merah)] px-3 py-1.5 text-[11px] font-bold text-[var(--merah-teks)]">
                      Tolak
                    </button>
                  </form>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <TumbuhBagian refAnak={anak.ref} jk={anak.isi.jk} balik={`/kader/anak/${anak.ref}`} />
    </main>
  );
}
