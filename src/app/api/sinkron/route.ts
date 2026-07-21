import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jalankanSinkron } from "@/lib/sinkron";

export const maxDuration = 300; // tarikan penuh bisa lama (ribuan anak)

/** Pemicu sinkron terjadwal (Railway cron mingguan):
 *  GET /api/sinkron?rahasia=<CRON_SECRET>  — tanpa login, dilindungi rahasia env. */
export async function GET(req: Request): Promise<Response> {
  const rahasia = new URL(req.url).searchParams.get("rahasia") ?? "";
  if (!process.env.CRON_SECRET || rahasia !== process.env.CRON_SECRET) {
    return NextResponse.json({ galat: "rahasia salah" }, { status: 401 });
  }
  try {
    const h = await jalankanSinkron();
    await db.logAktivitas.create({
      data: { aksi: "SINKRON_CRON", detail: `${h.posyandu} posyandu · ${h.anak} anak · ${h.jadwal} jadwal · ${h.dicocokkan} dicocokkan` },
    });
    return NextResponse.json({ ok: true, ...h });
  } catch (e) {
    const pesan = e instanceof Error ? e.message : "gagal";
    await db.logAktivitas.create({ data: { aksi: "SINKRON_CRON_GAGAL", detail: pesan } });
    return NextResponse.json({ ok: false, galat: pesan }, { status: 500 });
  }
}
