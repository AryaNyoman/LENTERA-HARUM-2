/* eslint-disable @next/next/no-img-element */
import { keluar } from "@/lib/akun-actions";
import type { UserSesi } from "@/lib/sesi";

/** Baris identitas di DALAM hero berwarna (dashboard kader/ortu/admin):
 *  logo dalam lingkaran putih + nama app + user, tombol Keluar outline putih. */
export default function Kepala({ user }: { user: UserSesi }) {
  const label =
    user.peran === "ADMIN" ? "Admin" : user.peran === "KADER" ? "Kader" : "Orang tua";
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
        <img src="/icon-192.png" alt="" width={28} height={28} className="h-7 w-7 rounded-lg" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-judul truncate text-[15px] font-bold leading-tight text-white">
          SIMPUS-POSYANDU
        </p>
        <p className="truncate text-[11px] font-semibold leading-tight text-white/85">
          {user.nama} · {label}
        </p>
      </div>
      <form action={keluar}>
        <button
          type="submit"
          className="font-judul h-9 rounded-xl border-2 border-white/50 bg-transparent px-3.5 text-xs font-bold text-white transition-transform active:scale-[.92]"
        >
          Keluar
        </button>
      </form>
    </div>
  );
}
