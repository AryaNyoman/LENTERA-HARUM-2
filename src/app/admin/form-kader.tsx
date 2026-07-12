"use client";

import { useActionState, useState } from "react";
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
      <p className="mt-3 rounded-lg bg-[var(--merah-muda)] px-3 py-2 text-xs font-semibold text-[var(--merah-teks)]">
        {hasil.galat}
      </p>
    );
  }
  if (!hasil.ok) return null;
  return (
    <div className="mt-3 rounded-lg bg-[var(--teal-muda)] px-3 py-2 text-xs">
      <p className="font-bold text-[var(--teal-tua)]">{hasil.ok}</p>
      {hasil.sandi && (
        <p className="mt-1">
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
  const [buka, setBuka] = useState(false);

  return (
    <section className="mt-5 rounded-[var(--r-kartu)] border-2 border-[var(--garis-kader)] bg-[var(--kartu)] p-4">
      <button
        type="button"
        onClick={() => setBuka((b) => !b)}
        className="font-judul w-full text-left text-sm font-extrabold text-[var(--teal-tua)]"
      >
        + Buat Akun Kader Baru {buka ? "▴" : "▾"}
      </button>

      {buka && (
        <form action={aksi} className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-[var(--teks-sekunder)]">
              Nama lengkap
              <input
                name="nama"
                className="mt-1 w-full rounded-[var(--r-input)] border-2 border-[var(--garis)] bg-[var(--krem-input)] px-3 py-2 text-sm"
                placeholder="mis. Ibu Kader Seruni"
              />
            </label>
            <label className="block text-xs font-semibold text-[var(--teks-sekunder)]">
              Username (huruf kecil)
              <input
                name="username"
                className="mt-1 w-full rounded-[var(--r-input)] border-2 border-[var(--garis)] bg-[var(--krem-input)] px-3 py-2 text-sm"
                placeholder="mis. kader.seruni"
              />
            </label>
          </div>

          <p className="mt-4 text-xs font-semibold text-[var(--teks-sekunder)]">
            Posyandu binaan (boleh lebih dari satu):
          </p>
          <div className="mt-2 max-h-64 space-y-3 overflow-y-auto rounded-lg border border-[var(--garis)] p-3">
            {kelurahan.map((k) => (
              <div key={k.id}>
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-[var(--teal-tua)]">
                  {k.nama}
                </p>
                <div className="mt-1 grid gap-1 sm:grid-cols-2">
                  {k.posyandu.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-xs">
                      <input type="checkbox" name="posyandu" value={p.id} className="accent-[var(--teal)]" />
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
            className="btn3d btn3d-teal mt-4 px-4 py-2 text-sm disabled:opacity-50"
          >
            {sibuk ? "Membuat…" : "Buat akun kader"}
          </button>
          <KotakHasil hasil={hasil} />
        </form>
      )}
    </section>
  );
}

/** Tombol reset sandi satu akun — sandi sementara baru tampil sekali. */
export function TombolReset({ id }: { id: number }) {
  const [hasil, aksi, sibuk] = useActionState(resetSandi, {} as HasilBuatKader);
  return (
    <div className="text-right">
      <form action={aksi}>
        <input type="hidden" name="id" value={id} />
        <button
          disabled={sibuk}
          className="btn-garis border-2 border-[var(--garis)] px-2.5 py-1.5 text-[11px] text-[var(--teks-sekunder)] hover:bg-[var(--bg)] disabled:opacity-50"
        >
          Reset sandi
        </button>
      </form>
      {hasil.sandi && (
        <p className="mt-1 text-[10px]">
          baru: <code className="rounded bg-[var(--teal-muda)] px-1 font-mono font-bold">{hasil.sandi}</code>
        </p>
      )}
      {hasil.galat && <p className="mt-1 text-[10px] text-[var(--merah-teks)]">{hasil.galat}</p>}
    </div>
  );
}
