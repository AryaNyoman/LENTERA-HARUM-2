import Kepala from "@/components/kepala";
import { wajibUser } from "@/lib/sesi";
import { db } from "@/lib/db";
import { setAktif } from "@/lib/akun-actions";
import { tarikSimpus } from "@/lib/sinkron-actions";
import FormKader, { TombolReset } from "./form-kader";
import { TombolTarik } from "./tombol-tarik";

function JudulSeksi({ judul, n, coral }: { judul: string; n: number; coral?: boolean }) {
  return (
    <p className="font-judul mt-5 text-sm font-bold text-[var(--teks-3)]">
      {judul}{" "}
      <span
        className="font-judul rounded-full px-2 py-0.5 text-[11px] font-bold"
        style={coral ? { background: "var(--coral-muda)", color: "var(--coral-gelap)" } : { background: "var(--teal-muda)", color: "var(--teal-gelap)" }}
      >
        {n}
      </span>
    </p>
  );
}

function TombolAktif({ id, aktif }: { id: number; aktif: boolean }) {
  return (
    <form action={setAktif}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="aktif" value={aktif ? "0" : "1"} />
      <button
        className="btn-garis h-[38px] rounded-xl border-2 px-3 text-[11.5px]"
        style={
          aktif
            ? { borderColor: "var(--merah-border)", color: "var(--merah)" }
            : { borderColor: "var(--teal-pastel)", color: "var(--teal-tua)" }
        }
      >
        {aktif ? "Nonaktifkan" : "Aktifkan"}
      </button>
    </form>
  );
}

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
    <main className="bg-titik-kader min-h-dvh pb-8">
      <div className="px-4 pb-5 pt-3.5" style={{ background: "linear-gradient(160deg,#174f47,#26907f)" }}>
        <div className="mx-auto max-w-md">
          <Kepala user={user} />
          <h1 className="font-judul pop mt-3 text-[22px] font-bold leading-tight text-white">Kelola Akun 🛠️</h1>
          <p className="text-xs font-semibold text-white/85">akun kader &amp; orang tua · sinkron SIMPUS</p>
        </div>
      </div>
      <div className="scallop" style={{ "--scallop": "#26907f" } as React.CSSProperties} />

      <div className="mx-auto max-w-md px-4 pt-2.5">
        {galat && (
          <p className="mb-3 rounded-xl bg-[var(--merah-muda)] px-3 py-2 text-xs font-bold text-[var(--merah-teks)]">
            {galat}
          </p>
        )}
        {ok && (
          <p className="mb-3 rounded-xl bg-[var(--teal-muda)] px-3 py-2 text-xs font-bold text-[var(--teal-tua)]">
            {ok}
          </p>
        )}

        <section className="pop rounded-[22px] border-2 border-[var(--teal-pastel)] bg-[var(--kartu)] px-4 py-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl bg-[var(--teal-muda)] text-[22px]">
              ☁️
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-judul text-sm font-bold text-[var(--teal-gelap)]">Sinkron SIMPUS</p>
              <p className="text-[10.5px] font-semibold leading-snug text-[var(--teks-sekunder)]">
                {cache
                  ? `Tarikan terakhir: ${cache.sinkronPada.toLocaleString("id-ID")}.`
                  : "Belum pernah tarik data."}{" "}
                Otomatis berjalan tiap minggu; bisa juga ditarik manual.
              </p>
            </div>
            <form action={tarikSimpus} className="shrink-0">
              <TombolTarik />
            </form>
          </div>
          {!cache && (
            <p className="mt-2.5 rounded-xl px-3 py-2 text-[10px] font-semibold leading-relaxed" style={{ background: "var(--kuning-muda)", color: "var(--kuning-teks)" }}>
              ⚙️ Perlu <b>SIMPUS_DATABASE_URL</b> &amp; <b>SIMPUS_DEK</b> di pengaturan server — hubungi
              pengelola bila belum diisi.
            </p>
          )}
        </section>

        <FormKader kelurahan={kelurahan.map((k) => ({
          id: k.id,
          nama: k.nama,
          posyandu: k.posyandu.map((p) => ({ id: p.id, label: `${p.nama} (${p.namaPosyandu})` })),
        }))} />

        <JudulSeksi judul="Kader" n={kader.length} />
        <div className="mt-2 space-y-3">
          {kader.length === 0 && (
            <p className="text-xs font-semibold text-[var(--teks-sekunder)]">Belum ada akun kader.</p>
          )}
          {kader.map((u) => (
            <div key={u.id} className="relative rounded-[20px] border-2 border-[var(--garis-kader)] bg-[var(--kartu)] px-3.5 py-3">
              <span className="absolute -top-2.5 right-3 flex gap-1.5">
                {u.perluGantiSandi && (
                  <span
                    className="font-judul rounded-full px-2 py-0.5 text-[9.5px] font-bold"
                    style={{ background: "var(--kuning)", color: "var(--kuning-gelap)", transform: "rotate(2deg)" }}
                  >
                    sandi sementara
                  </span>
                )}
                {!u.aktif && (
                  <span className="font-judul rounded-full bg-[var(--merah)] px-2 py-0.5 text-[9.5px] font-bold text-white" style={{ transform: "rotate(-1.5deg)" }}>
                    NONAKTIF
                  </span>
                )}
              </span>
              <p className="truncate text-sm font-bold">
                {u.nama} <span className="text-[11px] font-semibold text-[var(--abu)]">@{u.username}</span>
              </p>
              <p className="mt-0.5 truncate text-[10.5px] font-semibold text-[var(--abu)]">
                Binaan: {u.binaan.map((b) => b.posyandu.nama).join(", ") || "—"}
              </p>
              <div className="mt-2 flex gap-2">
                <TombolReset id={u.id} />
                <TombolAktif id={u.id} aktif={u.aktif} />
              </div>
            </div>
          ))}
        </div>

        <JudulSeksi judul="Orang tua" n={ortu.length} coral />
        <div className="mt-2 space-y-2">
          {ortu.length === 0 && (
            <p className="text-xs font-semibold text-[var(--teks-sekunder)]">
              Belum ada — orang tua mendaftar sendiri lewat halaman Daftar.
            </p>
          )}
          {ortu.map((u) => (
            <div key={u.id} className="flex items-center gap-2.5 rounded-[20px] border-2 border-[var(--garis-ortu)] bg-[var(--kartu)] px-3.5 py-3">
              <p className="min-w-0 flex-1 truncate text-[13.5px] font-bold">
                {u.nama} <span className="text-[11px] font-semibold text-[var(--abu)]">· {u.username}</span>
                {!u.aktif && (
                  <span className="ml-1.5 rounded bg-[var(--merah-muda)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--merah-teks)]">
                    NONAKTIF
                  </span>
                )}
              </p>
              <div className="shrink-0">
                <TombolAktif id={u.id} aktif={u.aktif} />
              </div>
            </div>
          ))}
        </div>

        <JudulSeksi judul="Admin" n={admin.length} />
        <div className="mt-2 space-y-2">
          {admin.map((u) => (
            <div key={u.id} className="rounded-[20px] border-2 border-[var(--garis-kader)] bg-[var(--kartu)] px-3.5 py-3 text-[13.5px]">
              <span className="font-bold">{u.nama}</span>{" "}
              <span className="text-[11px] font-semibold text-[var(--abu)]">@{u.username}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
