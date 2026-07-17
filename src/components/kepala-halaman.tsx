import Link from "next/link";
import type { ReactNode } from "react";

/** Header putih halaman-dalam (non-hero): tombol back opsional + judul + sub + aksi kanan.
 *  Warna judul & garis mengikuti peran (kader teal · ortu coral). */
export default function KepalaHalaman({
  judul,
  sub,
  balik,
  aksi,
  peran = "kader",
}: {
  judul: ReactNode;
  sub?: ReactNode;
  balik?: string;
  aksi?: ReactNode;
  peran?: "kader" | "ortu";
}) {
  const garis = peran === "ortu" ? "#f6ece2" : "#ecf3ef";
  const borderBack = peran === "ortu" ? "var(--garis-ortu)" : "#e2ece7";
  const warnaJudul = peran === "ortu" ? "var(--coral-gelap)" : "var(--teal-gelap)";
  return (
    <header className="sticky top-0 z-20 border-b-2 bg-[var(--kartu)]" style={{ borderColor: garis }}>
      <div className="mx-auto flex max-w-md items-center gap-2.5 px-4 py-3">
        {balik && (
          <Link
            href={balik}
            prefetch={false}
            aria-label="Kembali"
            className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl border-2 bg-[var(--kartu)] transition-transform active:scale-90"
            style={{ borderColor: borderBack }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--teks-sekunder)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="font-judul truncate text-xl font-bold leading-tight" style={{ color: warnaJudul }}>
            {judul}
          </h1>
          {sub && (
            <p className="-mt-0.5 truncate text-[11px] font-semibold text-[var(--abu)]">{sub}</p>
          )}
        </div>
        {aksi}
      </div>
    </header>
  );
}
