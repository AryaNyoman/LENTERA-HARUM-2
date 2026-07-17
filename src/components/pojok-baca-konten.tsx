/* Pojok Baca Imun (kader/ortu) — 4 blok: jadwal hari imunisasi, QR pendaftaran
 * BPJS, kontak petugas & kader, materi imunisasi. Data statis di src/lib/pojok-baca.ts;
 * kontak petugas/kader diambil dari User.noHp di database (diisi admin di halaman
 * Admin) — yang belum diisi pemilik tampil sebagai kartu "menunggu diisi petugas".
 * QR pakai lib `qrcode` yang sama dgn halaman QR klaim kader (server component). */
/* eslint-disable @next/next/no-img-element */

import QRCode from "qrcode";
import { db } from "@/lib/db";
import { ambilUser } from "@/lib/sesi";
import { JADWAL_HARI, LINK_BPJS, LINK_DRIVE, nomorInternasional } from "@/lib/pojok-baca";

function Placeholder({ pesan, border }: { pesan: string; border: string }) {
  return (
    <div className="rounded-[20px] border-[2.5px] border-dashed p-5 text-center" style={{ borderColor: border }}>
      <p className="text-xl">⏳</p>
      <p className="mt-1 text-[11px] font-semibold leading-relaxed text-[var(--teks-sekunder)]">{pesan}</p>
      <p className="mt-0.5 text-[10px] font-semibold text-[var(--abu)]">menunggu diisi petugas</p>
    </div>
  );
}

