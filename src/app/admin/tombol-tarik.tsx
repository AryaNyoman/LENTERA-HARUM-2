"use client";

import { useFormStatus } from "react-dom";

/** Tombol submit form "Tarik sekarang" dengan indikator loading (server action bisa
 *  makan puluhan detik). Dinonaktifkan selama proses agar tak diklik ganda. */
export function TombolTarik() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      aria-busy={pending}
      className="btn3d btn3d-teal h-[42px] shrink-0 rounded-[14px] px-3.5 text-[12.5px] disabled:cursor-wait disabled:opacity-60"
      style={{ boxShadow: "0 4px 0 var(--teal-tua)" }}
    >
      {pending ? "Menarik data…" : "Tarik sekarang"}
    </button>
  );
}
