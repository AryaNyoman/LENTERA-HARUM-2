/* Panduan kader/ortu — kartu Pojok Baca, jadwal per usia, panduan per jenis vaksin
 * (accordion — konten di src/lib/panduan-vaksin.ts), lalu Catatan NTB paling bawah.
 * Teks aturan medis sesuai CLAUDE.md; kode vaksin mengikuti katalog kanonik.
 * Ilustrasi pakai <img> biasa (PNG kecil dari /public — tanpa optimizer, ringan utk HP). */
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { PANDUAN_VAKSIN, type PanduanVaksin } from "@/lib/panduan-vaksin";

const JADWAL = [
  { usia: "Lahir", isi: "HB0 (idealnya <24 jam, s.d. 7 hari)", img: "/gambar/bayi-baru-lahir.png" },
  { usia: "1 bulan", isi: "BCG + Polio tetes 1. BCG ideal usia 1 bln; >6 bln perlu uji tuberkulin dulu.", img: "/gambar/bayi-duduk.png" },
  { usia: "2 bulan", isi: "DPT-HB-Hib 1 (Penta/Hexa) + Polio tetes 2 + PCV 1 + Rotavirus 1. PCV dosis-1 mulai 2 bln (kejar s.d. 5 th).", img: "/gambar/vaksin-vial.png" },
  { usia: "3 bulan", isi: "DPT-HB-Hib 2 + Polio tetes 3 + PCV 2 + Rotavirus 2.", img: "/gambar/bayi-berdiri.png" },
  { usia: "4 bulan", isi: "DPT-HB-Hib 3 + Polio tetes 4 + IPV 1 + Rotavirus 3 (Rotavac; Rotarix cukup 2 dosis). Hexavalen sudah mengandung IPV.", img: "/gambar/bayi-berdiri.png" },
  { usia: "9 bulan", isi: "Campak-Rubella (MR) 1 + IPV 2.", img: "/gambar/baduta-jalan.png" },
  { usia: "12 bulan", isi: "PCV 3 (baduta).", img: "/gambar/baduta-jalan.png" },
  { usia: "18 bulan", isi: "DPT-HB-Hib Baduta (interval 12 bln dari dosis-3) + MR Baduta (interval 6 bln dari MR-1).", img: "/gambar/anak-laki.png" },
];

/** 4 seksi wajib per vaksin, berurutan — lihat PLAN-2026-07-16-lentera-harum.md § U3. */
const SEKSI: { kunci: keyof Omit<PanduanVaksin, "id" | "nama">; label: string }[] = [
  { kunci: "manfaat", label: "1) Manfaat & Tujuan Imunisasi" },
  { kunci: "pasca", label: "2) Edukasi Pasca Imunisasi" },
  { kunci: "batasUsia", label: "3) Batas Usia Pemberian" },
  { kunci: "kejar", label: "4) Panduan Kejar Imunisasi" },
];

