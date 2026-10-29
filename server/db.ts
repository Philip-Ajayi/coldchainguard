import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { WHO_PQS_SEED_CORPUS } from './seedData.js';

const DB_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'coldchainguard.db');
export const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS who_manual_chunks (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      source TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS maintenance_audit_logs (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      clinic_id TEXT NOT NULL,
      technician_id TEXT NOT NULL,
      refrigerator_model TEXT NOT NULL,
      serial_number TEXT NOT NULL,
      blink_code INTEGER NOT NULL,
      voltage_reading REAL NOT NULL,
      resistance_reading REAL NOT NULL,
      identified_root_cause TEXT NOT NULL,
      corrective_action TEXT NOT NULL,
      cryptographic_hash TEXT NOT NULL,
      qr_payload TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS worker_telemetry (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_name TEXT NOT NULL,
      peak_memory_mb REAL NOT NULL,
      duration_ms INTEGER NOT NULL,
      exit_code INTEGER NOT NULL,
      timestamp TEXT NOT NULL
    );
  `);

  const countRow = db.prepare('SELECT COUNT(*) as count FROM who_manual_chunks').get() as { count: number };
  if (countRow.count === 0) {
    const insert = db.prepare(`
      INSERT INTO who_manual_chunks (id, category, title, source, content, tags)
      VALUES (@id, @category, @title, @source, @content, @tags)
    `);

    const insertMany = db.transaction((chunks) => {
      for (const chunk of chunks) {
        insert.run({
          ...chunk,
          tags: JSON.stringify(chunk.tags)
        });
      }
    });

    insertMany(WHO_PQS_SEED_CORPUS);
  }
}
