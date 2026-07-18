/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import KepalaHalaman from "@/components/kepala-halaman";
import { wajibUser } from "@/lib/sesi";
import { ambilAnakOrtu } from "@/lib/ortu";
import { fmtTglId, hitungUsiaBulan, labelUsia } from "@/lib/anak";
import {
  DOSIS_REGISTRY, UMUR_IDEAL, VARIAN_MEREK,
  adaDosis, dosisTakBerlaku, lengkap, SYARAT_IDL, SYARAT_IBL,
} from "@/lib/vaksin";
import TumbuhBagian from "@/components/tumbuh-bagian";
import { daftarCentang } from "@/lib/centang-actions";

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

function alasanTakBerlaku(kode: string): string {
  return kode === "ROTA3" ? "Rotarix cukup 2" : "Hexa sudah mencakup";
}

function tambahBulanIso(iso: string, n: number): Date {
  const d = new Date(iso + "T00:00:00");
  d.setMonth(d.getMonth() + n);
  return d;
}

const CEK_HIJAU = (
  <span className="flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full bg-[var(--hijau)]">
    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
  </span>
);

export default async function DetailAnakOrtu({
  params,
  searchParams,
}: {
  params: Promise<{ ref: string }>;
  searchParams: Promise<{ galat?: string }>;
}) {
  const user = await wajibUser("ORTU", "ADMIN");
  const { ref } = await params;
  const { galat } = await searchParams;
  const anak = await ambilAnakOrtu(decodeURIComponent(ref), user);
  if (!anak) notFound();

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

  // grup terlambat paling awal (dapat stiker "waktunya kejar!")
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const grupTerlewat = [...grup.entries()]
    .filter(([um, daftar]) =>
      tambahBulanIso(anak.isi.tglLahir, um).getTime() < now.getTime() &&
      daftar.some((d) => !dosisTakBerlaku(d.kode, anak.isi.vaksin) && !adaDosis(anak.isi.vaksin, d.kode)),
    )
    .map(([um]) => um);
  const umKejar = grupTerlewat.length > 0 ? Math.min(...grupTerlewat) : -1;
  const umTerlambatSet = new Set(grupTerlewat);

  // kelompok mendatang terdekat (belum lengkap, belum terlambat) — ikut default terbuka
  const umBerikutnya = [...grup.entries()]
    .filter(([um, daftar]) =>
      !umTerlambatSet.has(um) &&
      daftar.some((d) => !dosisTakBerlaku(d.kode, anak.isi.vaksin) && !adaDosis(anak.isi.vaksin, d.kode)),
    )
    .map(([um]) => um)
    .sort((a, b) => a - b)[0] ?? -1;

  const usiaKini = labelUsia(hitungUsiaBulan(anak.isi.tglLahir));

  return (
    <main>
      <KepalaHalaman judul="Kartu Imunisasi 💳" sub="dari menu Anakku" balik="/ortu/anakku" peran="ortu" />

      <div className="mx-auto max-w-md px-4 pt-3.5">
        {galat && (
          <p className="mb-3 rounded-xl bg-[var(--merah-muda)] px-3 py-2 text-xs font-bold text-[var(--merah-teks)]">{galat}</p>
        )}
        <section className="pop overflow-hidden rounded-3xl border-2 border-[var(--coral-pastel)] bg-[var(--kartu)]">
          <div className="relative flex items-center gap-3 p-4" style={{ background: "linear-gradient(135deg,#fdf0e9,#fbe9dd)" }}>
            <span
              className="font-judul absolute right-3 top-2.5 rounded-full px-2 py-0.5 text-[9.5px] font-bold"
              style={{ background: "var(--verif)", color: "var(--verif-pekat)", transform: "rotate(3deg)" }}
            >
              {usiaKini}
            </span>
            <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full border-[3px] border-[var(--coral)] bg-white">
              <img src={anak.isi.jk === "P" ? "/gambar/anak-perempuan.png" : "/gambar/anak-laki.png"} alt="" width={46} height={46} className="h-[46px] w-[46px] object-contain" />
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <p className="font-judul text-lg font-bold leading-tight">{anak.isi.nama}</p>
              <p className="mt-0.5 text-[11px] font-semibold leading-relaxed text-[#8a6a5c]">
                {anak.isi.jk === "P" ? "Perempuan" : "Laki-laki"} · lahir {fmtTglId(anak.isi.tglLahir)}
                <br />
                {anak.posyanduLabel} · {anak.kelurahan}
              </p>
              {(idl || ibl) && (
                <p className="mt-1 flex gap-1">
                  {idl && <span className="rounded-md bg-[var(--hijau-muda)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--hijau-teks)]">IDL ✓</span>}
                  {ibl && <span className="rounded-md bg-[var(--hijau-muda)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--hijau-teks)]">IBL ✓</span>}
                </p>
              )}
            </div>
          </div>
          <div className="px-4 pb-3.5 pt-3">
            <div className="flex items-baseline justify-between">
              <p className="text-[11.5px] font-extrabold text-[var(--teks-3)]">Imunisasi {sudah} dari {relevan.length} dosis</p>
              <p className="font-judul text-sm font-bold" style={{ color: "#d95f38" }}>{persen}%</p>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-[#f6ece5]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${persen}%`,
                  background: persen >= 100 ? "var(--hijau)" : "linear-gradient(90deg,#e8704a,#f2b705)",
                  transformOrigin: "left",
                  animation: "slideBar .9s cubic-bezier(.22,1,.36,1) .2s both",
                }}
              />
            </div>
          </div>
        </section>

        <p className="mt-2.5 flex items-center gap-1.5 text-[10.5px] font-semibold leading-relaxed text-[var(--abu)]">
          <span aria-hidden>🔒</span> Tanggal vaksin diisi petugas puskesmas.
        </p>

        <div className="mt-3.5 flex flex-col gap-2.5">
          {[...grup.entries()].map(([um, daftar], gi) => {
            const kejar = um === umKejar;
            const relevanGrup = daftar.filter((d) => !dosisTakBerlaku(d.kode, anak.isi.vaksin));
            const sudahGrup = relevanGrup.filter((d) => adaDosis(anak.isi.vaksin, d.kode)).length;
            const bukaDefault = umTerlambatSet.has(um) || um === umBerikutnya;
            return (
              <details
                key={um}
                open={bukaDefault}
                className={`pop pop-${Math.min(gi + 1, 6)} group/g relative rounded-[20px] border-2 bg-[var(--kartu)] px-3.5 py-3 ${kejar ? "mt-1" : ""}`}
                style={{ borderColor: kejar ? "var(--merah-border)" : "var(--garis-ortu)" }}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
                  {kejar && (
                    <span
                      className="font-judul absolute -top-2.5 right-3 rounded-full bg-[var(--merah)] px-2.5 py-0.5 text-[9.5px] font-bold text-white"
                      style={{ transform: "rotate(1.5deg)" }}
                    >
                      waktunya kejar!
                    </span>
                  )}
                  <span className="font-judul text-xs font-bold text-[#c9a689]">
                    {emojiUsia(um)} {um === 0 ? "LAHIR" : `${um} BULAN`}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <span
                      className="font-judul rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                      style={
                        relevanGrup.length === 0
                          ? { background: "#f6f1ea", color: "var(--abu)" }
                          : sudahGrup === relevanGrup.length
                            ? { background: "var(--hijau-muda)", color: "var(--hijau-teks)" }
                            : { background: "var(--coral-muda)", color: "#d95f38" }
                      }
                    >
                      {sudahGrup}/{relevanGrup.length} ✓
                    </span>
                    <span className="font-judul text-[10px] font-bold text-[#c9a689]">
                      <span className="group-open/g:hidden">▾</span>
                      <span className="hidden group-open/g:inline">▴</span>
                    </span>
                  </span>
                </summary>
                <div className="mt-1.5">
                {daftar.map((d) => {
                  const takBerlaku = dosisTakBerlaku(d.kode, anak.isi.vaksin);
                  const slot = isiSlot(anak.isi.vaksin, d.kode);
                  const sudahD = adaDosis(anak.isi.vaksin, d.kode);
                  const c = !sudahD ? centangMap.get(d.kode) : undefined;
                  const telat = tambahBulanIso(anak.isi.tglLahir, um).getTime() < now.getTime();

                  if (takBerlaku) {
                    return (
                      <div key={d.kode} className="flex items-center gap-2 py-1">
                        <span className="flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full bg-[#f2ede6]">
                          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#bdb2a4" strokeWidth="3" strokeLinecap="round"><path d="M5 12h14" /></svg>
                        </span>
                        <span className="min-w-0 flex-1 text-[13px] font-semibold text-[#bdb2a4] line-through">{d.nama}</span>
                        <span className="font-judul shrink-0 rounded-md bg-[#f6f1ea] px-1.5 py-0.5 text-[10px] font-bold text-[var(--abu)]">
                          {alasanTakBerlaku(d.kode)}
                        </span>
                      </div>
                    );
                  }
                  if (sudahD) {
                    return (
                      <div key={d.kode} className="flex items-center gap-2 py-1">
                        {CEK_HIJAU}
                        <span className="min-w-0 flex-1 text-[13px] font-bold">
                          {d.nama}
                          {slot?.merek && (
                            <span className="font-judul ml-1.5 rounded-md bg-[var(--coral-muda)] px-1.5 py-0.5 text-[9.5px] font-bold text-[var(--coral-gelap)]">
                              {slot.merek}
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 text-[11px] font-semibold text-[var(--abu)]">{slot ? fmtTglId(slot.tgl) : ""}</span>
                      </div>
                    );
                  }
                  if (c && c.verified) {
                    // sudah diverifikasi kader — tanpa aksi, ortu tak bisa ubah/hapus lagi
                    return (
                      <div key={d.kode} className="flex items-center gap-2 py-1">
                        <span className="font-judul flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full text-xs font-extrabold" style={{ background: "var(--teal)", color: "#fff" }}>
                          !
                        </span>
                        <span className="min-w-0 flex-1 text-[13px] font-bold">
                          {d.nama}
                          <span className="font-judul ml-1.5 rounded-md px-1.5 py-0.5 text-[9.5px] font-bold" style={{ background: "var(--teal-muda)", color: "var(--teal-gelap)" }}>
                            ✓ diverifikasi kader
                          </span>
                        </span>
                        <span className="shrink-0 text-[11px] font-semibold text-[var(--abu)]">{fmtTglId(c.tgl)}</span>
                      </div>
                    );
                  }
                  if (c) {
                    // belum diverifikasi — riwayat saja (ortu tak lagi bisa ubah/hapus, kunci dosis)
                    return (
                      <div key={d.kode} className="flex items-center gap-2 py-1">
                        <span className="font-judul flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full text-xs font-extrabold" style={{ background: "var(--verif)", color: "var(--verif-pekat)" }}>
                          !
                        </span>
                        <span className="min-w-0 flex-1 text-[13px] font-bold">
                          {d.nama}
                          <span className="font-judul ml-1.5 rounded-md px-1.5 py-0.5 text-[9.5px] font-bold" style={{ background: "var(--verif-muda)", color: "var(--verif-teks)" }}>
                            🟡 menunggu verifikasi
                          </span>
                        </span>
                        <span className="shrink-0 text-[11px] font-semibold text-[var(--abu)]">{fmtTglId(c.tgl)}</span>
                      </div>
                    );
                  }
                  return (
                    <div key={d.kode} className="flex items-center gap-2 py-1">
                      <span
                        className="h-[19px] w-[19px] shrink-0 rounded-full border-2 border-dashed"
                        style={{ borderColor: telat ? "#e39a90" : "#e0cfc0", boxSizing: "border-box", background: telat ? "var(--merah-muda)" : "transparent" }}
                      />
                      <span className="min-w-0 flex-1 text-[13px] font-semibold text-[var(--teks-3)]">
                        {d.nama}
                        {um >= 9 && <span className="ml-1 text-[10px] font-semibold text-[var(--abu)]">{um} bln</span>}
                      </span>
                    </div>
                  );
                })}
                </div>
              </details>
            );
          })}
        </div>

        <TumbuhBagian refAnak={anak.ref} jk={anak.isi.jk} balik={`/ortu/anak/${anak.ref}`} />
      </div>
    </main>
  );
}
