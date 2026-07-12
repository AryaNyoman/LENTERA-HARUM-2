/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import KepalaHalaman from "@/components/kepala-halaman";
import { wajibUser } from "@/lib/sesi";
import { anakKlaim } from "@/lib/ortu";
import { hitungUsiaBulan, labelUsia } from "@/lib/anak";
import { DOSIS_REGISTRY, UMUR_IDEAL, adaDosis, dosisTakBerlaku } from "@/lib/vaksin";

const IKON_QR = (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M21 14v7h-7" />
  </svg>
);

function tambahBulanIso(iso: string, n: number): Date {
  const d = new Date(iso + "T00:00:00");
  d.setMonth(d.getMonth() + n);
  return d;
}

export default async function Anakku() {
  const user = await wajibUser("ORTU", "ADMIN");
  const daftar = await anakKlaim(user);
  const now = new Date(); now.setHours(0, 0, 0, 0);

  return (
    <main>
      <KepalaHalaman
        judul="Anakku 🧡"
        sub={daftar.length === 0 ? "belum ada anak terhubung" : `${daftar.length} anak terhubung`}
        peran="ortu"
        aksi={
          <span className="flex shrink-0 items-center gap-2">
            <Link
              href="/ortu/anak-baru"
              className="btn3d btn3d-coral flex h-[42px] items-center rounded-[14px] px-3 text-[12.5px]"
              style={{ boxShadow: "0 4px 0 var(--coral-tua)" }}
            >
              + Tambah anak
            </Link>
            <Link
              href="/ortu/klaim"
              className="btn-garis flex h-[42px] items-center gap-1.5 rounded-[14px] border-2 border-[var(--coral)] px-2.5 text-[12.5px]"
              style={{ color: "#d95f38" }}
            >
              {IKON_QR}
              <span className="hidden min-[360px]:inline">QR</span>
            </Link>
          </span>
        }
      />

      <div className="mx-auto max-w-md px-4 pt-4">
        {daftar.length === 0 && (
          <div className="pop rounded-[26px] border-2 border-[var(--garis-ortu)] bg-[var(--kartu)] px-5 py-6 text-center">
            <img
              src="/gambar/bayi-duduk.png" alt="" width={88} height={88}
              className="mx-auto h-[88px] w-[88px] object-contain"
              style={{ animation: "floaty 5.5s ease-in-out infinite" }}
            />
            <p className="font-judul mt-2.5 text-[17px] font-bold text-[var(--coral-gelap)]">Belum ada anak di sini</p>
            <p className="mt-1 text-[11.5px] font-semibold leading-relaxed text-[var(--teks-sekunder)]">
              Ada dua cara menghubungkan Si Kecil — pilih yang paling gampang untuk Bunda/Ayah:
            </p>
            <div className="mt-3.5 flex flex-col gap-2 text-left">
              <Link
                href="/ortu/anak-baru"
                className="flex items-center gap-3 rounded-[18px] border-2 border-[var(--coral-border)] bg-[var(--coral-muda)] px-3.5 py-3 transition-transform active:scale-[.97]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[var(--coral)] text-white" style={{ boxShadow: "0 3px 0 var(--coral-tua)" }}>
                  <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                </span>
                <span className="min-w-0">
                  <span className="font-judul block text-[13px] font-bold text-[var(--coral-gelap)]">Isi sendiri sekarang</span>
                  <span className="block text-[10.5px] font-semibold leading-snug text-[var(--teks-sekunder)]">
                    Tanpa perlu ke posyandu dulu — kader memverifikasi belakangan.
                  </span>
                </span>
              </Link>
              <Link
                href="/ortu/klaim"
                className="flex items-center gap-3 rounded-[18px] border-2 border-[var(--garis-kader)] bg-[#fbfdfc] px-3.5 py-3 transition-transform active:scale-[.97]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[var(--teal-muda)] text-[var(--teal-gelap)]">
                  {IKON_QR}
                </span>
                <span className="min-w-0">
                  <span className="font-judul block text-[13px] font-bold text-[var(--teal-gelap)]">Hubungkan dengan QR</span>
                  <span className="block text-[10.5px] font-semibold leading-snug text-[var(--teks-sekunder)]">
                    Kalau data anak sudah dicatat kader — minta kodenya saat kunjungan.
                  </span>
                </span>
              </Link>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {daftar.map((a) => {
            const usia = hitungUsiaBulan(a.isi.tglLahir, new Date());
            const relevan = DOSIS_REGISTRY.filter((d) => !dosisTakBerlaku(d.kode, a.isi.vaksin));
            const sudah = relevan.filter((d) => adaDosis(a.isi.vaksin, d.kode)).length;
            const menunggu = a.olehOrtu && !a.terverifikasi;

            // dosis berikutnya = jatuh tempo paling awal di antara yang belum
            const belum = relevan
              .filter((d) => !adaDosis(a.isi.vaksin, d.kode))
              .map((d) => ({ d, um: UMUR_IDEAL[d.kode] ?? 0, jt: tambahBulanIso(a.isi.tglLahir, UMUR_IDEAL[d.kode] ?? 0) }))
              .sort((x, y) => x.jt.getTime() - y.jt.getTime());
            const next = belum[0];
            const seKunjungan = next ? belum.filter((b) => b.um === next.um).length - 1 : 0;

            return (
              <Link
                key={a.ref}
                href={`/ortu/anak/${a.ref}`}
                className="pop block overflow-hidden rounded-3xl border-2 border-[var(--coral-pastel)] bg-[var(--kartu)] transition-transform active:scale-[.97]"
              >
                <div className="relative flex items-center gap-3.5 p-4" style={{ background: "linear-gradient(135deg,#fdf0e9,#fbe9dd)" }}>
                  <span
                    className="font-judul absolute right-3.5 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                    style={{
                      background: "var(--verif)", color: "var(--verif-pekat)",
                      transform: "rotate(3deg)", boxShadow: "0 3px 8px rgba(242,183,5,.35)",
                    }}
                  >
                    {menunggu ? "menunggu verifikasi kader" : labelUsia(usia)}
                  </span>
                  <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-full border-[3px] border-[var(--coral)] bg-white">
                    <img src={a.isi.jk === "P" ? "/gambar/anak-perempuan.png" : "/gambar/anak-laki.png"} alt="" width={52} height={52} className="h-[52px] w-[52px] object-contain" />
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5">
                    <p className="font-judul text-[19px] font-bold leading-tight">{a.isi.nama}</p>
                    <p className="mt-0.5 text-[11.5px] font-semibold text-[#8a6a5c]">{a.posyanduLabel}</p>
                  </div>
                </div>
                <div className="px-4 pb-4 pt-3.5">
                  <p className="mb-2 text-xs font-extrabold text-[var(--teks-3)]">
                    Perjalanan imunisasi — <span style={{ color: "#d95f38" }}>{sudah} dari {relevan.length} dosis</span> 💪
                  </p>
                  <div className="flex flex-wrap gap-[5px]">
                    {relevan.map((d, i) => {
                      const sudahD = adaDosis(a.isi.vaksin, d.kode);
                      const jt = tambahBulanIso(a.isi.tglLahir, UMUR_IDEAL[d.kode] ?? 0);
                      const tertunda = !sudahD && jt.getTime() < now.getTime();
                      return (
                        <span
                          key={d.kode}
                          title={d.nama}
                          className="inline-block h-4 w-4 rounded-full"
                          style={
                            sudahD
                              ? { background: "var(--hijau)", animation: `popIn .4s ${0.1 + i * 0.05}s both` }
                              : tertunda
                                ? { background: "var(--merah-muda)", border: "1.5px dashed #e39a90", boxSizing: "border-box" }
                                : { background: "#f4efe6" }
                          }
                        />
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[10px] font-semibold text-[var(--abu)]">
                    🟢 sudah · 🔴 putus-putus = tertunda · abu = belum waktunya
                  </p>
                  {next && (
                    <div className="mt-2.5 flex items-center gap-2 rounded-[14px] border-[1.5px] px-3 py-2" style={{ background: "var(--kuning-muda)", borderColor: "var(--kuning-border)" }}>
                      <span className="shrink-0 text-[15px]">🎯</span>
                      <p className="text-[11px] font-semibold leading-snug" style={{ color: "var(--kuning-teks)" }}>
                        <b>Berikutnya:</b> {next.d.nama}
                        {seKunjungan > 0 && <> + {seKunjungan} dosis lain</>} — datang ke posyandu ya!
                      </p>
                    </div>
                  )}
                  {menunggu && (
                    <p className="mt-2 text-[10.5px] font-semibold leading-snug text-[var(--abu)]">
                      Data isian Bunda/Ayah sudah tersimpan — kader akan mencocokkannya dengan buku KIA 🟡
                    </p>
                  )}
                </div>
              </Link>
            );
          })}

          {daftar.length > 0 && (
            <Link
              href="/ortu/klaim"
              className="pop pop-2 block rounded-3xl border-[2.5px] border-dashed border-[#ead9c4] px-4 py-5 text-center transition-colors hover:bg-white/70"
            >
              <p className="text-[26px]">👶✨</p>
              <p className="font-judul mt-1 text-sm font-bold text-[var(--coral-gelap)]">Hubungkan anak lagi</p>
              <p className="mt-0.5 text-[11px] font-semibold leading-snug text-[var(--abu)]">
                Minta kode QR ke kader posyandu, lalu pindai di sini
              </p>
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
