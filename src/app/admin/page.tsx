import Kepala from "@/components/kepala";
import { wajibUser } from "@/lib/sesi";
import { db } from "@/lib/db";
import { setAktif } from "@/lib/akun-actions";
import { tarikSimpus } from "@/lib/sinkron-actions";
import FormKader, { TombolReset } from "./form-kader";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ galat?: string; ok?: string }>;
}) {
  const user = await wajibUser("ADMIN");
  const { galat, ok } = await searchParams;

  const [users, kelurahan, cache] = await Promise.all([
    db.user.findMany({
      orderBy: [{ peran: "asc" }, { nama: "asc" }],
      include: { binaan: { include: { posyandu: true } } },
    }),
    db.kelurahan.findMany({
      orderBy: { urutan: "asc" },
      include: { posyandu: { where: { aktif: true }, orderBy: { id: "asc" } } },
    }),
    db.cacheDashboard.findUnique({ where: { kunci: "puskesmas" } }),
  ]);

  const kader = users.filter((u) => u.peran === "KADER");
  const ortu = users.filter((u) => u.peran === "ORTU");
  const admin = users.filter((u) => u.peran === "ADMIN");

  return (
    <div className="min-h-dvh">
      <Kepala user={user} warna="var(--teal-tua)" />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-lg font-extrabold text-[var(--teal-tua)]">Kelola Akun</h1>
        <p className="mt-1 text-sm text-[var(--teks-sekunder)]">
          Buat akun kader (dengan posyandu binaan), reset sandi, aktif/nonaktifkan.
        </p>
        {galat && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-[var(--merah)]">
            {galat}
          </p>
        )}
        {ok && (
          <p className="mt-3 rounded-lg bg-[var(--teal-muda)] px-3 py-2 text-xs font-semibold text-[var(--teal-tua)]">
            {ok}
          </p>
        )}

        <section className="mt-5 rounded-2xl border border-[var(--garis)] bg-[var(--kartu)] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold text-[var(--teal-tua)]">Sinkron SIMPUS</h2>
              <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--teks-sekunder)]">
                {cache
                  ? `Tarikan terakhir: ${cache.sinkronPada.toLocaleString("id-ID")}.`
                  : "Belum pernah tarik data. Isi SIMPUS_DATABASE_URL & SIMPUS_DEK di env dulu."}{" "}
                Jadwal otomatis: mingguan (Railway cron → /api/sinkron).
              </p>
            </div>
            <form action={tarikSimpus} className="shrink-0">
              <button className="rounded-xl bg-[var(--teal)] px-4 py-2 text-xs font-bold text-white">
                ⟳ Tarik sekarang
              </button>
            </form>
          </div>
        </section>

        <FormKader kelurahan={kelurahan.map((k) => ({
          id: k.id,
          nama: k.nama,
          posyandu: k.posyandu.map((p) => ({ id: p.id, label: `${p.nama} (${p.namaPosyandu})` })),
        }))} />

        <section className="mt-8">
          <h2 className="text-sm font-extrabold">Kader ({kader.length})</h2>
          <div className="mt-2 space-y-2">
            {kader.length === 0 && (
              <p className="text-xs text-[var(--teks-sekunder)]">Belum ada akun kader.</p>
            )}
            {kader.map((u) => (
              <div
                key={u.id}
                className="rounded-xl border border-[var(--garis)] bg-[var(--kartu)] px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">
                      {u.nama}{" "}
                      <span className="font-normal text-[var(--teks-sekunder)]">@{u.username}</span>
                      {!u.aktif && (
                        <span className="ml-2 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-[var(--merah)]">
                          NONAKTIF
                        </span>
                      )}
                      {u.perluGantiSandi && (
                        <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                          sandi sementara
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-[var(--teks-sekunder)]">
                      Binaan: {u.binaan.map((b) => b.posyandu.nama).join(", ") || "—"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <TombolReset id={u.id} />
                    <form action={setAktif}>
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="aktif" value={u.aktif ? "0" : "1"} />
                      <button className="rounded-lg border border-[var(--garis)] px-2.5 py-1.5 text-[11px] font-bold text-[var(--teks-sekunder)] hover:bg-[var(--bg)]">
                        {u.aktif ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-extrabold">Orang tua ({ortu.length})</h2>
          <div className="mt-2 space-y-2">
            {ortu.length === 0 && (
              <p className="text-xs text-[var(--teks-sekunder)]">
                Belum ada — orang tua mendaftar sendiri lewat halaman Daftar.
              </p>
            )}
            {ortu.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--garis)] bg-[var(--kartu)] px-4 py-3"
              >
                <p className="min-w-0 truncate text-sm">
                  <span className="font-bold">{u.nama}</span>{" "}
                  <span className="text-[var(--teks-sekunder)]">· {u.username}</span>
                  {!u.aktif && (
                    <span className="ml-2 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-[var(--merah)]">
                      NONAKTIF
                    </span>
                  )}
                </p>
                <form action={setAktif} className="shrink-0">
                  <input type="hidden" name="id" value={u.id} />
                  <input type="hidden" name="aktif" value={u.aktif ? "0" : "1"} />
                  <button className="rounded-lg border border-[var(--garis)] px-2.5 py-1.5 text-[11px] font-bold text-[var(--teks-sekunder)] hover:bg-[var(--bg)]">
                    {u.aktif ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-extrabold">Admin ({admin.length})</h2>
          <div className="mt-2 space-y-2">
            {admin.map((u) => (
              <div
                key={u.id}
                className="rounded-xl border border-[var(--garis)] bg-[var(--kartu)] px-4 py-3 text-sm"
              >
                <span className="font-bold">{u.nama}</span>{" "}
                <span className="text-[var(--teks-sekunder)]">@{u.username}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
