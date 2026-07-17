"use client";

import { useActionState } from "react";
import { buatKader, resetSandi, type HasilBuatKader } from "@/lib/akun-actions";

interface KelurahanOpsi {
  id: number;
  nama: string;
  posyandu: { id: number; label: string }[];
}

/** Kotak hasil: tampilkan sandi sementara SEKALI (admin mencatat & memberikannya ke kader). */
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
    <div className="mt-3 rounded-xl bg-[var(--teal-muda)] px-3 py-2 text-xs">
      <p className="font-bold text-[var(--teal-tua)]">{hasil.ok}</p>
      {hasil.sandi && (
        <p className="mt-1 font-semibold">
          Sandi sementara:{" "}
          <code className="rounded bg-white px-1.5 py-0.5 font-mono font-bold">{hasil.sandi}</code>
          <span className="ml-1 text-[var(--teks-sekunder)]">
            — catat &amp; berikan ke kader (hanya tampil sekali; kader wajib menggantinya saat
            login pertama).
          </span>
        </p>
      )}
    </div>
  );
}

/** Form buat akun kader baru + pilih posyandu binaan (dikelompokkan per kelurahan). */
export default function FormKader({ kelurahan }: { kelurahan: KelurahanOpsi[] }) {
  const [hasil, aksi, sibuk] = useActionState(buatKader, {} as HasilBuatKader);

  const inp =
    "mt-1.5 h-[46px] w-full rounded-[14px] border-2 border-[#e2ece7] bg-[#fbfdfc] px-3.5 text-base font-semibold outline-none transition-colors focus:border-[var(--teal)]";
  const lbl = "block text-xs font-extrabold text-[var(--teks-3)]";

  return (
    <section className="pop pop-1 mt-3 rounded-[22px] border-2 border-[var(--garis-kader)] bg-[var(--kartu)] p-4">
      <h2 className="font-judul mb-2.5 text-[15px] font-bold text-[var(--teal-gelap)]">➕ Buat Akun Kader</h2>

      <form action={aksi}>
        <label className={lbl}>
          Nama lengkap
          <input name="nama" className={inp} placeholder="mis. Ibu Kader Seruni" />
        </label>
        <label className={`${lbl} mt-2.5`}>
          Username <span className="font-semibold text-[var(--abu)]">(huruf kecil)</span>
          <input name="username" className={inp} placeholder="mis. kader.seruni" />
        </label>
        <label className={`${lbl} mt-2.5`}>
          No HP <span className="font-semibold text-[var(--abu)]">(opsional, boleh diisi nanti)</span>
          <input name="noHp" className={inp} placeholder="mis. 081234567890" inputMode="numeric" />
        </label>

        <p className={`${lbl} mt-3`}>Posyandu binaan (boleh lebih dari satu):</p>
        <div className="mt-1.5 max-h-64 space-y-3 overflow-y-auto rounded-2xl border-2 border-[#e2ece7] p-3">
          {kelurahan.map((k) => (
            <div key={k.id}>
              <p className="font-judul text-[11px] font-bold uppercase tracking-wide text-[var(--teal-gelap)]">
                {k.nama}
              </p>
              <div className="mt-1 grid gap-1">
                {k.posyandu.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-xs font-semibold">
                    <input type="checkbox" name="posyandu" value={p.id} className="h-4 w-4 accent-[var(--teal)]" />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={sibuk}
          className="btn3d btn3d-teal mt-3 h-[46px] rounded-[14px] px-5 text-[13.5px] disabled:opacity-50"
          style={{ boxShadow: "0 4px 0 var(--teal-tua)" }}
        >
          {sibuk ? "Membuat…" : "Buat akun"}
        </button>
        <p className="mt-2 text-[10px] font-semibold leading-relaxed text-[var(--abu)]">
          Sandi sementara dibuat otomatis — kader diminta menggantinya saat login pertama.
        </p>
        <KotakHasil hasil={hasil} />
      </form>
    </section>
  );
}

/** Tombol reset sandi satu akun — sandi sementara baru tampil sekali. */
export function TombolReset({ id }: { id: number }) {
  const [hasil, aksi, sibuk] = useActionState(resetSandi, {} as HasilBuatKader);
  return (
    <div>
      <form action={aksi}>
        <input type="hidden" name="id" value={id} />
        <button
          disabled={sibuk}
          className="btn-garis h-[38px] rounded-xl border-2 border-[#e2ece7] px-3 text-[11.5px] text-[var(--teks-sekunder)] disabled:opacity-50"
        >
          🔑 Reset sandi
        </button>
      </form>
      {hasil.sandi && (
        <p className="mt-1 text-[10px] font-semibold">
          baru: <code className="rounded bg-[var(--teal-muda)] px-1 font-mono font-bold">{hasil.sandi}</code>
        </p>
      )}
      {hasil.galat && <p className="mt-1 text-[10px] font-semibold text-[var(--merah-teks)]">{hasil.galat}</p>}
    </div>
  );
}
