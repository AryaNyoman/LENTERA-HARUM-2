import { keluar } from "@/lib/akun-actions";
import type { UserSesi } from "@/lib/sesi";

/** Header bersama semua peran: identitas app + nama user + tombol keluar. */
export default function Kepala({ user, warna }: { user: UserSesi; warna?: string }) {
  const label =
    user.peran === "ADMIN" ? "Admin" : user.peran === "KADER" ? "Kader" : "Orang tua";
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--garis)] bg-[var(--kartu)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2.5">
        <div
          className="font-judul flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-bold text-white"
          style={{ background: warna ?? "var(--teal)" }}
        >
          SP
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-judul truncate text-sm font-extrabold leading-tight text-[var(--teal-tua)]">
            SIMPUS-POSYANDU
          </p>
          <p className="truncate text-[11px] leading-tight text-[var(--teks-sekunder)]">
            {user.nama} · {label}
          </p>
        </div>
        <form action={keluar}>
          <button
            type="submit"
            className="btn-garis min-h-[44px] border-2 border-[var(--garis)] px-3 py-1.5 text-xs text-[var(--teks-sekunder)] hover:bg-[var(--bg)]"
          >
            Keluar
          </button>
        </form>
      </div>
    </header>
  );
}
