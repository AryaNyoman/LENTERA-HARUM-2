// Ganti provider Prisma sqlite <-> postgresql (pola keluarga Simpus-Imun).
// Dipakai build Railway: `node scripts/swap-provider.mjs postgresql`
// Kembali ke dev lokal: `node scripts/swap-provider.mjs sqlite`
import { readFileSync, writeFileSync } from "node:fs";

const target = process.argv[2];
if (target !== "postgresql" && target !== "sqlite") {
  console.error('Pakai: node scripts/swap-provider.mjs <postgresql|sqlite>');
  process.exit(1);
}
const path = new URL("../prisma/schema.prisma", import.meta.url);
const isi = readFileSync(path, "utf8");
const baru = isi.replace(/provider = "(sqlite|postgresql)"/, `provider = "${target}"`);
writeFileSync(path, baru);
console.log(`schema.prisma → provider "${target}"`);
