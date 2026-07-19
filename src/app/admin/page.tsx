import Link from "next/link";
import Kepala from "@/components/kepala";
import { wajibUser } from "@/lib/sesi";
import { db } from "@/lib/db";
import { setAktif, hapusAkun, setNoHp } from "@/lib/akun-actions";
import { tarikSimpus } from "@/lib/sinkron-actions";
import { sisaBatasSinkron } from "@/lib/batas-sinkron";
import { URL_APLIKASI } from "@/lib/pojok-baca";
import { ambilPengaturan } from "@/lib/pengaturan";
import { simpanPengaturanPojok } from "@/lib/pengaturan-actions";
import FormKader, { TombolReset } from "./form-kader";
import FormOrtu from "./form-ortu";
import { TombolTarik } from "./tombol-tarik";
import QrBagikan from "./qr-bagikan";

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

/** Tombol hapus akun (kader/ortu) — konfirmasi inline `<details>`, ringkas saat tertutup
 *  (pola sama dengan "🗑 Hapus" di src/app/ortu/anakku/page.tsx). Named group (group/hapus)
 *  supaya label tidak ketularan state open `<details>` grup kelurahan pembungkusnya. */
function TombolHapus({ id, nama }: { id: number; nama: string }) {
  return (
    <details className="group/hapus mt-1.5">
      <summary className="cursor-pointer list-none text-[10.5px] font-bold text-[var(--merah)] [&::-webkit-details-marker]:hidden">
        <span className="group-open/hapus:hidden">🗑 Hapus akun</span>
        <span className="hidden group-open/hapus:inline">▴ Batal</span>
      </summary>
      <div className="mt-1.5 rounded-xl bg-[var(--merah-muda)] p-2.5">
        <p className="text-[10px] font-semibold leading-snug text-[var(--merah-teks)]">
          Hapus akun <b>{nama}</b> permanen? Tak bisa dibatalkan.
        </p>
        <form action={hapusAkun} className="mt-1.5">
          <input type="hidden" name="id" value={id} />
          <button className="h-8 w-full rounded-lg bg-[var(--merah)] text-[10.5px] font-bold text-white">
            Ya, hapus permanen
          </button>
        </form>
      </div>
    </details>
  );
}

/** Baris No HP ringkas + form inline "✎ ubah" via <details> (pola sama TombolHapus).
 *  Dipakai di kartu kader & admin — admin.mengisi/mengubah nomor kontak yang tampil
 *  di Pojok Baca (src/components/pojok-baca-konten.tsx). */
function BarisNoHp({ id, noHp }: { id: number; noHp: string }) {
  return (
    <details className="group/hp mt-1.5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-[10.5px] font-semibold text-[var(--abu)] [&::-webkit-details-marker]:hidden">
        <span className="truncate">📞 {noHp || "belum diisi"}</span>
        <span className="shrink-0 font-bold text-[var(--teal-tua)]">
          <span className="group-open/hp:hidden">✎ ubah</span>
          <span className="hidden group-open/hp:inline">▴ tutup</span>
        </span>
      </summary>
      <form action={setNoHp} className="mt-1.5 flex gap-1.5">
        <input type="hidden" name="id" value={id} />
        <input
          name="noHp"
          defaultValue={noHp}
          placeholder="081234567890"
          inputMode="numeric"
          className="h-8 min-w-0 flex-1 rounded-lg border-2 border-[#e2ece7] bg-[#fbfdfc] px-2 text-[11px] font-semibold outline-none focus:border-[var(--teal)]"
        />
        <button className="h-8 shrink-0 rounded-lg bg-[var(--teal)] px-2.5 text-[10.5px] font-bold text-white">
          Simpan
        </button>
      </form>
    </details>
  );
}

/** Form 2 link (BPJS/Drive) Pojok Baca — dalam <details> tertutup default (halaman
 *  jangan memanjang). Lihat src/lib/pengaturan.ts (KV di CacheDashboard, bukan cache). */
