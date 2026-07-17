/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import KepalaHalaman from "@/components/kepala-halaman";
import { wajibUser } from "@/lib/sesi";
import type { AnakView } from "@/lib/anak";
import { ambilAnakBinaan, hitungUsiaBulan, kelompokUsia, labelUsia } from "@/lib/anak";
import { DOSIS_REGISTRY, adaDosis, dosisTakBerlaku, lengkap, SYARAT_IDL, SYARAT_IBL } from "@/lib/vaksin";

const FILTER = [
  { u: "", label: "Semua" },
  { u: "0-11", label: "Bayi 0–11" },
  { u: "12-24", label: "Baduta" },
  { u: ">24", label: ">24 bln" },
] as const;

export default async function DaftarBayi({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; u?: string }>;
}) {
  const user = await wajibUser("KADER", "ADMIN");
  const { q = "", u = "" } = await searchParams;
  const semua = await ambilAnakBinaan(user);

  const now = new Date();
  const kata = q.trim().toLowerCase();
  const daftar = semua.filter((a) => {
    if (u && kelompokUsia(hitungUsiaBulan(a.isi.tglLahir, now)) !== u) return false;
    if (!kata) return true;
    return (
      a.isi.nama.toLowerCase().includes(kata) ||
      a.isi.namaOrtu.toLowerCase().includes(kata) ||
      (a.isi.nik && a.isi.nik.includes(kata))
    );
  });
  const perluVerif = semua.filter((a) => a.olehOrtu && !a.terverifikasi).length;

  // Kelompokkan: isian ortu belum diverifikasi PALING ATAS (sorotan), lalu anak biasa,
  // lalu yang sudah IDL/IBL dilipat di bawah (tak butuh perhatian harian).
  const grupVerif = daftar.filter((a) => a.olehOrtu && !a.terverifikasi);
  const grupSelesai = daftar.filter(
    (a) => !(a.olehOrtu && !a.terverifikasi) &&
      (lengkap(a.isi.vaksin, SYARAT_IDL) || lengkap(a.isi.vaksin, SYARAT_IBL)),
  );
  const grupBiasa = daftar.filter((a) => !grupVerif.includes(a) && !grupSelesai.includes(a));

  const kartuAnak = (a: AnakView, i: number) => {
    const usia = hitungUsiaBulan(a.isi.tglLahir, now);
    const relevan = DOSIS_REGISTRY.filter((d) => !dosisTakBerlaku(d.kode, a.isi.vaksin));
    const sudah = relevan.filter((d) => adaDosis(a.isi.vaksin, d.kode)).length;
    const persen = Math.round((sudah / relevan.length) * 100);
    const gradasi = persen >= 100 ? "linear-gradient(90deg,#3b9e4d,#3b9e4d)" : persen < 25 ? "linear-gradient(90deg,#e8704a,#f2b705)" : "linear-gradient(90deg,#f2b705,#3b9e4d)";
    const warnaAngka = persen >= 100 ? "var(--hijau-teks)" : persen < 25 ? "#d95f38" : "#a16207";
    const perluV = a.olehOrtu && !a.terverifikasi;
    const belumSetor = a.sumber === "BARU" && a.status === "DRAF";
    const rot = i % 2 === 0 ? "rotate(2deg)" : "rotate(-2deg)";
    return (
      <Link
        key={a.ref}
        href={`/kader/anak/${a.ref}`}
        prefetch={false}
        className="pop relative mt-1 flex items-center gap-3 rounded-[22px] border-2 bg-[var(--kartu)] p-3.5 transition-transform active:scale-[.97]"
        style={{ borderColor: perluV ? "var(--verif-garis)" : "var(--garis-kader)" }}
      >
        <span className="absolute -top-2.5 right-3.5 flex gap-1.5">
          {a.olehOrtu && (
            <span
              className="font-judul rounded-full px-2.5 py-0.5 text-[10px] font-bold"
              style={
                a.terverifikasi
                  ? { background: "var(--teal-muda)", color: "var(--teal-gelap)", border: "1.5px solid var(--teal-pastel)", transform: "rotate(-1.5deg)" }
                  : { background: "var(--verif)", color: "var(--verif-pekat)", transform: rot, boxShadow: "0 3px 8px rgba(242,183,5,.35)" }
              }
            >
              {a.terverifikasi ? "diisi ortu ✓" : "diisi ortu · perlu verifikasi"}
            </span>
          )}
          {belumSetor && !perluV && (
            <span
              className="font-judul rounded-full bg-[var(--coral)] px-2.5 py-0.5 text-[10px] font-bold text-white"
              style={{ transform: rot, boxShadow: "0 3px 8px rgba(232,112,74,.3)" }}
            >
              belum disetor
            </span>
          )}
        </span>
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full"
          style={
            perluV
              ? { background: "var(--verif-muda)", border: "3px solid var(--verif)" }
              : a.isi.jk === "P"
                ? { background: "var(--coral-muda)", border: "3px solid var(--coral)" }
                : { background: "var(--teal-muda)", border: "3px solid var(--teal)" }
          }
        >
          <img src={a.isi.jk === "P" ? "/gambar/anak-perempuan.png" : "/gambar/anak-laki.png"} alt="" width={44} height={44} className="h-11 w-11 object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-judul truncate text-base font-bold">{a.isi.nama}</p>
          <p className="truncate text-[11px] font-semibold text-[var(--abu)]">
            {a.isi.jk === "P" ? "Perempuan" : "Laki-laki"} · {labelUsia(usia)}
            {a.isi.namaOrtu && <> · ortu: {a.isi.namaOrtu}</>}
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-[9px] flex-1 overflow-hidden rounded-full bg-[#f0f5f2]">
              <div
                className="h-full rounded-full"
                style={{ width: `${persen}%`, background: gradasi, transformOrigin: "left", animation: "slideBar .8s .3s both" }}
              />
            </div>
            <span className="font-judul shrink-0 text-[11px] font-bold" style={{ color: warnaAngka }}>
              {sudah}/{relevan.length}
            </span>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <main>
      <KepalaHalaman
        judul="Daftar Bayi 👶"
        sub={`${daftar.length}${daftar.length !== semua.length ? ` dari ${semua.length}` : ""} anak · posyandu binaan Anda`}
        aksi={
          <span className="flex shrink-0 items-center gap-2">
            <a
              href="/kader/export"
              className="btn-garis flex h-10 items-center rounded-[14px] border-2 border-[var(--teal)] px-3 text-xs text-[var(--teal-tua)]"
            >
              ⬇<span className="ml-1 hidden min-[360px]:inline"> Export</span>
            </a>
            <Link
              href="/kader/anak-baru"
              prefetch={false}
              aria-label="Daftarkan anak baru"
              className="btn3d btn3d-coral flex h-10 w-10 items-center justify-center rounded-[14px] text-xl"
              style={{ boxShadow: "0 4px 0 var(--coral-tua)" }}
            >
              +
            </Link>
          </span>
        }
      />

      <div className="mx-auto max-w-md px-4 pt-3.5">
        <form action="/kader/daftar-bayi" method="get" className="pop flex h-12 items-center gap-2.5 rounded-full border-2 border-[#e2ece7] bg-[var(--kartu)] px-4">
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="var(--abu)" strokeWidth="2.4" strokeLinecap="round" className="shrink-0">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            name="q"
            defaultValue={q}
            placeholder="Cari nama anak / ortu / NIK…"
            className="w-full bg-transparent text-sm font-semibold outline-none"
          />
          {u && <input type="hidden" name="u" value={u} />}
        </form>

        <div className="pop pop-1 mt-2.5 flex gap-2 overflow-x-auto pb-1">
          {FILTER.map((f) => {
            const aktif = u === f.u;
            const href = `/kader/daftar-bayi?${new URLSearchParams({ ...(kata ? { q } : {}), ...(f.u ? { u: f.u } : {}) })}`;
            return (
              <Link
                key={f.label}
                href={href}
                prefetch={false}
                className="font-judul flex h-[34px] shrink-0 items-center rounded-full px-4 text-xs font-bold"
                style={
                  aktif
                    ? { background: "var(--teal)", color: "#fff", boxShadow: "0 3px 0 var(--teal-tua)" }
                    : { background: "var(--kartu)", border: "2px solid #e2ece7", color: "var(--teks-sekunder)" }
                }
              >
                {f.label}
              </Link>
            );
          })}
        </div>

        {perluVerif > 0 && (
          <div className="pop pop-2 mt-3 flex items-center gap-2.5 rounded-2xl border-[1.5px] px-3.5 py-2.5" style={{ background: "var(--verif-muda)", borderColor: "var(--verif-garis)" }}>
            <span className="shrink-0 text-base" style={{ display: "inline-block", animation: "wiggle 2.4s ease-in-out infinite" }}>🟡</span>
            <p className="text-[11px] font-semibold leading-snug text-[var(--verif-teks)]">
              <b>{perluVerif} anak isian ortu menunggu verifikasi</b> — buka kartunya untuk memeriksa.
              Anak belum terverifikasi tidak ikut Export SIMPUS.
            </p>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3">
          {daftar.length === 0 && (
            <div className="pop rounded-[22px] border-[2.5px] border-dashed border-[#cfe2da] p-5 text-center">
              <img src={semua.length === 0 ? "/gambar/bayi-duduk.png" : "/gambar/anak-perempuan.png"} alt="" width={46} height={46} className="mx-auto mb-1.5 h-[46px] w-[46px] object-contain" />
              <p className="text-[11.5px] font-semibold leading-relaxed text-[var(--teks-sekunder)]">
                {semua.length === 0
                  ? "Belum ada anak. Daftarkan anak baru, atau tunggu tarikan data SIMPUS."
                  : "Tidak ketemu… coba kata lain ya."}
              </p>
            </div>
          )}
          {grupVerif.length > 0 && (
            <section>
              <p className="font-judul mb-1 text-[11px] font-bold tracking-wide" style={{ color: "var(--verif-teks)" }}>
                🟡 MENUNGGU VERIFIKASI ({grupVerif.length})
              </p>
              <div className="flex flex-col gap-3">{grupVerif.map(kartuAnak)}</div>
            </section>
          )}

          {grupBiasa.length > 0 && (
            <div className="flex flex-col gap-3">{grupBiasa.map(kartuAnak)}</div>
          )}

          {grupSelesai.length > 0 && (
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-2xl border-2 border-[var(--hijau-border)] bg-[var(--hijau-muda)] px-3.5 py-3 [&::-webkit-details-marker]:hidden">
                <span className="text-base">✅</span>
                <span className="font-judul min-w-0 flex-1 text-[13px] font-bold text-[var(--hijau-teks)]">
                  Sudah IDL / IBL ({grupSelesai.length})
                </span>
                <span className="font-judul shrink-0 text-xs font-bold text-[var(--hijau-teks)]">
                  <span className="group-open:hidden">buka ▾</span>
                  <span className="hidden group-open:inline">tutup ▴</span>
                </span>
              </summary>
              <div className="mt-2 flex flex-col gap-3">{grupSelesai.map(kartuAnak)}</div>
            </details>
          )}

          <div className="pop rounded-[22px] border-[2.5px] border-dashed border-[#cfe2da] p-4 text-center">
            <img src="/gambar/puskesmas.png" alt="" width={46} height={46} className="mx-auto mb-1.5 h-[46px] w-[46px] object-contain" />
            <p className="text-[11.5px] font-semibold leading-relaxed text-[var(--teks-sekunder)]">
              Anak dari SIMPUS akan muncul otomatis setelah petugas menarik data.{" "}
              <b className="text-[var(--teal-tua)]">Tak perlu daftar ulang ya!</b>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
