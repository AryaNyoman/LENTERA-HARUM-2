import Link from "next/link";
import KepalaHalaman from "@/components/kepala-halaman";
import { wajibUser } from "@/lib/sesi";
import { db } from "@/lib/db";
import { labelUsia } from "@/lib/anak";
import { daftarVaksinAdmin, ringkasanVaksinAdmin, jumlahSiapExport } from "@/lib/vaksin-admin-actions";

/** Badge kuning angka kecil (pola "sandi sementara" admin/page.tsx, warna+angka
 *  sesuai panduan desain — bukan warna saja). Disembunyikan bila n<=0. */
function BadgeKuning({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span
      className="font-judul inline-flex shrink-0 items-center justify-center rounded-full px-1.5 py-0.5 text-[9.5px] font-bold"
      style={{ background: "var(--kuning)", color: "var(--kuning-gelap)" }}
    >
      {n}
    </span>
  );
}

export default async function AdminVaksinPage({
  searchParams,
}: {
  searchParams: Promise<{ posyanduId?: string; galat?: string; ok?: string }>;
}) {
  await wajibUser("ADMIN");
  const { posyanduId: raw, galat, ok } = await searchParams;
  const posyanduId = Number(raw) || 0;

  const kelurahan = await db.kelurahan.findMany({
    orderBy: { urutan: "asc" },
    include: { posyandu: { where: { aktif: true }, orderBy: { id: "asc" } } },
  });
  const posyanduAktif = posyanduId
    ? kelurahan.flatMap((k) => k.posyandu).find((p) => p.id === posyanduId)
    : undefined;
  const [daftar, ringkasan, siapExport] = await Promise.all([
    posyanduAktif ? daftarVaksinAdmin(posyanduAktif.id) : Promise.resolve([]),
    ringkasanVaksinAdmin(),
    jumlahSiapExport(),
  ]);
  const labelPosyanduAktif = posyanduAktif
    ? posyanduAktif.namaPosyandu ? `${posyanduAktif.nama} (${posyanduAktif.namaPosyandu})` : posyanduAktif.nama
    : "";

  return (
    <main>
      <KepalaHalaman judul="Isi Tanggal Vaksin 💉" sub="hanya anak belum masuk SIMPUS" balik="/admin" />
      <div className="mx-auto max-w-md px-4 pb-8 pt-3.5">
        {galat && (
          <p className="mb-3 rounded-xl bg-[var(--merah-muda)] px-3 py-2 text-xs font-bold text-[var(--merah-teks)]">{galat}</p>
        )}
        {ok && (
          <p className="mb-3 rounded-xl bg-[var(--teal-muda)] px-3 py-2 text-xs font-bold text-[var(--teal-tua)]">{ok}</p>
        )}

        {/* Blok atas padat: intro + export jadi satu kartu (bukan 3 elemen lepas dgn jarak lebar). */}
        <div className="pop rounded-[18px] border-2 border-[var(--teal-pastel)] bg-[var(--teal-muda)] p-3">
          <p className="text-[10.5px] font-semibold leading-relaxed text-[var(--teal-tua)]">
            Anak yang sudah masuk SIMPUS diisi lewat SIMPUS — daftar di bawah hanya anak draf/sudah disetor yang belum tercocok.
          </p>
          {/* /kader/export sudah admin-compatible lewat binaanIds (ADMIN → semua posyandu). */}
          <Link
            href="/kader/export"
            prefetch={false}
            className="btn3d btn3d-teal mt-2.5 flex h-11 items-center justify-center rounded-[14px] text-center text-[12.5px] leading-tight"
            style={{ boxShadow: "0 4px 0 var(--teal-tua)" }}
          >
            📤 Export Semua Anak Siap Disetor ({siapExport} anak)
          </Link>
          <p className="mt-1.5 text-center text-[9.5px] font-semibold text-[var(--teal-tua)] opacity-80">
            Mengekspor SEMUA posyandu (bukan cuma yang sedang dipilih), sesuai status setor terbaru.
          </p>
        </div>

        {/* "Pilih posyandu" dilipat begitu ada posyandu terpilih — ringkasan (nama +
            badge) tampil di summary supaya daftar anak langsung terlihat tanpa perlu
            scroll melewati kartu-kartu kelurahan. */}
        <details className="group mt-4 rounded-[16px] border-2 border-[var(--garis-kader)] bg-[var(--kartu)] px-3.5 py-2.5" open={!posyanduAktif}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
            <span className="min-w-0 flex-1">
              <span className="font-judul block text-xs font-bold text-[var(--teks-3)]">Pilih posyandu</span>
              {posyanduAktif && (
                <span className="mt-0.5 flex items-center gap-1.5">
                  <span className="truncate text-[11px] font-semibold text-[var(--teal-gelap)]">{labelPosyanduAktif}</span>
                  <BadgeKuning n={ringkasan.perPosyandu[posyanduAktif.id] ?? 0} />
                </span>
              )}
            </span>
            <span className="shrink-0 text-[10px] font-semibold text-[var(--abu)] group-open:hidden">ubah ▾</span>
            <span className="hidden shrink-0 text-[10px] font-semibold text-[var(--abu)] group-open:inline">tutup ▴</span>
          </summary>
          <div className="mt-2.5 flex flex-col gap-2">
            {kelurahan.map((k) => (
              <details key={k.id} open={posyanduAktif?.kelurahanId === k.id} className="group/kel rounded-[16px] border-2 border-[var(--garis-kader)] bg-[var(--kartu)] px-3.5 py-2.5">
                <summary className="flex cursor-pointer list-none items-center justify-between text-[12.5px] font-bold text-[var(--teks-3)] [&::-webkit-details-marker]:hidden">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate">{k.nama}</span>
                    <BadgeKuning n={ringkasan.perKelurahan[k.id] ?? 0} />
                  </span>
                  <span className="shrink-0 text-[10px] font-semibold text-[var(--abu)] group-open/kel:hidden">▾</span>
                  <span className="hidden shrink-0 text-[10px] font-semibold text-[var(--abu)] group-open/kel:inline">▴</span>
                </summary>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {k.posyandu.map((p) => {
                    const aktif = p.id === posyanduId;
                    const label = p.namaPosyandu ? `${p.nama} (${p.namaPosyandu})` : p.nama;
                    const n = ringkasan.perPosyandu[p.id] ?? 0;
                    return (
                      <Link
                        key={p.id}
                        href={`/admin/vaksin?posyanduId=${p.id}`}
                        prefetch={false}
                        className="font-judul flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-bold"
                        style={
                          aktif
                            ? { background: "var(--teal)", color: "#fff" }
                            : { background: "#f0f5f2", color: "var(--teks-sekunder)" }
                        }
                      >
                        <span className="truncate">{label}</span>
                        {n > 0 && (
                          <span
                            className="font-judul shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                            style={{ background: "var(--kuning)", color: "var(--kuning-gelap)" }}
                          >
                            {n}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </details>
            ))}
          </div>
        </details>

        {posyanduAktif && (
          <section className="mt-4">
            <p className="font-judul text-sm font-bold text-[var(--teal-gelap)]">
              {labelPosyanduAktif}{" "}
              <span className="font-judul rounded-full bg-[var(--teal-muda)] px-2 py-0.5 text-[11px] font-bold text-[var(--teal-gelap)]">
                {daftar.length}
              </span>
            </p>
            {daftar.length === 0 && (
              <p className="mt-2 text-xs font-semibold text-[var(--teks-sekunder)]">
                Belum ada anak draf/belum masuk SIMPUS di posyandu ini.
              </p>
            )}
            {daftar.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {daftar.map((a) => (
                  <Link
                    key={a.id}
                    href={`/admin/vaksin/${a.id}`}
                    prefetch={false}
                    className="pop flex min-h-11 flex-col justify-center gap-0.5 rounded-[16px] border-2 border-[var(--garis-kader)] bg-[var(--kartu)] px-3 py-2.5 transition-transform active:scale-[.97]"
                  >
                    <p className="truncate text-[12.5px] font-bold">{a.nama}</p>
                    <p className="truncate text-[10.5px] font-semibold text-[var(--abu)]">{labelUsia(a.usiaBulan)}</p>
                    <span className="font-judul text-[10.5px] font-bold text-[var(--teal-gelap)]">
                      {a.sudah}/{a.total} dosis
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