function FormPengaturanPojok({ linkBpjs, linkDrive }: { linkBpjs: string; linkDrive: string }) {
  const inp = "mt-1 h-9 w-full rounded-lg border-2 border-[#e2ece7] bg-[#fbfdfc] px-2.5 text-[11px] font-semibold outline-none focus:border-[var(--teal)]";
  return (
    <form action={simpanPengaturanPojok} className="mt-2 flex flex-col gap-2">
      <label className="text-[10.5px] font-extrabold text-[var(--teks-3)]">
        Link BPJS (QR pendaftaran)
        <input name="linkBpjs" defaultValue={linkBpjs} placeholder="https://…" className={inp} />
      </label>
      <label className="text-[10.5px] font-extrabold text-[var(--teks-3)]">
        Link Drive materi imunisasi
        <input name="linkDrive" defaultValue={linkDrive} placeholder="https://… (boleh kosong)" className={inp} />
      </label>
      <button className="h-9 rounded-lg bg-[var(--teal)] text-[11px] font-bold text-white">Simpan link</button>
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

  const [users, kelurahan, cache, pengaturan, batasSinkron] = await Promise.all([
    db.user.findMany({
      orderBy: [{ peran: "asc" }, { nama: "asc" }],
      include: { binaan: { include: { posyandu: true } } },
    }),
    db.kelurahan.findMany({
      orderBy: { urutan: "asc" },
      include: { posyandu: { where: { aktif: true }, orderBy: { id: "asc" } } },
    }),
    db.cacheDashboard.findUnique({ where: { kunci: "puskesmas" } }),
    ambilPengaturan(),
    sisaBatasSinkron(user.id),
  ]);

  const kader = users.filter((u) => u.peran === "KADER");
  const ortu = users.filter((u) => u.peran === "ORTU");
  const admin = users.filter((u) => u.peran === "ADMIN");

  // grup ortu per kelurahan (urutan ikut kelurahan.urutan), tanpa-kelurahan di grup terakhir
  const grupOrtu = [
    ...kelurahan.map((k) => ({ key: `k${k.id}`, label: k.nama, daftar: ortu.filter((u) => u.kelurahanId === k.id) })),
    { key: "tanpa", label: "Belum pilih kelurahan", daftar: ortu.filter((u) => u.kelurahanId == null) },
  ].filter((g) => g.daftar.length > 0);

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
              <TombolTarik terkunci={batasSinkron.terkunci} caption={batasSinkron.caption} />
            </form>
          </div>
          {!cache && (
            <p className="mt-2.5 rounded-xl px-3 py-2 text-[10px] font-semibold leading-relaxed" style={{ background: "var(--kuning-muda)", color: "var(--kuning-teks)" }}>
              ⚙️ Perlu <b>SIMPUS_DATABASE_URL</b> &amp; <b>SIMPUS_DEK</b> di pengaturan server — hubungi
              pengelola bila belum diisi.
            </p>
          )}
        </section>

        <Link
          href="/admin/vaksin"
          prefetch={false}
          className="pop mt-3 flex items-center gap-3 rounded-[22px] border-2 border-[var(--teal-pastel)] bg-[var(--kartu)] px-4 py-3.5 transition-transform active:scale-[.98]"
        >
          <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl bg-[var(--teal-muda)] text-[22px]">
            💉
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-judul text-sm font-bold text-[var(--teal-gelap)]">Isi Tanggal Vaksin</p>
            <p className="text-[10.5px] font-semibold leading-snug text-[var(--teks-sekunder)]">
              anak belum masuk SIMPUS (draf / sudah disetor)
            </p>
          </div>
          <span className="shrink-0 text-lg text-[var(--abu)]">›</span>
        </Link>

        <details className="group mt-3">
          <summary className="pop flex cursor-pointer list-none items-center justify-between rounded-[18px] border-2 border-[var(--garis-kader)] bg-[var(--kartu)] px-4 py-3 text-[14px] font-bold text-[var(--teal-gelap)] [&::-webkit-details-marker]:hidden">
            <span>🔗 Link Pojok Baca</span>
            <span className="text-[11px] font-semibold text-[var(--abu)] group-open:hidden">▾ buka</span>
            <span className="hidden text-[11px] font-semibold text-[var(--abu)] group-open:inline">▴ tutup</span>
          </summary>
          <div className="mt-2 rounded-[18px] border-2 border-[var(--garis-kader)] bg-[var(--kartu)] p-4">
            <p className="text-[10px] font-semibold leading-relaxed text-[var(--abu)]">
              Dipakai di Pojok Baca kader &amp; ortu (QR pendaftaran BPJS, tombol materi imunisasi).
            </p>
            <FormPengaturanPojok linkBpjs={pengaturan.linkBpjs} linkDrive={pengaturan.linkDrive} />
          </div>
        </details>

        <details className="group mt-3">
          <summary className="pop flex cursor-pointer list-none items-center justify-between rounded-[18px] border-2 border-[var(--garis-kader)] bg-[var(--kartu)] px-4 py-3 text-[14px] font-bold text-[var(--teal-gelap)] [&::-webkit-details-marker]:hidden">
            <span>➕ Buat akun kader</span>
            <span className="text-[11px] font-semibold text-[var(--abu)] group-open:hidden">▾ buka</span>
            <span className="hidden text-[11px] font-semibold text-[var(--abu)] group-open:inline">▴ tutup</span>
          </summary>
          <FormKader kelurahan={kelurahan.map((k) => ({
            id: k.id,
            nama: k.nama,
            posyandu: k.posyandu.map((p) => ({ id: p.id, label: `${p.nama} (${p.namaPosyandu})` })),
          }))} />
        </details>

        <details className="group mt-3">
          <summary className="pop flex cursor-pointer list-none items-center justify-between rounded-[18px] border-2 border-[var(--garis-ortu)] bg-[var(--kartu)] px-4 py-3 text-[14px] font-bold text-[var(--coral-gelap)] [&::-webkit-details-marker]:hidden">
            <span>➕ Buat akun ortu</span>
            <span className="text-[11px] font-semibold text-[var(--abu)] group-open:hidden">▾ buka</span>
            <span className="hidden text-[11px] font-semibold text-[var(--abu)] group-open:inline">▴ tutup</span>
          </summary>
          <div className="mt-2 rounded-[18px] border-2 border-[var(--garis-ortu)] bg-[var(--kartu)] p-4">
            <FormOrtu kelurahan={kelurahan.map((k) => ({ id: k.id, nama: k.nama }))} />
          </div>
        </details>

        <QrBagikan url={URL_APLIKASI} />

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
              <BarisNoHp id={u.id} noHp={u.noHp} />
              <div className="mt-2 flex gap-2">
                <TombolReset id={u.id} />
                <TombolAktif id={u.id} aktif={u.aktif} />
              </div>
              <TombolHapus id={u.id} nama={u.nama} />
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
          {grupOrtu.map((g) => (
            <details key={g.key} className="group rounded-[18px] border-2 border-[var(--garis-ortu)] bg-[var(--kartu)] px-3.5 py-2.5">
              <summary className="flex cursor-pointer list-none items-center justify-between text-[12.5px] font-bold text-[var(--teks-3)] [&::-webkit-details-marker]:hidden">
                <span className="truncate">{g.label}</span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <span
                    className="font-judul rounded-full px-2 py-0.5 text-[11px] font-bold"
                    style={{ background: "var(--coral-muda)", color: "var(--coral-gelap)" }}
                  >
                    {g.daftar.length}
                  </span>
                  <span className="text-[10px] font-semibold text-[var(--abu)] group-open:hidden">▾</span>
                  <span className="hidden text-[10px] font-semibold text-[var(--abu)] group-open:inline">▴</span>
                </span>
              </summary>
              <div className="mt-2.5 space-y-2">
                {g.daftar.map((u) => (
                  <div key={u.id} className="rounded-[16px] border-2 border-[var(--garis-ortu)] bg-white px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <p className="min-w-0 flex-1 truncate text-[13px] font-bold">
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
                    <TombolHapus id={u.id} nama={u.nama} />
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>

        <JudulSeksi judul="Admin" n={admin.length} />
        <div className="mt-2 space-y-2">
          {admin.map((u) => (
            <div key={u.id} className="rounded-[20px] border-2 border-[var(--garis-kader)] bg-[var(--kartu)] px-3.5 py-3 text-[13.5px]">
              <p className="truncate">
                <span className="font-bold">{u.nama}</span>{" "}
                <span className="text-[11px] font-semibold text-[var(--abu)]">@{u.username}</span>
              </p>
              <BarisNoHp id={u.id} noHp={u.noHp} />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
