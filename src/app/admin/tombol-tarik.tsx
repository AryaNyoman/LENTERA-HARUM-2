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
      className="btn3d btn3d-teal shrink-0 px-4 py-2 text-xs disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "⟳ Menarik data…" : "⟳ Tarik sekarang"}
    </button>
  );
}
