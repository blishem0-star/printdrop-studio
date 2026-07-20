import 'dotenv/config';
import { createClient } from '@libsql/client';
import { mkdirSync, writeFileSync, readdirSync, unlinkSync, copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Daily database backup. Works for both deployment modes:
// - local file DB: copies prisma/dev.db as-is
// - Turso (libsql://): dumps every table to JSON via the libsql client
// Keeps the last 14 backups. Run manually or via a scheduled task:
//   npx tsx scripts/backup-db.ts

const KEEP = 14;
const BACKUP_DIR = join(process.cwd(), 'backups');
const url = process.env.DATABASE_URL ?? 'file:./dev.db';

async function main() {
  mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');

  if (url.startsWith('file:')) {
    const dbPath = join(process.cwd(), 'prisma', url.replace('file:./', ''));
    const src = existsSync(dbPath) ? dbPath : join(process.cwd(), url.replace('file:', ''));
    const dest = join(BACKUP_DIR, `db-${stamp}.db`);
    copyFileSync(src, dest);
    console.log('local backup written:', dest);
  } else {
    const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN || undefined });
    const tables = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma%'"
    );
    const dump: Record<string, unknown[]> = {};
    for (const row of tables.rows) {
      const name = String(row.name);
      const data = await client.execute(`SELECT * FROM "${name}"`);
      dump[name] = data.rows;
    }
    const dest = join(BACKUP_DIR, `db-${stamp}.json`);
    writeFileSync(dest, JSON.stringify(dump));
    console.log('remote dump written:', dest, `(${Object.keys(dump).length} tables)`);
  }

  // Rotate: keep the newest KEEP backups
  const files = readdirSync(BACKUP_DIR).filter(f => f.startsWith('db-')).sort();
  for (const old of files.slice(0, Math.max(0, files.length - KEEP))) {
    unlinkSync(join(BACKUP_DIR, old));
    console.log('rotated out:', old);
  }
}

main().catch(e => { console.error('backup failed:', e); process.exit(1); });
