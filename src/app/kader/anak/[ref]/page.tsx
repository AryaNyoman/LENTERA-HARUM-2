/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import KepalaHalaman from "@/components/kepala-halaman";
import { wajibUser } from "@/lib/sesi";
import { db } from "@/lib/db";
import { ambilAnak, hitungUsiaBulan, labelUsia, fmtTglId } from "@/lib/anak";
import {
  DOSIS_REGISTRY, UMUR_IDEAL, VARIAN_MEREK,
  adaDosis, dosisTakBerlaku, lengkap, SYARAT_IDL, SYARAT_IBL,
} from "@/lib/vaksin";
import { batalkanSetor, hapusAnakBaru, verifikasiAnak } from "@/lib/anak-actions";
import { daftarCentang } from "@/lib/centang-actions";
import { putusKlaimKader } from "@/lib/klaim-actions";

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
  if (um === 0) return "👼";
  if (um === 1) return "🍼";
  if (um <= 4) return "🧸";
  return "🚶";
}

/** Alasan slot tak berlaku (presentasi; aturan medis dari lib). */
function alasanTakBerlaku(kode: string): string {
  return kode === "ROTA3" ? "Rotarix cukup 2" : "Hexa sudah mencakup";
}

/** Tombol putus tautan ortu↔anak — konfirmasi inline `<details>` (pola sama TombolHapus
 *  admin, src/app/admin/page.tsx). Hanya menghapus baris KlaimAnak; data anak TIDAK disentuh. */
function TombolPutusKlaim({ id, anakRef, namaOrtu }: { id: number; anakRef: string; namaOrtu: string }) {
  return (
    <details className="group/putus mt-1.5">
      <summary className="cursor-pointer list-none text-[10.5px] font-bold text-[var(--merah)] [&::-webkit-details-marker]:hidden">
        <span className="group-open/putus:hidden">🔗✂ Putuskan tautan</span>
        <span className="hidden group-open/putus:inline">▴ Batal</span>
      </summary>
      <div className="mt-1.5 rounded-xl bg-[var(--merah-muda)] p-2.5">
        <p className="text-[10px] font-semibold leading-snug text-[var(--merah-teks)]">
          Anak akan hilang dari aplikasi orang tua <b>{namaOrtu}</b>. Data anak TIDAK terhapus.
        </p>
        <form action={putusKlaimKader} className="mt-1.5">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="ref" value={anakRef} />
          <button className="h-8 w-full rounded-lg bg-[var(--merah)] text-[10.5px] font-bold text-white">
            Ya, putuskan tautan
          </button>
        </form>
      </div>
    </details>
  );
}

const CEK_HIJAU = (
  <span className="flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full bg-[var(--hijau)]">
    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
  </span>
);

