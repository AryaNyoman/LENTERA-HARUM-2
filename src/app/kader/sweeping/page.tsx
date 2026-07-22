import Link from "next/link";
import KepalaHalaman from "@/components/kepala-halaman";
import { wajibUser } from "@/lib/sesi";
import { db } from "@/lib/db";
import type { AnakView } from "@/lib/anak";
import { ambilAnakBinaan, binaanIds, fmtTglId, hitungUsiaBulan, kelompokUsia } from "@/lib/anak";
import type { BucketSweeping, DosisSasaran, JadwalRingkas } from "@/lib/sasaran";
import { kelompokkanJadwal, perluSasaran, dosisJatuhTempo, kelompokDosisPerJatah } from "@/lib/sasaran";
import { nomorInternasional } from "@/lib/pojok-baca";

const URUTAN_BUCKET: { kunci: BucketSweeping; judul: string; emoji: string; pesanKosong: string }[] = [
  { kunci: "hariIni", judul: "Hari Ini", emoji: "📍", pesanKosong: "Tidak ada jadwal posyandu hari ini." },
  { kunci: "besok", judul: "Besok (H-1)", emoji: "🔜", pesanKosong: "Tidak ada jadwal posyandu besok." },
  { kunci: "kemarin", judul: "Kemarin (Susulan)", emoji: "↩️", pesanKosong: "Tidak ada jadwal posyandu kemarin." },
];

const FILTER = [
  { u: "", label: "Semua" },
  { u: "0-11", label: "Bayi 0–11" },
  { u: "12-24", label: "Baduta" },
  { u: ">24", label: ">24 bln" },
] as const;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function labelPosyandu(p: { nama: string; namaPosyandu: string }): string {
  return p.namaPosyandu ? `${p.nama} (${p.namaPosyandu})` : p.nama;
}

function badgeDosis(d: DosisSasaran) {
  return (
    <span
      key={d.kode}
      className="rounded-md px-1.5 py-0.5 text-[9.5px] font-bold"
      style={
        d.status === "merah"
          ? { background: "var(--merah-muda)", color: "var(--merah-teks)" }
          : { background: "var(--kuning-muda)", color: "var(--kuning-teks)" }
      }
    >
      {d.nama}
    </span>
  );
}

