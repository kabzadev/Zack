import Database from 'better-sqlite3';
import path from 'path';
import { randomUUID } from 'crypto';

const DB_PATH = path.join(__dirname, '..', '..', 'pinpoint.db');

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Helper to generate UUIDs (SQLite doesn't have gen_random_uuid)
db.function('gen_random_uuid', () => randomUUID());

export default db;

// Initialize database tables
export const initDatabase = async () => {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
        phone_number TEXT UNIQUE NOT NULL,
        name TEXT,
        role TEXT DEFAULT 'estimator',
        status TEXT DEFAULT 'pending',
        requested_at TEXT DEFAULT (datetime('now')),
        approved_at TEXT,
        approved_by TEXT,
        last_login_at TEXT,
        login_count INTEGER DEFAULT 0,
        estimates_created INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS device_sessions (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        device_name TEXT,
        device_type TEXT,
        refresh_token TEXT UNIQUE,
        ip_address TEXT,
        user_agent TEXT,
        is_active INTEGER DEFAULT 1,
        last_active_at TEXT DEFAULT (datetime('now')),
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS otp_attempts (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
        phone_number TEXT NOT NULL,
        otp_code TEXT,
        expires_at TEXT,
        attempts INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
      CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON device_sessions(refresh_token);
      CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_attempts(phone_number);
    `);

    console.log('SQLite database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};