export default async function DetailAnak({
  params,
  searchParams,
}: {
  params: Promise<{ ref: string }>;
  searchParams: Promise<{ galat?: string; ok?: string }>;
}) {
  const user = await wajibUser("KADER", "ADMIN");
  const { ref } = await params;
  const { galat, ok } = await searchParams;
  const anak = await ambilAnak(decodeURIComponent(ref), user);
  if (!anak) notFound();

  const usia = hitungUsiaBulan(anak.isi.tglLahir);
  const idl = lengkap(anak.isi.vaksin, SYARAT_IDL);
  const ibl = lengkap(anak.isi.vaksin, SYARAT_IBL);
  const centang = await daftarCentang(anak.ref);
  const centangMap = new Map(centang.map((c) => [c.vaksinKode, c]));
  const belumVerifOrtu = anak.olehOrtu && !anak.terverifikasi;
  const klaimOrtu = await db.klaimAnak.findMany({
    where: anak.sumber === "SIMPUS" ? { anakSimpusId: anak.id } : { anakBaruId: anak.id },
    include: { user: { select: { id: true, nama: true, noHp: true, username: true } } },
    orderBy: { dibuatPada: "asc" },
  });

  const relevan = DOSIS_REGISTRY.filter((d) => !dosisTakBerlaku(d.kode, anak.isi.vaksin));
  const nSudah = relevan.filter((d) => adaDosis(anak.isi.vaksin, d.kode)).length;

  // kelompokkan slot per umur ideal
  const grup = new Map<number, typeof DOSIS_REGISTRY>();
  for (const d of DOSIS_REGISTRY) {
    const um = UMUR_IDEAL[d.kode] ?? 0;
    grup.set(um, [...(grup.get(um) ?? []), d]);
  }

  const borderAvatar = belumVerifOrtu ? "var(--verif)" : anak.isi.jk === "P" ? "var(--coral)" : "var(--teal)";

  return (
    <main>
      <KepalaHalaman judul="Detail Anak" sub="dari Daftar Bayi" balik="/kader/daftar-bayi" />

      <div className="mx-auto max-w-md px-4 pt-3.5">
        {galat && (
          <p className="mb-3 rounded-xl bg-[var(--merah-muda)] px-3 py-2 text-xs font-bold text-[var(--merah-teks)]">{galat}</p>
        )}
        {ok && (
          <p className="mb-3 rounded-xl bg-[var(--hijau-muda)] px-3 py-2 text-xs font-bold text-[var(--hijau-teks)]">{ok}</p>
        )}

        <section
          className="pop overflow-hidden rounded-3xl border-2 bg-[var(--kartu)]"
          style={{ borderColor: belumVerifOrtu ? "var(--verif-garis)" : "var(--garis-kader)" }}
        >
          <div
            className="relative flex items-center gap-3 p-4"
            style={{ background: belumVerifOrtu ? "linear-gradient(135deg,#fdf9ec,#fdf6de)" : "linear-gradient(135deg,#e9f6f2,#def0ea)" }}
          >
            <span className="absolute right-3 top-2.5 flex gap-1.5">
              {anak.olehOrtu && (
                <span
                  className="font-judul rounded-full px-2 py-0.5 text-[9.5px] font-bold"
                  style={
                    anak.terverifikasi
                      ? { background: "var(--teal-muda)", color: "var(--teal-gelap)", border: "1.5px solid var(--teal-pastel)", transform: "rotate(-1.5deg)" }
                      : { background: "var(--verif)", color: "var(--verif-pekat)", transform: "rotate(2deg)" }
                  }
                >
                  {anak.terverifikasi ? "diisi ortu ✓" : "diisi ortu"}
                </span>
              )}
              {anak.sumber === "BARU" ? (
                <span
                  className="font-judul rounded-full px-2 py-0.5 text-[9.5px] font-bold text-white"
                  style={{ background: anak.status === "DRAF" ? "var(--coral)" : "var(--teal)", transform: "rotate(2deg)" }}
                >
                  {anak.status === "DRAF" ? "belum disetor" : "sudah disetor"}
                </span>
              ) : (
                <span className="font-judul rounded-full bg-white/80 px-2 py-0.5 text-[9.5px] font-bold text-[var(--teks-sekunder)]" style={{ transform: "rotate(2deg)" }}>
                  data SIMPUS
                </span>
              )}
            </span>
            <div
              className="flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-full bg-white"
              style={{ border: `3px solid ${borderAvatar}` }}
            >
              <img src={anak.isi.jk === "P" ? "/gambar/anak-perempuan.png" : "/gambar/anak-laki.png"} alt="" width={48} height={48} className="h-12 w-12 object-contain" />
            </div>
            <div className="min-w-0 flex-1 pt-2">
              <p className="font-judul text-lg font-bold leading-tight">{anak.isi.nama}</p>
              <p className="mt-0.5 text-[11px] font-semibold leading-relaxed text-[var(--teks-sekunder)]">
                {anak.isi.jk === "P" ? "Perempuan" : "Laki-laki"} · lahir {fmtTglId(anak.isi.tglLahir)} ·{" "}
                <b style={{ color: belumVerifOrtu ? "var(--verif-teks)" : "var(--teal-gelap)" }}>{labelUsia(usia)}</b>
                <br />
                {anak.posyanduLabel} · {anak.kelurahan}
                {anak.isi.namaOrtu && <> · ortu: {anak.isi.namaOrtu}</>}
                {anak.isi.noHp && <> · {anak.isi.noHp}</>}
                {anak.isi.nik && <> · NIK {anak.isi.nik}</>}
              </p>
              {(idl || ibl) && (
                <p className="mt-1 flex gap-1">
                  {idl && <span className="rounded-md bg-[var(--hijau-muda)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--hijau-teks)]">IDL ✓</span>}
                  {ibl && <span className="rounded-md bg-[var(--hijau-muda)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--hijau-teks)]">IBL ✓</span>}
                </p>
              )}
            </div>
          </div>

          {anak.sumber === "BARU" && anak.status === "DIEKSPOR" && (
            <div className="mx-3 mt-1 flex flex-wrap items-center gap-2 rounded-2xl px-3 py-2.5" style={{ background: "var(--kuning-muda)" }}>
              <p className="min-w-[150px] flex-1 text-[10.5px] font-semibold leading-snug" style={{ color: "var(--kuning-teks)" }}>
                Sudah disetor — terkunci dari edit/hapus. Keliru ikut export (mis. data uji)?
              </p>
              <form action={batalkanSetor}>
                <input type="hidden" name="id" value={anak.id} />
                <button className="btn-garis h-9 rounded-xl border-2 px-3 text-[11px]" style={{ borderColor: "var(--kuning-border)", color: "var(--kuning-teks)" }}>
                  ↩ Batalkan setor (jadikan draf)
                </button>
              </form>
            </div>
          )}
          {anak.sumber === "BARU" ? (
            <div className="flex gap-2 p-3">
              <Link href={`/kader/anak-baru?ref=b:${anak.id}`} prefetch={false} className="btn3d btn3d-teal flex h-[42px] flex-1 items-center justify-center rounded-[13px] text-[12.5px]" style={{ boxShadow: "0 4px 0 var(--teal-tua)" }}>
                ✎ Edit data
              </Link>
              <Link
                href={`/kader/anak/${anak.ref}/qr`}
                prefetch={false}
                className="btn-garis flex h-[42px] flex-1 items-center justify-center border-2 text-[12.5px]"
                style={{ borderColor: "var(--coral)", color: "#d95f38", borderRadius: "13px" }}
              >
                QR Orang Tua
              </Link>
              {anak.status === "DRAF" && (
                <form action={hapusAnakBaru}>
                  <input type="hidden" name="id" value={anak.id} />
                  <button
                    aria-label="Hapus anak"
                    title="Hapus"
                    className="btn-garis flex h-[42px] w-[42px] items-center justify-center border-2 border-[var(--merah-border)] text-[var(--merah)]"
                    style={{ borderRadius: "13px" }}
                  >
                    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" /></svg>
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="p-3">
              <Link
                href={`/kader/anak/${anak.ref}/qr`}
                prefetch={false}
                className="btn-garis flex h-[42px] items-center justify-center border-2 text-[12.5px]"
                style={{ borderColor: "var(--coral)", color: "#d95f38", borderRadius: "13px" }}
              >
                QR Orang Tua
              </Link>
              <p className="mt-2 rounded-xl bg-[var(--teal-muda)] px-3 py-2 text-[11px] font-semibold leading-relaxed text-[var(--teal-tua)]">
                Salinan dari SIMPUS (baca-saja). Perubahan dosis resmi dicatat lewat SIMPUS petugas.
              </p>
            </div>
          )}
        </section>

        {klaimOrtu.length > 0 && (
          <section className="pop pop-1 mt-4 rounded-[20px] border-2 border-[var(--garis-kader)] bg-[var(--kartu)] px-3.5 py-3">
            <p className="font-judul mb-1.5 text-xs font-bold text-[var(--abu)]">🔗 Terhubung dengan akun orang tua</p>
            <div className="flex flex-col gap-2">
              {klaimOrtu.map((k) => (
                <div key={k.id} className="rounded-xl bg-[#f7faf9] px-3 py-2">
                  <p className="min-w-0 truncate text-[12px] font-bold text-[var(--teks-3)]">
                    {k.user.nama}{" "}
                    <span className="font-semibold text-[var(--abu)]">· {k.user.noHp || k.user.username}</span>
                  </p>
                  <TombolPutusKlaim id={k.id} anakRef={anak.ref} namaOrtu={k.user.nama} />
                </div>
              ))}
            </div>
          </section>
        )}

        {belumVerifOrtu && (
          <section className="pop pop-1 relative mt-5 rounded-[22px] border-2 p-4" style={{ borderColor: "var(--verif-garis)", background: "var(--verif-muda)" }}>
            <span
              className="font-judul absolute -top-[11px] left-3.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
              style={{ background: "var(--verif)", color: "var(--verif-pekat)", transform: "rotate(-1.5deg)", animation: "wiggle 2.4s ease-in-out infinite" }}
            >
              perlu dicek!
            </span>
            <div className="mt-0.5 flex gap-2.5">
              <span className="shrink-0 text-[22px]">🟡</span>
              <div className="min-w-0 flex-1">
                <p className="font-judul text-[14.5px] font-bold" style={{ color: "var(--verif-teks)" }}>
                  Diisi orang tua — belum diverifikasi
                </p>
                <p className="mt-1 text-[11px] font-semibold leading-relaxed text-[var(--teks-sekunder)]">
                  Anak ini didaftarkan sendiri oleh <b>{anak.isi.namaOrtu || "orang tuanya"}</b>. Cocokkan dengan{" "}
                  <b>buku KIA</b> &amp; pastikan tidak duplikat dengan anak yang sudah ada. Setelah diverifikasi,
                  anak ikut Export SIMPUS.
                </p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <form action={verifikasiAnak} className="flex-1">
                <input type="hidden" name="id" value={anak.id} />
                <button className="btn3d btn3d-teal h-[46px] w-full rounded-[14px] text-sm">✓ Verifikasi anak ini</button>
              </form>
              <span className="max-w-[110px] shrink-0 text-[10px] font-semibold leading-snug" style={{ color: "var(--verif-teks)" }}>
                data cocok?<br />satu ketukan selesai
              </span>
            </div>
          </section>
        )}

        <div className="mt-4 flex items-center gap-2">
          <h2 className="font-judul text-base font-bold text-[var(--teal-gelap)]">Riwayat Imunisasi 💉</h2>
          <span className="font-judul rounded-full bg-[var(--teal-muda)] px-2 py-0.5 text-[10px] font-bold text-[var(--teal-gelap)]">
            {nSudah} dari {relevan.length} dosis
          </span>
        </div>
        <div className="mt-2 flex flex-col gap-2">
          {[...grup.entries()].map(([um, daftar], gi) => (
            <div key={um} className={`pop pop-${Math.min(gi + 1, 6)} rounded-[20px] border-2 border-[var(--garis-kader)] bg-[var(--kartu)] px-3.5 py-3`}>
              <p className="font-judul mb-1.5 text-xs font-bold text-[var(--abu)]">
                {emojiUsia(um)} {um === 0 ? "LAHIR" : `${um} BULAN`}
              </p>
              {daftar.map((d) => {
                const takBerlaku = dosisTakBerlaku(d.kode, anak.isi.vaksin);
                const slot = isiSlot(anak.isi.vaksin, d.kode);
                const sudahD = adaDosis(anak.isi.vaksin, d.kode);
                const c = !sudahD ? centangMap.get(d.kode) : undefined;
                return (
                  <div key={d.kode} className="flex items-center gap-2 py-[3px]">
                    {sudahD ? (
                      CEK_HIJAU
                    ) : c ? (
                      <span
                        className="font-judul flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full text-xs font-extrabold"
                        style={c.verified ? { background: "var(--teal)", color: "#fff" } : { background: "var(--verif)", color: "var(--verif-pekat)" }}
                      >
                        !
                      </span>
                    ) : takBerlaku ? (
                      <span className="flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full bg-[#edf1ef]">
                        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#a9b6b2" strokeWidth="3" strokeLinecap="round"><path d="M5 12h14" /></svg>
                      </span>
                    ) : (
                      <span className="h-[19px] w-[19px] shrink-0 rounded-full border-2 border-dashed border-[#c3d5cf]" style={{ boxSizing: "border-box" }} />
                    )}
                    <span className={`min-w-0 flex-1 text-[13px] ${sudahD ? "font-bold" : "font-semibold"} ${takBerlaku ? "text-[#a9b6b2] line-through" : sudahD ? "" : "text-[var(--teks-3)]"}`}>
                      {d.nama}
                      {slot?.merek && (
                        <span className="font-judul ml-1.5 rounded-md bg-[var(--teal-muda)] px-1.5 py-0.5 text-[9.5px] font-bold text-[var(--teal-gelap)] no-underline">
                          {slot.merek}
                        </span>
                      )}
                      {c && (
                        <span
                          className="font-judul ml-1.5 rounded-md px-1.5 py-0.5 text-[9.5px] font-bold"
                          style={c.verified ? { background: "var(--teal-muda)", color: "var(--teal-gelap)" } : { background: "var(--verif-muda)", color: "var(--verif-teks)" }}
                        >
                          {c.verified ? "verifikasi kader" : "centang ortu"}
                        </span>
                      )}
                    </span>
                    {takBerlaku ? (
                      <span className="font-judul shrink-0 rounded-md bg-[#f0f4f2] px-1.5 py-0.5 text-[10px] font-bold text-[var(--abu)]">
                        {alasanTakBerlaku(d.kode)}
                      </span>
                    ) : (
                      <span className="shrink-0 text-[11px] font-semibold" style={{ color: sudahD || c ? "var(--abu)" : "#c0ccc8" }}>
                        {slot ? fmtTglId(slot.tgl) : c ? fmtTglId(c.tgl) : "belum"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10.5px] font-semibold leading-relaxed text-[var(--abu)]">
          PCV &amp; Rotavirus tetap dicatat namun tidak dihitung ke IDL (definisi 2026).
        </p>
      </div>
    </main>
  );
}
