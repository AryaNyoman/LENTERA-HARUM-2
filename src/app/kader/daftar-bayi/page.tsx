import Link from "next/link";
import { wajibUser } from "@/lib/sesi";
import { ambilAnakBinaan, hitungUsiaBulan, kelompokUsia, labelUsia } from "@/lib/anak";
import { lengkap, SYARAT_IDL } from "@/lib/vaksin";

const FILTER = [
  { u: "", label: "Semua" },
  { u: "0-11", label: "Bayi 0–11" },
  { u: "12-24", label: "Baduta" },
  { u: ">24", label: ">24 bln" },
] as const;

export default async function DaftarBayi({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; u?: string }>;
}) {
  const user = await wajibUser("KADER", "ADMIN");
  const { q = "", u = "" } = await searchParams;
  const semua = await ambilAnakBinaan(user);

  const now = new Date();
  const kata = q.trim().toLowerCase();
  const daftar = semua.filter((a) => {
    if (u && kelompokUsia(hitungUsiaBulan(a.isi.tglLahir, now)) !== u) return false;
    if (!kata) return true;
    return (
      a.isi.nama.toLowerCase().includes(kata) ||
      a.isi.namaOrtu.toLowerCase().includes(kata) ||
      (a.isi.nik && a.isi.nik.includes(kata))
    );
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold text-[var(--teal-tua)]">Daftar Bayi</h1>
          <p className="text-xs text-[var(--teks-sekunder)]">
            {daftar.length} dari {semua.length} anak · posyandu binaan Anda
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <a
            href="/kader/export"
            className="rounded-xl border-2 border-[var(--teal)] px-3 py-2 text-xs font-bold text-[var(--teal-tua)]"
          >
            ⬇ Export SIMPUS
          </a>
          <Link
            href="/kader/anak-baru"
            className="rounded-xl bg-[var(--coral)] px-3 py-2 text-xs font-bold text-white"
          >
            + Daftarkan
          </Link>
        </div>
      </div>

      <form className="mt-4 flex gap-2" action="/kader/daftar-bayi" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Cari nama anak / ortu / NIK…"
          className="w-full rounded-xl border border-[var(--garis)] bg-[var(--kartu)] px-3 py-2 text-sm"
        />
        {u && <input type="hidden" name="u" value={u} />}
        <button className="rounded-xl bg-[var(--teal)] px-4 text-sm font-bold text-white">Cari</button>
      </form>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {FILTER.map((f) => {
          const aktif = u === f.u;
          const href = `/kader/daftar-bayi?${new URLSearchParams({ ...(kata ? { q } : {}), ...(f.u ? { u: f.u } : {}) })}`;
          return (
            <Link
              key={f.label}
              href={href}
              className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold"
              style={{
                borderColor: aktif ? "var(--teal)" : "var(--garis)",
                background: aktif ? "var(--teal-muda)" : "var(--kartu)",
                color: aktif ? "var(--teal-tua)" : "var(--teks-sekunder)",
              }}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-4 space-y-2">
        {daftar.length === 0 && (
          <p className="rounded-2xl border border-dashed border-[var(--garis)] bg-[var(--kartu)] p-6 text-center text-sm text-[var(--teks-sekunder)]">
            {semua.length === 0
              ? "Belum ada anak. Daftarkan anak baru, atau tunggu tarikan data SIMPUS (Tahap 7)."
              : "Tidak ada yang cocok dengan pencarian/filter."}
          </p>
        )}
        {daftar.map((a) => {
          const usia = hitungUsiaBulan(a.isi.tglLahir, now);
          const idl = lengkap(a.isi.vaksin, SYARAT_IDL);
          return (
            <Link
              key={a.ref}
              href={`/kader/anak/${a.ref}`}
              className="flex items-center gap-3 rounded-2xl border border-[var(--garis)] bg-[var(--kartu)] px-4 py-3"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white"
                style={{ background: a.isi.jk === "P" ? "var(--coral)" : "var(--teal)" }}
              >
                {a.isi.jk || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{a.isi.nama}</p>
                <p className="truncate text-[11px] text-[var(--teks-sekunder)]">
                  {labelUsia(usia)} · {a.posyanduLabel}
                  {a.isi.namaOrtu && <> · ortu: {a.isi.namaOrtu}</>}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                {idl && (
                  <span className="rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-bold text-[var(--hijau)]">
                    IDL ✓
                  </span>
                )}
                {a.sumber === "BARU" ? (
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                    style={{
                      background: a.status === "DRAF" ? "var(--coral-muda)" : "var(--teal-muda)",
                      color: a.status === "DRAF" ? "var(--coral)" : "var(--teal-tua)",
                    }}
                  >
                    {a.status === "DRAF" ? "BARU — belum ekspor" : "DIEKSPOR"}
                  </span>
                ) : (
                  <span className="rounded bg-[var(--bg)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--teks-sekunder)]">
                    SIMPUS
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
