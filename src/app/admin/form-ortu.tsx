"use client";

import { useActionState } from "react";
import { buatOrtu, type HasilBuatKader } from "@/lib/akun-actions";

/** Kotak hasil: tampilkan sandi sementara SEKALI (admin mencatat & memberikannya ke ortu). */
function KotakHasil({ hasil }: { hasil: HasilBuatKader }) {
  if (hasil.galat) {
    return (
      <p className="mt-3 rounded-xl bg-[var(--merah-muda)] px-3 py-2 text-xs font-bold text-[var(--merah-teks)]">
        {hasil.galat}
      </p>
    );
  }
  if (!hasil.ok) return null;
  return (
    <div className="mt-3 rounded-xl bg-[var(--coral-muda)] px-3 py-2 text-xs">
      <p className="font-bold text-[var(--coral-gelap)]">{hasil.ok}</p>
      {hasil.sandi && (
        <p className="mt-1 font-semibold">
          Sandi sementara:{" "}
          <code className="rounded bg-white px-1.5 py-0.5 font-mono font-bold">{hasil.sandi}</code>
          <span className="ml-1 text-[var(--teks-sekunder)]">
            — catat &amp; berikan ke orang tua (hanya tampil sekali; wajib diganti saat login
            pertama).
          </span>
        </p>
      )}
    </div>
  );
}

/** Form buat akun ortu baru (dipakai admin utk daftar-kan ortu yang datang langsung, mis.
 *  belum punya HP sendiri). Mirror FormKader — tanpa pilihan posyandu, cukup kelurahan. */
export default function FormOrtu({ kelurahan }: { kelurahan: { id: number; nama: string }[] }) {
  const [hasil, aksi, sibuk] = useActionState(buatOrtu, {} as HasilBuatKader);

  const inp =
    "mt-1.5 h-[46px] w-full rounded-[14px] border-2 border-[#e2ece7] bg-[#fbfdfc] px-3.5 text-base font-semibold outline-none transition-colors focus:border-[var(--coral)]";
  const lbl = "block text-xs font-extrabold text-[var(--teks-3)]";

  return (
    <form action={aksi}>
      <label className={lbl}>
        Nama lengkap
        <input name="nama" required className={inp} placeholder="mis. Ni Made Sari" />
      </label>
      <label className={`${lbl} mt-2.5`}>
        No HP <span className="font-semibold text-[var(--abu)]">(jadi username login)</span>
        <input
          name="noHp"
          inputMode="numeric"
          maxLength={13}
          required
          pattern="08[0-9]{8,11}"
          title="Mulai 08, 10–13 digit angka"
          className={inp}
          placeholder="08…"
        />
      </label>
      <label className={`${lbl} mt-2.5`}>
        Kelurahan
        <select name="kelurahanId" defaultValue="" required className={inp}>
          <option value="">— pilih kelurahan —</option>
          {kelurahan.map((k) => (
            <option key={k.id} value={k.id}>{k.nama}</option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        disabled={sibuk}
        className="btn3d btn3d-coral mt-3 h-[46px] rounded-[14px] px-5 text-[13.5px] disabled:opacity-50"
        style={{ boxShadow: "0 4px 0 var(--coral-tua)" }}
      >
        {sibuk ? "Membuat…" : "Buat akun"}
      </button>
      <p className="mt-2 text-[10px] font-semibold leading-relaxed text-[var(--abu)]">
        Sandi sementara dibuat otomatis — orang tua diminta menggantinya saat login pertama.
      </p>
      <KotakHasil hasil={hasil} />
    </form>
  );
}
