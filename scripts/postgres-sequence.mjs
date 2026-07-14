function quoteIdentifier(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function quoteLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

/** SQL reset sequence setelah migrasi yang mempertahankan nilai id asli. */
export function buildResetSequenceSql(tableName) {
  const table = quoteIdentifier(tableName);
  const regclass = quoteLiteral(table);
  return `SELECT setval(pg_get_serial_sequence(${regclass}, 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 1), EXISTS(SELECT 1 FROM ${table}))`;
}
