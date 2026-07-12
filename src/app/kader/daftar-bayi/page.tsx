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
          <h1 className="font-judul text-lg font-extrabold text-[var(--teal-tua)]">Daftar Bayi</h1>
          <p className="text-xs text-[var(--teks-sekunder)]">
            {daftar.length} dari {semua.length} anak · posyandu binaan Anda
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <a
            href="/kader/export"
            className="btn-garis border-2 px-3 py-2 text-xs text-[var(--teal-tua)]"
            style={{ borderColor: "var(--teal)" }}
          >
            ⬇ Export
          </a>
          <Link href="/kader/anak-baru" className="btn3d btn3d-coral px-3 py-2 text-xs">
            + Daftarkan
          </Link>
        </div>
      </div>

      <form className="mt-4 flex gap-2" action="/kader/daftar-bayi" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Cari nama anak / ortu / NIK…"
          className="w-full rounded-full border-2 border-[var(--garis-kader)] bg-[var(--kartu)] px-4 py-2.5 text-sm focus:border-[var(--teal)] focus:outline-none"
        />
        {u && <input type="hidden" name="u" value={u} />}
        <button className="btn3d btn3d-teal px-5 text-sm">Cari</button>
      </form>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {FILTER.map((f) => {
          const aktif = u === f.u;
          const href = `/kader/daftar-bayi?${new URLSearchParams({ ...(kata ? { q } : {}), ...(f.u ? { u: f.u } : {}) })}`;
          return (
            <Link
              key={f.label}
              href={href}
              className="font-judul shrink-0 rounded-full border-2 px-3.5 py-1.5 text-xs font-bold transition-colors"
              style={{
                borderColor: aktif ? "var(--teal)" : "var(--garis-kader)",
                background: aktif ? "var(--teal)" : "var(--kartu)",
                color: aktif ? "#fff" : "var(--teks-sekunder)",
              }}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-4 space-y-2">
        {daftar.length === 0 && (
          <div className="rounded-[var(--r-kartu)] border-2 border-dashed border-[var(--garis-kader)] bg-[var(--kartu)] p-6 text-center">
            <p className="text-2xl">{semua.length === 0 ? "👶" : "🔍"}</p>
            <p className="mt-2 text-sm text-[var(--teks-sekunder)]">
              {semua.length === 0
                ? "Belum ada anak. Daftarkan anak baru, atau tunggu tarikan data SIMPUS."
                : "Tidak ketemu… coba kata lain ya."}
            </p>
          </div>
        )}
        {daftar.map((a) => {
          const usia = hitungUsiaBulan(a.isi.tglLahir, now);
          const idl = lengkap(a.isi.vaksin, SYARAT_IDL);
          return (
            <Link
              key={a.ref}
              href={`/kader/anak/${a.ref}`}
              className="flex items-center gap-3 rounded-2xl border-2 border-[var(--garis-kader)] bg-[var(--kartu)] px-4 py-3"
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white"
                style={{
                  background: a.isi.jk === "P" ? "var(--coral)" : "var(--teal)",
                  boxShadow: a.olehOrtu && !a.terverifikasi ? "0 0 0 3px var(--verif-muda), 0 0 0 4.5px var(--verif)" : undefined,
                }}
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
                  <span className="rounded bg-[var(--hijau-muda)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--hijau-teks)]">
                    IDL ✓
                  </span>
                )}
                {a.sumber === "BARU" ? (
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                    style={{
                      background: a.status === "DRAF" ? "var(--coral-muda)" : "var(--teal-muda)",
                      color: a.status === "DRAF" ? "var(--coral-gelap)" : "var(--teal-tua)",
                    }}
                  >
                    {a.status === "DRAF" ? "BARU — belum ekspor" : "DIEKSPOR"}
                  </span>
                ) : (
                  <span className="rounded bg-[var(--bg)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--teks-sekunder)]">
                    SIMPUS
                  </span>
                )}
                {a.olehOrtu && (
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                    style={
                      a.terverifikasi
                        ? { background: "var(--teal-muda)", color: "var(--teal-tua)", border: "1.5px solid var(--teal-pastel)" }
                        : { background: "var(--verif)", color: "var(--verif-pekat)" }
                    }
                  >
                    {a.terverifikasi ? "diisi ortu ✓" : "diisi ortu · perlu verifikasi"}
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
