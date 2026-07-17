import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ambilUser } from "@/lib/sesi";
import { binaanIds } from "@/lib/anak";
import { buka, type IsiAnak } from "@/lib/brankas";
import { bangunExcelAnak, type BarisExport } from "@/lib/excel-anak";

/** GET /kader/export → unduh .xlsx anak BARU (DRAF/DIEKSPOR) format "Impor Data Anak" SIMPUS,
 *  lalu tandai DRAF → DIEKSPOR. Scope: posyandu binaan (admin: semua). */
export async function GET(req: Request): Promise<Response> {
  const user = await ambilUser();
  if (!user || (user.peran !== "KADER" && user.peran !== "ADMIN")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const ids = await binaanIds(user);
  const rows = await db.anakBaru.findMany({
    // Anak yang diinput orang tua & BELUM diverifikasi kader tidak ikut export
    // (cegah duplikat/data mentah masuk SIMPUS sebelum diperiksa).
    where: {
      posyanduId: { in: ids },
      status: { in: ["DRAF", "DIEKSPOR"] },
      NOT: { olehOrtu: true, terverifikasi: false },
    },
    include: { posyandu: true },
    orderBy: { id: "asc" },
  });

  const baris: BarisExport[] = [];
  const idsDraf: number[] = [];
  for (const r of rows) {
    try {
      baris.push({
        isi: buka<IsiAnak>({ iv: r.iv, tag: r.tag, data: r.data }),
        posyanduNama: r.posyandu.nama, // PERSIS master → impor SIMPUS cocok "persis"
      });
      if (r.status === "DRAF") idsDraf.push(r.id);
    } catch { /* lewati data rusak */ }
  }

  if (baris.length === 0) {
    // Kasitau ramah kenapa kosong: paling sering karena isian ortu belum diverifikasi.
    const menungguVerif = await db.anakBaru.count({
      where: { posyanduId: { in: ids }, status: "DRAF", olehOrtu: true, terverifikasi: false },
    });
    const pesan =
      menungguVerif > 0
        ? `Belum ada anak yang bisa disetor — ${menungguVerif} anak isian orang tua masih menunggu verifikasi. Buka Daftar Bayi, verifikasi dulu, lalu Export lagi.`
        : "Tidak ada anak baru untuk diekspor.";
    const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Export SIMPUS</title></head>
<body style="margin:0;min-height:100dvh;display:flex;align-items:center;justify-content:center;background:#f4faf7;font-family:system-ui,sans-serif;padding:24px">
<div style="max-width:420px;background:#fff;border:2px solid #f0dfa0;border-radius:22px;padding:24px;text-align:center">
<p style="font-size:34px;margin:0">🟡</p>
<p style="margin:10px 0 0;font-weight:800;color:#8a5a06">${pesan}</p>
<p style="margin:16px 0 0"><a href="/kader/daftar-bayi" style="display:inline-block;background:#2e9e8f;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:14px;box-shadow:0 4px 0 #22766b">← Kembali ke Daftar Bayi</a></p>
</div></body></html>`;
    return new NextResponse(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  const wb = bangunExcelAnak(baris);
  const buf = await wb.xlsx.writeBuffer();

  if (idsDraf.length > 0) {
    await db.anakBaru.updateMany({ where: { id: { in: idsDraf } }, data: { status: "DIEKSPOR" } });
  }
  await db.logAktivitas.create({
    data: { userId: user.id, aksi: "EXPORT_EXCEL", detail: `${baris.length} anak` },
  });

  const tgl = new Date().toISOString().slice(0, 10);
  return new NextResponse(buf as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="impor-anak-lentera-harum-${tgl}.xlsx"`,
    },
  });
}