export default function PanduanKonten({ peran = "kader" }: { peran?: "kader" | "ortu" }) {
  const ortu = peran === "ortu";
  const aksen = ortu ? "var(--coral-gelap)" : "var(--teal-gelap)";
  const kotak = ortu ? "var(--coral-muda)" : "var(--teal-muda)";
  const kartuBorder = ortu ? "var(--garis-ortu)" : "var(--garis-kader)";
  const hrefPojokBaca = ortu ? "/ortu/pojok-baca" : "/kader/pojok-baca";

  return (
    <div className="mx-auto max-w-md px-4 pt-3.5">
      <Link
        href={hrefPojokBaca}
        prefetch={false}
        className="pop pop-1 flex items-center gap-3 rounded-[22px] border-2 bg-[var(--kartu)] px-4 py-3.5 transition-transform active:scale-[.97]"
        style={{ borderColor: kartuBorder }}
      >
        <span className="shrink-0 text-[26px]">📚</span>
        <span className="min-w-0 flex-1">
          <span className="font-judul block text-sm font-bold" style={{ color: aksen }}>Pojok Baca Imun</span>
          <span className="block text-[11px] font-semibold leading-snug text-[var(--teks-sekunder)]">
            Jadwal hari imunisasi, pendaftaran BPJS, kontak petugas &amp; materi
          </span>
        </span>
      </Link>

      <section className="mt-4 flex flex-col gap-2">
        {JADWAL.map((j, i) => (
          <div
            key={j.usia}
            className={`pop pop-${Math.min(i + 2, 6)} flex items-center gap-3 rounded-[20px] border-2 bg-[var(--kartu)] px-3 py-2.5`}
            style={{ borderColor: kartuBorder }}
          >
            <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl" style={{ background: kotak }}>
              <img src={j.img} alt="" width={42} height={42} className="h-[42px] w-[42px] object-contain" />
            </div>
            <div className="min-w-0">
              <p className="font-judul text-sm font-bold" style={{ color: aksen }}>{j.usia}</p>
              <p className="text-[11px] font-semibold leading-relaxed text-[var(--teks-sekunder)]">{j.isi}</p>
            </div>
          </div>
        ))}
      </section>

      <h2 className="font-judul mt-5 text-base font-bold" style={{ color: aksen }}>Panduan per Jenis Vaksin 💉</h2>
      <section className="mt-2 flex flex-col gap-2">
        {PANDUAN_VAKSIN.map((v) => (
          <details
            key={v.id}
            className="group rounded-[20px] border-2 bg-[var(--kartu)] px-3.5 py-3"
            style={{ borderColor: kartuBorder }}
          >
            <summary className="flex cursor-pointer list-none items-center gap-2.5 [&::-webkit-details-marker]:hidden">
              <img src="/gambar/vaksin-vial.png" alt="" width={30} height={30} className="h-[30px] w-[30px] shrink-0 object-contain" />
              <span className="font-judul min-w-0 flex-1 text-[13px] font-bold" style={{ color: aksen }}>{v.nama}</span>
              <span className="shrink-0 text-[11px] font-semibold text-[var(--abu)] group-open:hidden">▾ buka</span>
              <span className="hidden shrink-0 text-[11px] font-semibold text-[var(--abu)] group-open:inline">▴ tutup</span>
            </summary>
            <div className="mt-2.5 flex flex-col gap-2.5 border-t-2 pt-2.5" style={{ borderColor: kartuBorder }}>
              {SEKSI.map((s) => (
                <div key={s.kunci}>
                  <p className="font-judul text-[10.5px] font-bold uppercase tracking-wide" style={{ color: aksen }}>{s.label}</p>
                  <p className="mt-0.5 text-[11px] font-semibold leading-relaxed text-[var(--teks-sekunder)]">{v[s.kunci]}</p>
                </div>
              ))}
            </div>
          </details>
        ))}
      </section>

      <section className="pop relative mb-5 mt-5 rounded-[22px] border-2 bg-[var(--kartu)] p-4" style={{ borderColor: "var(--kuning-border)" }}>
        <span
          className="font-judul absolute -top-[11px] left-3.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
          style={{ background: "var(--kuning)", color: "var(--kuning-gelap)", transform: "rotate(-1.5deg)" }}
        >
          penting!
        </span>
        <p className="font-judul mt-1 text-sm font-bold" style={{ color: "var(--kuning-teks)" }}>Catatan NTB</p>
        <ul className="mt-1.5 flex list-disc flex-col gap-1.5 pl-4 text-[11px] font-semibold leading-relaxed text-[var(--teks-3)]">
          <li><b>IDL 2026 (revisi):</b> HB0, BCG, Polio 1–4, DPT-HB-Hib 1–3, IPV1, MR. <b>PCV &amp; Rotavirus tidak dihitung</b> ke IDL (tetap dicatat &amp; tetap penting diberikan).</li>
          <li><b>IBL:</b> DPT-HB-Hib Baduta + MR Baduta (PCV3 tidak dihitung).</li>
          <li><b>JE</b> (Japanese Encephalitis) tidak tersedia gratis di NTB — hanya klinik <b style={{ color: "#d95f38" }}>SWASTA</b>, tidak masuk IDL/IBL.</li>
          <li><b>Hexavalen</b> (6-in-1) sudah mengandung IPV → tak perlu IPV terpisah. <b>Rotarix</b> cukup 2 dosis; <b>Rotavac</b> 3 dosis.</li>
        </ul>
      </section>
    </div>
  );
}
