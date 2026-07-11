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
    where: { posyanduId: { in: ids }, status: { in: ["DRAF", "DIEKSPOR"] } },
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
    return new NextResponse("Tidak ada anak baru untuk diekspor.", { status: 404 });
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
      "Content-Disposition": `attachment; filename="impor-anak-simpus-posyandu-${tgl}.xlsx"`,
    },
  });
}
