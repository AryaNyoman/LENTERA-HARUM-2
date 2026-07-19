"use client";

import { useFormStatus } from "react-dom";

/** Tombol submit form "Tarik sekarang" dengan indikator loading (server action bisa
 *  makan puluhan detik) — dinonaktifkan selama proses agar tak diklik ganda, atau saat
 *  `terkunci` (batas sinkron manual tercapai, lihat src/lib/batas-sinkron.ts). `caption`
 *  opsional tampil kecil di bawah tombol (sisa kuota, atau kapan boleh lagi bila terkunci). */
export function TombolTarik({ terkunci, caption }: { terkunci?: boolean; caption?: string }) {
  const { pending } = useFormStatus();
  return (
    <div className="text-right">
      <button
        disabled={pending || terkunci}
        aria-busy={pending}
        className="btn3d btn3d-teal h-[42px] shrink-0 rounded-[14px] px-3.5 text-[12.5px] disabled:cursor-wait disabled:opacity-60"
        style={{ boxShadow: "0 4px 0 var(--teal-tua)" }}
      >
        {pending ? "Menarik data…" : "Tarik sekarang"}
      </button>
      {caption && (
        <p className="mt-1 text-[9.5px] font-semibold leading-snug text-[var(--teks-sekunder)]">{caption}</p>
      )}
    </div>
  );
}