export default async function Sweeping({
  searchParams,
}: {
  searchParams: Promise<{ u?: string }>;
}) {
  const user = await wajibUser("KADER", "ADMIN");
  const { u = "" } = await searchParams;
  const ids = await binaanIds(user);

  const [semuaAnak, jadwalRows, daftarPosyandu] = await Promise.all([
    ambilAnakBinaan(user),
    db.jadwalPosyandu.findMany({ where: { posyanduId: { in: ids } } }),
    db.posyandu.findMany({ where: { id: { in: ids } }, select: { id: true, nama: true, namaPosyandu: true } }),
  ]);

  const petaPosyandu = new Map(daftarPosyandu.map((p) => [p.id, p]));

  const now = new Date();
  const anak = u ? semuaAnak.filter((a) => kelompokUsia(hitungUsiaBulan(a.isi.tglLahir, now)) === u) : semuaAnak;
  const bucket = kelompokkanJadwal(jadwalRows, now);

  // Posyandu binaan yang sama sekali belum punya baris jadwal utk bulan berjalan (now) —
  // catatan terpisah, BUKAN bagian 3 bucket (bucket hanya soal hari-H/H-1/H+1, bukan "ada
  // jadwal atau tidak bulan ini").
  const bulanIni = now.getMonth() + 1;
  const tahunIni = now.getFullYear();
  const posyanduAdaJadwalBulanIni = new Set(
    jadwalRows.filter((j) => j.tahun === tahunIni && j.bulan === bulanIni).map((j) => j.posyanduId),
  );
  const posyanduTanpaJadwal = daftarPosyandu.filter((p) => !posyanduAdaJadwalBulanIni.has(p.id));

  // Tiap baris jadwal dlm bucket → anak posyandu itu yg perluSasaran pd tanggal sesi tsb,
  // lengkap dgn daftar dosis (utk badge kuning/merah). Dibangun sekali per bucket, dipakai
  // baik utk render maupun hitung total (hindari filter dobel).
  const bangunKartu = (baris: JadwalRingkas[]) =>
    baris.map((j) => {
      const tglSesiISO = `${j.tahun}-${pad2(j.bulan)}-${pad2(j.tanggal)}`;
      const anakDue = anak
        .filter((a) => a.posyanduId === j.posyanduId && perluSasaran(a.isi.vaksin, a.isi.tglLahir, tglSesiISO))
        .map((a) => ({ a, dosis: dosisJatuhTempo(a.isi.vaksin, a.isi.tglLahir, tglSesiISO) }));
      return { j, tglSesiISO, anakDue };
    });

  const kartuPerBucket = URUTAN_BUCKET.map(({ kunci, judul, emoji, pesanKosong }) => ({
    kunci, judul, emoji, pesanKosong, kartu: bangunKartu(bucket[kunci]),
  }));
  const totalDue = kartuPerBucket.reduce(
    (n, b) => n + b.kartu.reduce((m, k) => m + k.anakDue.length, 0), 0,
  );

  const barisAnak = (a: AnakView, dosis: DosisSasaran[]) => {
    const { terlihat, sisa } = kelompokDosisPerJatah(dosis);
    return (
      <div key={a.ref} className="border-t-[1.5px] border-[#eef4f1] py-2 first:border-t-0">
        <div className="flex items-center gap-2">
          <Link href={`/kader/anak/${a.ref}`} prefetch={false} className="min-w-0 flex-1">
            <p className="font-judul truncate text-[13px] font-bold">{a.isi.nama}</p>
          </Link>
          {a.isi.noHp && (
            <a
              href={`https://wa.me/${nomorInternasional(a.isi.noHp)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Chat WhatsApp orang tua ${a.isi.nama}`}
              className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center"
            >
              <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full" style={{ background: "var(--teal)" }}>
                <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </span>
            </a>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          {terlihat.map(badgeDosis)}
          {sisa.length > 0 && (
            <details className="group">
              <summary
                className="flex min-h-[44px] list-none cursor-pointer items-center gap-0.5 text-[9.5px] font-bold"
                style={{ color: "var(--teal-gelap)" }}
              >
                +{sisa.length} lagi
                <svg
                  viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  className="transition-transform group-open:rotate-180"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </summary>
              <div className="flex flex-wrap gap-1 pb-1">{sisa.map(badgeDosis)}</div>
            </details>
          )}
        </div>
      </div>
    );
  };

  return (
    <main>
      <KepalaHalaman
        judul="Sweeping 🧹"
        sub={`${totalDue} anak perlu disweeping · posyandu binaan Anda`}
      />

      <div className="mx-auto max-w-md px-4 pt-3.5">
        <div className="pop flex gap-2 overflow-x-auto pb-1">
          {FILTER.map((f) => {
            const aktif = u === f.u;
            const href = `/kader/sweeping?${new URLSearchParams(f.u ? { u: f.u } : {})}`;
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

        {kartuPerBucket.map(({ kunci, judul, emoji, pesanKosong, kartu }) => (
          <section key={kunci} className="mt-4">
            <p className="font-judul mb-1.5 text-[11px] font-bold tracking-wide text-[var(--teal-gelap)]">
              {emoji} {judul.toUpperCase()}
            </p>
            {kartu.length === 0 ? (
              <div className="pop rounded-[22px] border-[2.5px] border-dashed border-[#cfe2da] p-4 text-center">
                <p className="text-[11.5px] font-semibold leading-relaxed text-[var(--teks-sekunder)]">
                  {pesanKosong}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {kartu.map(({ j, tglSesiISO, anakDue }) => (
                  <div key={`${j.posyanduId}-${j.namaPosyandu}-${tglSesiISO}`} className="pop rounded-[22px] border-2 border-[var(--garis-kader)] bg-[var(--kartu)] p-3.5">
                    <p className="font-judul text-[13px] font-bold">{labelPosyandu(petaPosyandu.get(j.posyanduId) ?? { nama: "?", namaPosyandu: "" })}</p>
                    <p className="text-[10.5px] font-semibold text-[var(--abu)]">
                      {fmtTglId(tglSesiISO)}
                      {j.namaPosyandu && <> · {j.namaPosyandu}</>}
                    </p>
                    <div className="mt-1.5">
                      {anakDue.length === 0 ? (
                        <p className="text-[11px] font-semibold text-[var(--teks-sekunder)]">Tak ada sasaran.</p>
                      ) : (
                        anakDue.map(({ a, dosis }) => barisAnak(a, dosis))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}

        {posyanduTanpaJadwal.length > 0 && (
          <div className="pop mt-4 rounded-[22px] border-[2.5px] border-dashed border-[#cfe2da] p-4 text-center">
            <p className="text-[11.5px] font-semibold leading-relaxed text-[var(--teks-sekunder)]">
              <b className="text-[var(--teal-tua)]">Belum ada jadwal bulan ini</b> untuk:{" "}
              {posyanduTanpaJadwal.map(labelPosyandu).join(", ")}.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
