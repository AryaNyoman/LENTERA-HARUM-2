import ExcelJS from "exceljs";
import { DOSIS_REGISTRY, tglDosis } from "@/lib/vaksin";
import type { IsiAnak } from "@/lib/brankas";

/** Baris export: isi anak (terbuka) + nama posyandu PERSIS master SIMPUS. */
export interface BarisExport {
  isi: IsiAnak;
  posyanduNama: string;
}

/** "2026-03-06" → "06/03/2026" (format tanggal template SIMPUS). */
export function keDDMMYYYY(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}

/** Header PERSIS template "Impor Data Anak" SIMPUS (template-anak.ts):
 *  9 kolom identitas + 1 kolom per dosis registry (urut & nama sama). */
export const HEADER_EXPORT: string[] = [
  "Nama", "Tgl Lahir", "JK (L/P)", "Nama Ortu", "NIK", "No HP", "Alamat", "RT/RW", "Posyandu",
  ...DOSIS_REGISTRY.map((d) => d.nama),
];

/** Bangun workbook Excel yang dikenali menu "Impor Data Anak (file lain)" SIMPUS.
 *  1 sheet "Data Anak", 1 baris = 1 anak, tanggal DD/MM/YYYY.
 *  Dosis varian merek (HEXA*, ROTARIX*) masuk ke KOLOM SLOT-nya (mis. HEXA1 → "DPT-HB-Hib (1)"). */
export function bangunExcelAnak(baris: BarisExport[]): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  wb.creator = "SIMPUS-POSYANDU";
  const ws = wb.addWorksheet("Data Anak");

  const h = ws.addRow(HEADER_EXPORT);
  h.font = { bold: true };
  h.alignment = { wrapText: true, vertical: "middle", horizontal: "center" };
  ws.getColumn(1).width = 22;
  ws.getColumn(2).width = 12;
  ws.getColumn(4).width = 18;
  ws.getColumn(7).width = 20;
  ws.getColumn(9).width = 22;
  for (let c = 10; c <= HEADER_EXPORT.length; c++) ws.getColumn(c).width = 12;

  for (const b of baris) {
    ws.addRow([
      b.isi.nama,
      keDDMMYYYY(b.isi.tglLahir),
      b.isi.jk,
      b.isi.namaOrtu,
      b.isi.nik,
      b.isi.noHp,
      b.isi.alamat,
      b.isi.rtRw,
      b.posyanduNama,
      ...DOSIS_REGISTRY.map((d) => keDDMMYYYY(tglDosis(b.isi.vaksin, d.kode))),
    ]);
  }
  return wb;
}
