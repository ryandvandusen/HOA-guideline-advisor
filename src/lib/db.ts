import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const globalWithDb = global as typeof global & { __db?: Database.Database };

export function getDb(): Database.Database {
  if (!globalWithDb.__db) {
    const dbPath = process.env.DATABASE_PATH!;
    const dir = path.dirname(dbPath);
    fs.mkdirSync(dir, { recursive: true });

    globalWithDb.__db = new Database(dbPath);
    globalWithDb.__db.pragma('journal_mode = WAL');
    initSchema(globalWithDb.__db);
  }
  return globalWithDb.__db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      photo_path TEXT,
      session_messages TEXT DEFAULT '[]',
      compliance_status TEXT DEFAULT 'pending',
      ai_summary TEXT,
      issues_found TEXT DEFAULT '[]',
      guideline_slug TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS violation_reports (
      id TEXT PRIMARY KEY,
      property_address TEXT NOT NULL,
      description TEXT NOT NULL,
      photo_path TEXT,
      reporter_notes TEXT,
      status TEXT DEFAULT 'pending',
      admin_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}
