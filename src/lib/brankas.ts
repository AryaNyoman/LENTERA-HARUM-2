import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/** Enkripsi PII at-rest (AES-256-GCM) — pola iv/tag/data seperti brankas SIMPUS.
 *  Kunci dari env KUNCI_SERVER (32 byte hex). PII anak TIDAK pernah tersimpan terbuka. */

function kunci(): Buffer {
  const hex = process.env.KUNCI_SERVER ?? "";
  if (!/^[0-9a-f]{64}$/i.test(hex)) {
    throw new Error("KUNCI_SERVER belum diisi (32 byte hex) — lihat .env.example");
  }
  return Buffer.from(hex, "hex");
}

export interface Tersegel {
  iv: string;
  tag: string;
  data: string;
}

/** Segel objek → {iv, tag, data} (base64). */
export function segel(obj: unknown): Tersegel {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", kunci(), iv);
  const teks = Buffer.from(JSON.stringify(obj), "utf8");
  const data = Buffer.concat([cipher.update(teks), cipher.final()]);
  return {
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    data: data.toString("base64"),
  };
}

/** Buka segel → objek. Lempar error bila kunci salah / data rusak. */
export function buka<T = unknown>(s: Tersegel): T {
  const decipher = createDecipheriv("aes-256-gcm", kunci(), Buffer.from(s.iv, "base64"));
  decipher.setAuthTag(Buffer.from(s.tag, "base64"));
  const teks = Buffer.concat([
    decipher.update(Buffer.from(s.data, "base64")),
    decipher.final(),
  ]);
  return JSON.parse(teks.toString("utf8")) as T;
}

/** Bentuk isi `data` untuk AnakSimpus & AnakBaru (JSON sebelum disegel). */
export interface IsiAnak {
  nama: string;
  tglLahir: string; // YYYY-MM-DD
  jk: "L" | "P" | "";
  namaOrtu: string;
  nik: string;
  noHp: string;
  alamat: string;
  rtRw: string;
  /** kode kanonik → tanggal YYYY-MM-DD */
  vaksin: Record<string, string>;
}
