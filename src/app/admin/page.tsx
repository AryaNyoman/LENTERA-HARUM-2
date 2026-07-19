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

/** Judul sub-kelompok kecil (nama lingkungan/posyandu) di dalam <details> kelurahan.
 *  Label kosong ("Tanpa binaan"/"Tanpa klaim" tanpa sub-lingkungan) → tak dirender. */
function JudulSub({ label }: { label: string }) {
  if (!label) return null;
  return (
    <p className="mb-1.5 truncate text-[10px] font-extrabold uppercase tracking-wide text-[var(--abu)]">
      {label}
    </p>
  );
}

function TombolAktif({ id, aktif }: { id: number; aktif: boolean }) {
  return (
    <form action={setAktif} className="shrink-0">
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
 *  (pola sama dengan "🗑 Hapus" di src/app/ortu/anakku/page.tsx). Dipakai sebagai item flex
 *  (SATU BARIS sejajar dgn TombolReset/TombolAktif) — `[&[open]]:basis-full` membuatnya
 *  melebar penuh 1 baris baru saat kotak konfirmasi terbuka (parent WAJIB flex-wrap),
 *  supaya kotak konfirmasi tak sesak di kolom sempit. Named group (group/hapus) supaya
 *  label tidak ketularan state open `<details>` grup kelurahan pembungkusnya. */
function TombolHapus({ id, nama }: { id: number; nama: string }) {
  return (
    <details className="group/hapus [&[open]]:basis-full">
      <summary
        className="btn-garis flex h-[38px] cursor-pointer list-none items-center justify-center gap-1 rounded-xl border-2 px-2.5 text-[11.5px] font-bold [&::-webkit-details-marker]:hidden"
        style={{ borderColor: "var(--merah-border)", color: "var(--merah)" }}
      >
        <span className="group-open/hapus:hidden">🗑 Hapus</span>
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

/** Ringkasan tile "seksi atas" (Isi Vaksin / Link Pojok Baca / Buat akun ×2) — baris
 *  horizontal ikon+judul ringkas, cocok jadi kartu pendek grid-2-kolom (390px). */
function IsiTile({ ikon, judul, bg = "var(--teal-muda)" }: { ikon: string; judul: string; bg?: string }) {
  return (
    <>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm" style={{ background: bg }}>
        {ikon}
      </span>
      <span className="min-w-0 flex-1 truncate font-judul text-[11.5px] font-bold">{judul}</span>
    </>
  );
}

// ═══ Pengelompokan kader: KELURAHAN → LINGKUNGAN (posyandu binaan) — query sekali, ═══
// ═══ dikelompokkan di memori (PLAN ZB.2). Kader binaan >1 posyandu boleh duplikat.  ═══

type PosyanduRingkas = { id: number; nama: string; kelurahanId: number };
type KaderKartuData = {
  id: number;
  nama: string;
  username: string;
  noHp: string;
  aktif: boolean;
  perluGantiSandi: boolean;
  binaan: { posyandu: PosyanduRingkas }[];
};
type SubGrup<T> = { key: string; label: string; daftar: T[] };

function grupKaderKelompok(daftar: KaderKartuData[], kelurahanList: { id: number; nama: string }[]) {
  const perKel = new Map<number, Map<number, { nama: string; daftar: KaderKartuData[] }>>();
  const tanpaBinaan: KaderKartuData[] = [];
  for (const u of daftar) {
    if (u.binaan.length === 0) {
      tanpaBinaan.push(u);
      continue;
    }
    for (const b of u.binaan) {
      const kelId = b.posyandu.kelurahanId;
      if (!perKel.has(kelId)) perKel.set(kelId, new Map());
      const posMap = perKel.get(kelId)!;
      if (!posMap.has(b.posyandu.id)) posMap.set(b.posyandu.id, { nama: b.posyandu.nama, daftar: [] });
      posMap.get(b.posyandu.id)!.daftar.push(u);
    }
  }
  const hasil = kelurahanList
    .filter((k) => perKel.has(k.id))
    .map((k) => {
      const posMap = perKel.get(k.id)!;
      const sub: SubGrup<KaderKartuData>[] = [...posMap.entries()]
        .sort((a, b) => a[1].nama.localeCompare(b[1].nama))
        .map(([pid, v]) => ({ key: `p${pid}`, label: v.nama, daftar: v.daftar }));
      const n = new Set(sub.flatMap((s) => s.daftar.map((u) => u.id))).size;
      return { key: `k${k.id}`, label: k.nama, n, sub };
    });
  if (tanpaBinaan.length > 0) {
    hasil.push({ key: "tanpabinaan", label: "Tanpa binaan", n: tanpaBinaan.length, sub: [{ key: "semua", label: "", daftar: tanpaBinaan }] });
  }
  return hasil;
}

// ═══ Sub-kelompok ortu per lingkungan (posyandu anak yg diklaim) — PLAN ZB.3. ═══

type PosyanduByOrtu = Map<number, Map<number, string>>; // userId → posyanduId → nama posyandu

function subGrupOrtu<T extends { id: number }>(daftar: T[], posyanduByOrtu: PosyanduByOrtu): SubGrup<T>[] {
  const perPos = new Map<number, { nama: string; daftar: T[] }>();
  const tanpaKlaim: T[] = [];
  for (const u of daftar) {
    const ps = posyanduByOrtu.get(u.id);
    if (!ps || ps.size === 0) {
      tanpaKlaim.push(u);
      continue;
    }
    for (const [pid, nama] of ps) {
      if (!perPos.has(pid)) perPos.set(pid, { nama, daftar: [] });
      perPos.get(pid)!.daftar.push(u);
    }
  }
  const hasil: SubGrup<T>[] = [...perPos.entries()]
    .sort((a, b) => a[1].nama.localeCompare(b[1].nama))
    .map(([pid, v]) => ({ key: `p${pid}`, label: v.nama, daftar: v.daftar }));
  if (tanpaKlaim.length > 0) hasil.push({ key: "tanpaklaim", label: "Belum terhubung anak", daftar: tanpaKlaim });
  return hasil;
}

/** Kartu kader — aksi (Reset sandi · Nonaktifkan · Hapus) SATU BARIS sejajar (PLAN ZB.4). */
function KartuKader({ u }: { u: KaderKartuData }) {
  return (
    <div className="relative rounded-[20px] border-2 border-[var(--garis-kader)] bg-[var(--kartu)] px-3.5 py-3">
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
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <TombolReset id={u.id} />
        <TombolAktif id={u.id} aktif={u.aktif} />
        <TombolHapus id={u.id} nama={u.nama} />
      </div>
    </div>
  );
}

/** Kartu ortu ringkas — muat 2 kolom (PLAN ZB.4). */
function KartuOrtu({ u }: { u: { id: number; nama: string; username: string; aktif: boolean } }) {
  return (
    <div className="rounded-[16px] border-2 border-[var(--garis-ortu)] bg-white px-2.5 py-2.5">
      <p className="truncate text-[12.5px] font-bold">{u.nama}</p>
      <p className="truncate text-[10px] font-semibold text-[var(--abu)]">
        {u.username}
        {!u.aktif && (
          <span className="ml-1 rounded bg-[var(--merah-muda)] px-1 py-0.5 text-[9px] font-bold text-[var(--merah-teks)]">
            NONAKTIF
          </span>
        )}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <TombolAktif id={u.id} aktif={u.aktif} />
        <TombolHapus id={u.id} nama={u.nama} />
      </div>
    </div>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ galat?: string; ok?: string }>;
}) {
  const user = await wajibUser("ADMIN");
  const { galat, ok } = await searchParams;

  const [users, kelurahan, cache, pengaturan, batasSinkron, klaimOrtuRaw] = await Promise.all([
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
    // Sekali baca semua klaim ortu (+posyandu anak) — dikelompokkan di memori di bawah,
    // BUKAN query per kelompok (PLAN ZB.3).
    db.klaimAnak.findMany({
      where: { user: { peran: "ORTU" } },
      select: {
        userId: true,
        anakSimpus: { select: { posyandu: { select: { id: true, nama: true } } } },
        anakBaru: { select: { posyandu: { select: { id: true, nama: true } } } },
      },
    }),
  ]);

  const kader = users.filter((u) => u.peran === "KADER");
  const ortu = users.filter((u) => u.peran === "ORTU");
  const admin = users.filter((u) => u.peran === "ADMIN");

  const posyanduByOrtu: PosyanduByOrtu = new Map();
  for (const k of klaimOrtuRaw) {
    const p = k.anakSimpus?.posyandu ?? k.anakBaru?.posyandu;
    if (!p) continue;
    if (!posyanduByOrtu.has(k.userId)) posyanduByOrtu.set(k.userId, new Map());
    posyanduByOrtu.get(k.userId)!.set(p.id, p.nama);
  }

  // grup ortu per kelurahan (domisili, urutan ikut kelurahan.urutan), tanpa-kelurahan di grup terakhir
  const grupOrtu = [
    ...kelurahan.map((k) => ({ key: `k${k.id}`, label: k.nama, daftar: ortu.filter((u) => u.kelurahanId === k.id) })),
    { key: "tanpa", label: "Belum pilih kelurahan", daftar: ortu.filter((u) => u.kelurahanId == null) },
  ].filter((g) => g.daftar.length > 0);

  const grupKader = grupKaderKelompok(kader, kelurahan);

  const kelurahanFormKader = kelurahan.map((k) => ({
    id: k.id,
    nama: k.nama,
    posyandu: k.posyandu.map((p) => ({ id: p.id, label: `${p.nama} (${p.namaPosyandu})` })),
  }));
  const kelurahanFormOrtu = kelurahan.map((k) => ({ id: k.id, nama: k.nama }));

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

        {/* Kartu Sinkron SIMPUS — mobile-first: ikon+judul, teks keterangan full-width,
            tombol full-width, caption di bawah tombol. ≥sm boleh berdampingan lagi.
            (PLAN ZB.1 — perbaikan bug tumpang tindih layar sempit.) */}
        <section className="pop rounded-[22px] border-2 border-[var(--teal-pastel)] bg-[var(--kartu)] px-4 py-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl bg-[var(--teal-muda)] text-[22px]">
              ☁️
            </span>
            <p className="font-judul min-w-0 flex-1 text-sm font-bold text-[var(--teal-gelap)]">Sinkron SIMPUS</p>
          </div>
          <div className="mt-2.5 sm:flex sm:items-end sm:justify-between sm:gap-3">
            <p className="text-[10.5px] font-semibold leading-snug text-[var(--teks-sekunder)] sm:min-w-0 sm:flex-1">
              {cache
                ? `Tarikan terakhir: ${cache.sinkronPada.toLocaleString("id-ID")}.`
                : "Belum pernah tarik data."}{" "}
              Otomatis berjalan tiap minggu; bisa juga ditarik manual.
            </p>
            <form action={tarikSimpus} className="mt-2.5 [&_button]:w-full sm:mt-0 sm:shrink-0 sm:[&_button]:w-auto">
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

        {/* Seksi atas: 4 tile pendek grid 2 kolom (Isi Vaksin · Link Pojok Baca · Buat
            akun kader · Buat akun ortu) — muat rapi di 390px, jauh lebih pendek dari
            4 baris full-width sebelumnya. Tiap <details> melebar penuh (col-span-2) saat
            dibuka supaya form di dalamnya tak sesak. QR Bagikan tetap full-width di luar
            grid (markup-nya di qr-bagikan.tsx, tak diubah — aman biarkan lebar penuh).
            (PLAN ZB — panduan horizontal/compact.) */}
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <Link
            href="/admin/vaksin"
            prefetch={false}
            className="pop flex items-center gap-2 rounded-[18px] border-2 border-[var(--teal-pastel)] bg-[var(--kartu)] px-3 py-3 text-[var(--teal-gelap)] transition-transform active:scale-[.98]"
          >
            <IsiTile ikon="💉" judul="Isi Tgl Vaksin" />
            <span className="shrink-0 text-sm text-[var(--abu)]">›</span>
          </Link>

          <details className="group [&[open]]:col-span-2">
            <summary className="pop flex cursor-pointer list-none items-center gap-2 rounded-[18px] border-2 border-[var(--garis-kader)] bg-[var(--kartu)] px-3 py-3 text-[var(--teal-gelap)] [&::-webkit-details-marker]:hidden">
              <IsiTile ikon="🔗" judul="Link Pojok Baca" />
              <span className="shrink-0 text-[10px] font-semibold text-[var(--abu)] group-open:hidden">▾</span>
              <span className="hidden shrink-0 text-[10px] font-semibold text-[var(--abu)] group-open:inline">▴</span>
            </summary>
            <div className="mt-2 rounded-[18px] border-2 border-[var(--garis-kader)] bg-[var(--kartu)] p-4">
              <p className="text-[10px] font-semibold leading-relaxed text-[var(--abu)]">
                Dipakai di Pojok Baca kader &amp; ortu (QR pendaftaran BPJS, tombol materi imunisasi).
              </p>
              <FormPengaturanPojok linkBpjs={pengaturan.linkBpjs} linkDrive={pengaturan.linkDrive} />
            </div>
          </details>

          <details className="group [&[open]]:col-span-2">
            <summary className="pop flex cursor-pointer list-none items-center gap-2 rounded-[18px] border-2 border-[var(--garis-kader)] bg-[var(--kartu)] px-3 py-3 text-[var(--teal-gelap)] [&::-webkit-details-marker]:hidden">
              <IsiTile ikon="➕" judul="Buat akun kader" />
              <span className="shrink-0 text-[10px] font-semibold text-[var(--abu)] group-open:hidden">▾</span>
              <span className="hidden shrink-0 text-[10px] font-semibold text-[var(--abu)] group-open:inline">▴</span>
            </summary>
            <FormKader kelurahan={kelurahanFormKader} />
          </details>

          <details className="group [&[open]]:col-span-2">
            <summary className="pop flex cursor-pointer list-none items-center gap-2 rounded-[18px] border-2 border-[var(--garis-ortu)] bg-[var(--kartu)] px-3 py-3 text-[var(--coral-gelap)] [&::-webkit-details-marker]:hidden">
              <IsiTile ikon="➕" judul="Buat akun ortu" bg="var(--coral-muda)" />
              <span className="shrink-0 text-[10px] font-semibold text-[var(--abu)] group-open:hidden">▾</span>
              <span className="hidden shrink-0 text-[10px] font-semibold text-[var(--abu)] group-open:inline">▴</span>
            </summary>
            <div className="mt-2 rounded-[18px] border-2 border-[var(--garis-ortu)] bg-[var(--kartu)] p-4">
              <FormOrtu kelurahan={kelurahanFormOrtu} />
            </div>
          </details>
        </div>

        <QrBagikan url={URL_APLIKASI} />

        <JudulSeksi judul="Kader" n={kader.length} />
        <div className="mt-2 space-y-2.5">
          {kader.length === 0 && (
            <p className="text-xs font-semibold text-[var(--teks-sekunder)]">Belum ada akun kader.</p>
          )}
          {grupKader.map((g) => (
            <details key={g.key} className="group rounded-[18px] border-2 border-[var(--garis-kader)] bg-[var(--kartu)] px-3.5 py-2.5">
              <summary className="flex cursor-pointer list-none items-center justify-between text-[12.5px] font-bold text-[var(--teks-3)] [&::-webkit-details-marker]:hidden">
                <span className="truncate">{g.label}</span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <span
                    className="font-judul rounded-full px-2 py-0.5 text-[11px] font-bold"
                    style={{ background: "var(--teal-muda)", color: "var(--teal-gelap)" }}
                  >
                    {g.n}
                  </span>
                  <span className="text-[10px] font-semibold text-[var(--abu)] group-open:hidden">▾</span>
                  <span className="hidden text-[10px] font-semibold text-[var(--abu)] group-open:inline">▴</span>
                </span>
              </summary>
              <div className="mt-2.5 space-y-3">
                {g.sub.map((s) => (
                  <div key={s.key}>
                    <JudulSub label={s.label} />
                    <div className="space-y-2">
                      {s.daftar.map((u) => (
                        <KartuKader key={u.id} u={u} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </details>
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
              <div className="mt-2.5 space-y-3">
                {subGrupOrtu(g.daftar, posyanduByOrtu).map((s) => (
                  <div key={s.key}>
                    <JudulSub label={s.label} />
                    <div className="grid grid-cols-2 gap-2">
                      {s.daftar.map((u) => (
                        <KartuOrtu key={u.id} u={u} />
                      ))}
                    </div>
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
