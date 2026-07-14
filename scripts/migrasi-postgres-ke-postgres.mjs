// Migrasi lengkap PostgreSQL -> PostgreSQL melalui dua Prisma Client.
// Tidak mendekripsi data dan tidak mencetak isi baris.
// Jalankan dengan SOURCE_PG_URL dan TARGET_PG_URL.
import { PrismaClient, Prisma } from "@prisma/client";
import { buildResetSequenceSql } from "./postgres-sequence.mjs";

const SOURCE_PG_URL = process.env.SOURCE_PG_URL;
const TARGET_PG_URL = process.env.TARGET_PG_URL;
if (!SOURCE_PG_URL || !TARGET_PG_URL) {
  console.error("SOURCE_PG_URL dan TARGET_PG_URL wajib diset.");
  process.exit(1);
}
if (SOURCE_PG_URL === TARGET_PG_URL) {
  console.error("Sumber dan tujuan tidak boleh sama.");
  process.exit(1);
}

// Ambil hostname saja dari connection string -- tidak pernah mencetak kredensial/path/query.
function hostOf(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const sourceHost = hostOf(SOURCE_PG_URL);
const targetHost = hostOf(TARGET_PG_URL);
console.log(`Sumber (baca-saja): ${sourceHost ?? "(hostname tidak terbaca)"}`);
console.log(`Tujuan (akan di-TRUNCATE): ${targetHost ?? "(hostname tidak terbaca)"}`);

// Pengaman anti-tertukar: operator wajib mengetik ulang hostname tujuan yang dia maksud
// (dari rencana migrasi). Kalau TARGET_PG_URL keliru diisi (mis. tertukar dengan Neon
// produksi), hostname aktual tidak akan cocok -- migrasi dibatalkan sebelum TRUNCATE.
const KONFIRMASI_TARGET_HOST = process.env.KONFIRMASI_TARGET_HOST;
if (!targetHost || KONFIRMASI_TARGET_HOST !== targetHost) {
  console.error(
    `KONFIRMASI_TARGET_HOST harus persis "${targetHost ?? "(tidak terbaca)"}", diterima "${KONFIRMASI_TARGET_HOST ?? "(tidak diset)"}". Migrasi dibatalkan sebelum TRUNCATE.`,
  );
  process.exit(1);
}

const src = new PrismaClient({ datasources: { db: { url: SOURCE_PG_URL } } });
const dst = new PrismaClient({ datasources: { db: { url: TARGET_PG_URL } } });
const models = Prisma.dmmf.datamodel.models;
const camel = (name) => name.charAt(0).toLowerCase() + name.slice(1);
const table = (model) => `"${model.dbName || model.name}"`;

// Urutkan parent sebelum child berdasarkan foreign key.
const dependencies = {};
for (const model of models) {
  dependencies[model.name] = new Set();
  for (const field of model.fields) {
    if (field.kind === "object" && field.relationFromFields?.length && field.type !== model.name) {
      dependencies[model.name].add(field.type);
    }
  }
}
const order = [];
const visited = new Set();
function visit(name, stack = new Set()) {
  if (visited.has(name) || stack.has(name)) return;
  stack.add(name);
  for (const dependency of dependencies[name]) visit(dependency, stack);
  stack.delete(name);
  visited.add(name);
  order.push(name);
}
for (const model of models) visit(model.name);

async function main() {
  console.log(`Tabel terdeteksi: ${models.length}`);

  // Tujuan adalah database baru. TRUNCATE membuat proses dapat diulang secara deterministik.
  await dst.$executeRawUnsafe(
    `TRUNCATE TABLE ${models.map(table).join(", ")} RESTART IDENTITY CASCADE`,
  );
  console.log("Database tujuan dikosongkan. Mulai penyalinan...");

  const report = [];
  for (const name of order) {
    const accessor = camel(name);
    const rows = await src[accessor].findMany();
    for (let offset = 0; offset < rows.length; offset += 250) {
      await dst[accessor].createMany({
        data: rows.slice(offset, offset + 250),
        skipDuplicates: true,
      });
    }
    const targetCount = await dst[accessor].count();
    const ok = rows.length === targetCount;
    report.push({ tabel: name, sumber: rows.length, tujuan: targetCount, status: ok ? "OK" : "BEDA" });
    console.log(`${name}: ${rows.length} -> ${targetCount} ${ok ? "OK" : "BEDA"}`);
  }

  // Sinkronkan sequence untuk semua model dengan id serial integer.
  for (const model of models) {
    const id = model.fields.find((field) => field.name === "id");
    if (!id?.isId || id.type !== "Int" || !id.hasDefaultValue) continue;
    await dst.$executeRawUnsafe(buildResetSequenceSql(model.dbName || model.name));
  }

  const differences = report.filter((row) => row.status !== "OK");
  if (differences.length) {
    console.error(`Migrasi selesai dengan ${differences.length} tabel berbeda.`);
    process.exitCode = 2;
  } else {
    console.log(`MIGRASI BERHASIL: ${report.length} tabel memiliki jumlah baris identik.`);
  }
}

main()
  .catch((error) => {
    console.error("MIGRASI GAGAL:", error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.allSettled([src.$disconnect(), dst.$disconnect()]);
  });