export default async function PojokBacaKonten({ peran = "kader" }: { peran?: "kader" | "ortu" }) {
  const ortu = peran === "ortu";
  const aksen = ortu ? "var(--coral-gelap)" : "var(--teal-gelap)";
  const kotak = ortu ? "var(--coral-muda)" : "var(--teal-muda)";
  const kartuBorder = ortu ? "var(--garis-ortu)" : "var(--garis-kader)";
  const pastel = ortu ? "var(--coral-pastel)" : "var(--teal-pastel)";
  const btn = ortu ? "btn3d-coral" : "btn3d-teal";

  const qrBpjs = LINK_BPJS ? await QRCode.toDataURL(LINK_BPJS, { margin: 1, width: 240 }) : "";

  // Kontak petugas (ADMIN) & kader — diambil dari User.noHp, ADMIN dulu lalu KADER by nama
  // (peran "ADMIN" < "KADER" alfabetis, orderBy peran+nama sudah menghasilkan urutan itu).
  const petugas = await db.user.findMany({
    where: { peran: { in: ["ADMIN", "KADER"] }, noHp: { not: "" } },
    include: { binaan: { include: { posyandu: true } } },
    orderBy: [{ peran: "asc" }, { nama: "asc" }],
  });

  // Sisi ortu: saring KADER ke kelurahan ortu (ADMIN selalu tampil). Fallback ke semua
  // kader bila ortu belum punya kelurahan ATAU hasil saring kosong — jangan sampai kosong.
  let kontak = petugas;
  if (ortu) {
    const sesi = await ambilUser();
    const akun = sesi ? await db.user.findUnique({ where: { id: sesi.id }, select: { kelurahanId: true } }) : null;
    const kelurahanId = akun?.kelurahanId ?? null;
    if (kelurahanId != null) {
      const disaring = petugas.filter(
        (p) => p.peran === "ADMIN" || p.binaan.some((b) => b.posyandu.kelurahanId === kelurahanId),
      );
      if (disaring.length > 0) kontak = disaring;
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-4 pb-6 pt-4">
      {/* 1 — Jadwal hari imunisasi */}
      <section className="pop rounded-[22px] border-2 bg-[var(--kartu)] p-4" style={{ borderColor: kartuBorder }}>
        <h2 className="font-judul text-sm font-bold" style={{ color: aksen }}>🗓️ Jadwal Imunisasi Puskesmas Cakranegara</h2>
        <div className="mt-2.5 flex flex-col gap-2">
          {JADWAL_HARI.map((j) => (
            <div key={j.hari} className="flex items-center gap-3 rounded-2xl px-3 py-2.5" style={{ background: kotak }}>
              <span className="font-judul shrink-0 rounded-full bg-[var(--kartu)] px-3 py-1 text-xs font-bold" style={{ color: aksen }}>
                {j.hari}
              </span>
              <p className="min-w-0 text-[12px] font-semibold leading-snug text-[var(--teks-3)]">{j.isi}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 2 — Pendaftaran online BPJS (QR) */}
      <section className="pop pop-1 rounded-[22px] border-2 bg-[var(--kartu)] p-4" style={{ borderColor: kartuBorder }}>
        <h2 className="font-judul text-sm font-bold" style={{ color: aksen }}>📱 Pendaftaran Online BPJS</h2>
        {qrBpjs ? (
          <div className="mt-2.5 text-center">
            <div className="inline-block rounded-[20px] border-[2.5px] border-dashed bg-[#fbfdfc] p-3" style={{ borderColor: pastel }}>
              <img src={qrBpjs} alt="QR pendaftaran online BPJS" width={216} height={216} className="block rounded-[10px]" />
            </div>
            <p className="mt-2 text-[11px] font-semibold leading-relaxed text-[var(--teks-sekunder)]">
              Pindai QR ini dengan kamera HP untuk mendaftar online lewat BPJS.
            </p>
          </div>
        ) : (
          <div className="mt-2.5">
            <Placeholder pesan="Link pendaftaran online BPJS belum tersedia." border={pastel} />
          </div>
        )}
      </section>

      {/* 3 — Kontak petugas & kader */}
      <section className="pop pop-2 rounded-[22px] border-2 bg-[var(--kartu)] p-4" style={{ borderColor: kartuBorder }}>
        <h2 className="font-judul text-sm font-bold" style={{ color: aksen }}>📞 Kontak Petugas Imunisasi &amp; Kader</h2>
        <div className="mt-2.5 flex flex-col gap-2">
          {kontak.length === 0 ? (
            <Placeholder pesan="Daftar kontak petugas & kader belum tersedia." border={pastel} />
          ) : (
            kontak.map((p) => {
              const intl = nomorInternasional(p.noHp);
              const labelPeran = p.peran === "ADMIN" ? "Petugas Puskesmas" : "Kader";
              const binaan = p.binaan.map((b) => b.posyandu.nama).join(", ");
              return (
                <div key={p.id} className="flex items-center gap-3 rounded-2xl border-2 px-3 py-2.5" style={{ borderColor: kartuBorder }}>
                  <div className="min-w-0 flex-1">
                    <p className="font-judul truncate text-[13px] font-bold" style={{ color: aksen }}>{p.nama}</p>
                    <p className="truncate text-[11px] font-semibold text-[var(--teks-sekunder)]">{labelPeran} · {p.noHp}</p>
                    {p.peran === "KADER" && binaan && (
                      <p className="truncate text-[10px] font-semibold text-[var(--abu)]">{binaan}</p>
                    )}
                  </div>
                  <a
                    href={`https://wa.me/${intl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`btn3d ${btn} inline-flex h-9 shrink-0 items-center px-3 text-xs`}
                    aria-label={`Chat WhatsApp ${p.nama}`}
                  >
                    WA
                  </a>
                  <a
                    href={`tel:+${intl}`}
                    className="flex h-9 shrink-0 items-center rounded-xl border-2 px-3 text-xs font-bold"
                    style={{ borderColor: kartuBorder, color: aksen }}
                    aria-label={`Telepon ${p.nama}`}
                  >
                    Telp
                  </a>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 4 — Materi imunisasi */}
      <section className="pop pop-3 rounded-[22px] border-2 bg-[var(--kartu)] p-4" style={{ borderColor: kartuBorder }}>
        <h2 className="font-judul text-sm font-bold" style={{ color: aksen }}>📚 Materi Imunisasi</h2>
        <div className="mt-2.5">
          {LINK_DRIVE ? (
            <a
              href={LINK_DRIVE}
              target="_blank"
              rel="noopener noreferrer"
              className={`btn3d ${btn} flex h-[48px] w-full items-center justify-center text-sm`}
            >
              Buka Materi Imunisasi 📂
            </a>
          ) : (
            <Placeholder pesan="Link materi imunisasi belum tersedia." border={pastel} />
          )}
        </div>
      </section>
    </div>
  );
}
