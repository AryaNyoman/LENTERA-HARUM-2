/* Panduan kader/ortu — rangkuman jadwal & catatan NTB (diporting dari app KADER lama,
 * teks aturan medis sesuai CLAUDE.md; kode vaksin mengikuti katalog kanonik).
 * Ilustrasi pakai <img> biasa (PNG kecil dari /public — tanpa optimizer, ringan utk HP). */
/* eslint-disable @next/next/no-img-element */

const JADWAL = [
  { usia: "Lahir", isi: "HB0 (idealnya <24 jam, s.d. 7 hari)", img: "/gambar/bayi-baru-lahir.png" },
  { usia: "1 bulan", isi: "BCG + Polio tetes 1. BCG ideal usia 1 bln; >6 bln perlu uji tuberkulin dulu.", img: "/gambar/bayi-duduk.png" },
  { usia: "2 bulan", isi: "DPT-HB-Hib 1 (Penta/Hexa) + Polio tetes 2 + PCV 1 + Rotavirus 1. PCV dosis-1 mulai 2 bln (kejar s.d. 5 th).", img: "/gambar/bayi-duduk.png" },
  { usia: "3 bulan", isi: "DPT-HB-Hib 2 + Polio tetes 3 + PCV 2 + Rotavirus 2.", img: "/gambar/bayi-berdiri.png" },
  { usia: "4 bulan", isi: "DPT-HB-Hib 3 + Polio tetes 4 + IPV 1 + Rotavirus 3 (Rotavac; Rotarix cukup 2 dosis). Hexavalen sudah mengandung IPV.", img: "/gambar/bayi-berdiri.png" },
  { usia: "9 bulan", isi: "Campak-Rubella (MR) 1 + IPV 2.", img: "/gambar/baduta-jalan.png" },
  { usia: "12 bulan", isi: "PCV 3 (baduta).", img: "/gambar/baduta-jalan.png" },
  { usia: "18 bulan", isi: "DPT-HB-Hib Baduta (interval 12 bln dari dosis-3) + MR Baduta (interval 6 bln dari MR-1).", img: "/gambar/anak-laki.png" },
];

const EDUKASI = [
  { judul: "Demam setelah imunisasi", isi: "Reaksi wajar 1–2 hari. Kompres hangat, ASI lebih sering. Ke faskes bila >39°C / >2 hari.", img: "/gambar/edukasi-demam.png" },
  { judul: "Bengkak di bekas suntikan", isi: "Normal — kompres dingin, jangan dipijat. Hilang sendiri 2–3 hari.", img: "/gambar/edukasi-bengkak.png" },
  { judul: "Setelah vaksin tetes (OPV/Rotavirus)", isi: "Jangan beri makan/minum ±10 menit setelah tetes. Muntah banyak? Lapor petugas.", img: "/gambar/edukasi-tetes-oral.png" },
  { judul: "Benjolan bekas BCG", isi: "Benjolan kecil lalu luka kecil yang sembuh sendiri = tanda vaksin bekerja. Jangan dipencet.", img: "/gambar/edukasi-benjolan.png" },
];

export default function PanduanKonten({ peran = "kader" }: { peran?: "kader" | "ortu" }) {
  const aksen = peran === "ortu" ? "var(--coral-gelap)" : "var(--teal-tua)";
  const kotak = peran === "ortu" ? "var(--coral-muda)" : "var(--teal-muda)";
  const kartuBorder = peran === "ortu" ? "var(--coral-border)" : "var(--garis-kader)";

  return (
    <main className="mx-auto max-w-3xl px-4 py-5">
      <h1 className="font-judul text-lg font-extrabold" style={{ color: aksen }}>Panduan Imunisasi</h1>
      <p className="mt-0.5 text-xs text-[var(--teks-sekunder)]">
        Jadwal & catatan penting — konteks NTB / Puskesmas Cakranegara.
      </p>

      <section className="mt-4 space-y-2">
        {JADWAL.map((j) => (
          <div key={j.usia} className="flex items-center gap-3 rounded-2xl border-2 bg-[var(--kartu)] p-3" style={{ borderColor: kartuBorder }}>
            <img src={j.img} alt="" width={52} height={52} className="h-13 w-13 shrink-0 rounded-xl object-contain p-1.5" style={{ background: kotak }} />
            <div>
              <p className="font-judul text-sm font-extrabold" style={{ color: aksen }}>{j.usia}</p>
              <p className="text-xs leading-relaxed">{j.isi}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="pop mt-5 rounded-[var(--r-kartu)] border-2 p-4 text-xs leading-relaxed" style={{ borderColor: "var(--kuning-border)", background: "var(--kuning-muda)" }}>
        <p className="font-judul flex items-center gap-1.5 font-extrabold" style={{ color: "var(--kuning-teks)" }}>
          <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: "var(--kuning)", color: "var(--kuning-gelap)" }}>penting!</span>
          Catatan NTB
        </p>
        <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[var(--kuning-teks)]">
          <li><b>IDL 2026 (revisi):</b> HB0, BCG, Polio 1–4, DPT-HB-Hib 1–3, IPV1, MR. <b>PCV &amp; Rotavirus tidak dihitung</b> ke IDL (tetap dicatat &amp; tetap penting diberikan).</li>
          <li><b>IBL:</b> DPT-HB-Hib Baduta + MR Baduta (PCV3 tidak dihitung).</li>
          <li><b>JE</b> (Japanese Encephalitis) tidak tersedia gratis di NTB — hanya klinik <span className="font-bold">SWASTA</span>, tidak masuk IDL/IBL.</li>
          <li><b>Hexavalen</b> (6-in-1) sudah mengandung IPV → tidak perlu IPV terpisah. <b>Rotarix</b> cukup 2 dosis; <b>Rotavac</b> 3 dosis.</li>
        </ul>
      </section>

      <h2 className="font-judul mt-6 text-sm font-extrabold">Edukasi untuk Orang Tua</h2>
      <section className="mt-2 grid gap-2 sm:grid-cols-2">
        {EDUKASI.map((e) => (
          <div key={e.judul} className="flex items-start gap-3 rounded-2xl border-2 p-3" style={{ borderColor: kartuBorder, background: "var(--kartu)" }}>
            <img src={e.img} alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-xl object-contain p-1" style={{ background: kotak }} />
            <div>
              <p className="text-xs font-extrabold">{e.judul}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--teks-sekunder)]">{e.isi}</p>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
