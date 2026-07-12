"use client";

/** Galat ramah sisi kader + tombol coba lagi. */
export default function ErrorKader({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md px-4 pt-10 text-center">
      <p className="text-3xl">😥</p>
      <p className="font-judul mt-2 text-base font-bold text-[var(--teal-gelap)]">Aduh, ada gangguan.</p>
      <p className="mt-1 text-xs font-semibold leading-relaxed text-[var(--teks-sekunder)]">
        Coba muat ulang — kalau masih bermasalah, tutup lalu buka lagi aplikasinya.
      </p>
      <button onClick={reset} className="btn3d btn3d-teal mt-4 h-11 rounded-[14px] px-6 text-sm">
        Coba lagi
      </button>
    </div>
  );
}
