import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const dbPath = 'd:/hotel/Ann_Villa/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/f0dcbcf5840a2643f416c808c0e38b6cb6a61d2f431f45a8a6dafb26fbd23ac7.sqlite';

export function getDb() {
  return new DatabaseSync(dbPath);
}

const action = process.argv[2] || 'list-tables';

if (action === 'list-tables') {
  const db = getDb();
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  console.log('Tables:', tables.map(t => t.name));
  db.close();
} else if (action === 'exec-file') {
  const file = process.argv[3];
  if (!file) {
    console.error('File required');
    process.exit(1);
  }
  const sql = fs.readFileSync(file, 'utf-8');
  const db = getDb();
  db.exec(sql);
  console.log(`Successfully executed ${file}`);
  db.close();
} else if (action === 'query') {
  const query = process.argv[3];
  const db = getDb();
  console.log(db.prepare(query).all());
  db.close();
}
