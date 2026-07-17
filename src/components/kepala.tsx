/* eslint-disable @next/next/no-img-element */
import { keluar } from "@/lib/akun-actions";
import type { UserSesi } from "@/lib/sesi";

/** Baris identitas di DALAM hero berwarna (dashboard kader/ortu/admin):
 *  logo dalam lingkaran putih + nama app + user, tombol Keluar outline putih. */
export default function Kepala({ user }: { user: UserSesi }) {
  const label =
    user.peran === "ADMIN" ? "Admin" : user.peran === "KADER" ? "Kader" : "Orang tua";
  // Hero admin/kader = gradien teal, hero ortu = gradien coral (lihat app/*/page.tsx).
  // Aksen wordmark pakai TINT TERANG keluarga warna lawan (bukan warna jenuh) supaya
  // kontras di atas gradien tetap terbaca: coral-muda di hero teal, teal-muda di hero coral.
  // Kata lain putih polos. Rasio kontras dihitung thd kedua ujung gradien tiap hero —
  // catatan: ujung TERANG gradien (#3aa895 / #f0906e) memberi plafon ~2.9 / ~2.35 bahkan
  // untuk putih murni; wordmark sendiri duduk di area ujung gelap (atas hero).
  const diOrtu = user.peran === "ORTU";
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
        <img src="/icon-192.png" alt="" width={28} height={28} className="h-7 w-7 rounded-lg" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-judul truncate text-[15px] font-bold leading-tight text-white">
          {diOrtu ? (
            <>Lentera <span style={{ color: "var(--teal-muda)" }}>Harum</span></>
          ) : (
            <><span style={{ color: "var(--coral-muda)" }}>Lentera</span> Harum</>
          )}
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
