import { Pool, QueryResult } from 'pg';
import BetterSqlite3 from 'better-sqlite3';
import path from 'path';
import { randomUUID } from 'crypto';

// Determine which database to use
const USE_POSTGRES = !!(process.env.AZURE_PG_HOST || process.env.DATABASE_URL);

// ─── Database Adapter Interface ───
interface DbAdapter {
  prepare(sql: string): {
    get(...params: any[]): any;
    all(...params: any[]): any[];
    run(...params: any[]): { changes: number };
  };
  exec(sql: string): void;
  pragma?(key: string): void;
  function?(name: string, fn: (...args: any[]) => any): void;
}

// ─── PostgreSQL Adapter ───
class PostgresAdapter implements DbAdapter {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.AZURE_PG_HOST,
      port: parseInt(process.env.AZURE_PG_PORT || '5432'),
      database: process.env.AZURE_PG_DATABASE || 'pinpoint_db',
      user: process.env.AZURE_PG_USER,
      password: process.env.AZURE_PG_PASSWORD,
      ssl: process.env.AZURE_PG_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    this.pool.on('error', (err) => {
      console.error('PostgreSQL pool error:', err.message);
    });
  }

  // Convert SQLite ? placeholders to PostgreSQL $1, $2, ... 
  private convertPlaceholders(sql: string): string {
    let idx = 0;
    return sql.replace(/\?/g, () => `$${++idx}`);
  }

  // Convert SQLite-specific SQL to PostgreSQL
  private convertSql(sql: string): string {
    let pgSql = this.convertPlaceholders(sql);
    // datetime('now') → NOW()
    pgSql = pgSql.replace(/datetime\('now'\)/gi, 'NOW()');
    // INTEGER → INT
    pgSql = pgSql.replace(/\bINTEGER\b/gi, 'INT');
    // TEXT PRIMARY KEY DEFAULT (lower(...)) → TEXT PRIMARY KEY DEFAULT gen_random_uuid()
    pgSql = pgSql.replace(/TEXT PRIMARY KEY DEFAULT \(lower\(hex\(randomblob.*?\)\)\)/gi, 'TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text');
    return pgSql;
  }

  prepare(sql: string) {
    const pgSql = this.convertSql(sql);
    const pool = this.pool;

    // We need sync-like behavior but pg is async. Use a blocking wrapper via synchronous query execution.
    // Since Express handlers are async-compatible, we'll store the query and execute lazily.
    return {
      get(...params: any[]): any {
        // This needs to be sync for compatibility — we'll use a workaround
        // Store for async execution
        (this as any)._sql = pgSql;
        (this as any)._params = params;
        (this as any)._pool = pool;
        return undefined; // Will be replaced by async wrapper
      },
      all(...params: any[]): any[] {
        return [];
      },
      run(...params: any[]): { changes: number } {
        return { changes: 0 };
      },
    };
  }

  exec(sql: string): void {
    // Fire and forget for DDL
    const pgSql = this.convertSql(sql);
    this.pool.query(pgSql).catch(err => console.error('exec error:', err.message));
  }

  // Expose pool for direct async queries
  get queryPool(): Pool {
    return this.pool;
  }
}

// ─── SQLite Adapter (existing) ───
function createSqliteAdapter(): BetterSqlite3.Database {
  const DB_PATH = process.env.DB_PATH || (
    process.env.NODE_ENV === 'production' 
      ? '/tmp/pinpoint.db' 
      : path.join(__dirname, '..', '..', 'pinpoint.db')
  );
  const sqliteDb = new BetterSqlite3(DB_PATH);
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.function('gen_random_uuid', () => randomUUID());
  return sqliteDb;
}

// ─── Exports ───

// For PostgreSQL, we export an async query helper instead
let pgPool: Pool | null = null;
let sqliteDb: BetterSqlite3.Database | null = null;

if (USE_POSTGRES) {
  pgPool = new Pool({
    host: process.env.AZURE_PG_HOST,
    port: parseInt(process.env.AZURE_PG_PORT || '5432'),
    database: process.env.AZURE_PG_DATABASE || 'pinpoint_db',
    user: process.env.AZURE_PG_USER,
    password: process.env.AZURE_PG_PASSWORD,
    ssl: process.env.AZURE_PG_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
  pgPool.on('error', (err) => console.error('PG pool error:', err.message));
  console.log(`Connecting to PostgreSQL at ${process.env.AZURE_PG_HOST}...`);
} else {
  sqliteDb = createSqliteAdapter();
  console.log('Using SQLite database');
}

// Async query function that works with both backends
export async function query(sql: string, params: any[] = []): Promise<any[]> {
  if (pgPool) {
    // Convert ? to $1, $2, ...
    let idx = 0;
    const pgSql = sql
      .replace(/\?/g, () => `$${++idx}`)
      .replace(/datetime\('now'\)/gi, 'NOW()')
      .replace(/\bINTEGER\b/gi, 'INT');
    const result = await pgPool.query(pgSql, params);
    return result.rows;
  } else {
    const stmt = sqliteDb!.prepare(sql);
    if (sql.trim().toUpperCase().startsWith('SELECT') || sql.trim().toUpperCase().startsWith('WITH')) {
      return stmt.all(...params);
    } else {
      const info = stmt.run(...params);
      return [{ changes: info.changes }];
    }
  }
}

// Single row query
export async function queryOne(sql: string, params: any[] = []): Promise<any | undefined> {
  if (pgPool) {
    let idx = 0;
    const pgSql = sql
      .replace(/\?/g, () => `$${++idx}`)
      .replace(/datetime\('now'\)/gi, 'NOW()')
      .replace(/\bINTEGER\b/gi, 'INT');
    const result = await pgPool.query(pgSql, params);
    return result.rows[0];
  } else {
    return sqliteDb!.prepare(sql).get(...params);
  }
}

// Execute (DDL, multi-statement)
export async function execute(sql: string): Promise<void> {
  if (pgPool) {
    const pgSql = sql
      .replace(/datetime\('now'\)/gi, 'NOW()')
      .replace(/\bINTEGER\b/gi, 'INT')
      // SQLite UUID default → PG gen_random_uuid()
      .replace(/DEFAULT \(lower\(hex\(randomblob\(4\)\).*?hex\(randomblob\(6\)\)\)\)\)/gi, "DEFAULT gen_random_uuid()::text");
    await pgPool.query(pgSql);
  } else {
    sqliteDb!.exec(sql);
  }
}

// Run a mutation and return changes count
export async function run(sql: string, params: any[] = []): Promise<{ changes: number }> {
  if (pgPool) {
    let idx = 0;
    const pgSql = sql
      .replace(/\?/g, () => `$${++idx}`)
      .replace(/datetime\('now'\)/gi, 'NOW()')
      .replace(/\bINTEGER\b/gi, 'INT');
    const result = await pgPool.query(pgSql, params);
    return { changes: result.rowCount || 0 };
  } else {
    const info = sqliteDb!.prepare(sql).run(...params);
    return { changes: info.changes };
  }
}

// Initialize database tables
export const initDatabase = async () => {
  try {
    if (pgPool) {
      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          phone_number TEXT UNIQUE NOT NULL,
          name TEXT,
          role TEXT DEFAULT 'estimator',
          status TEXT DEFAULT 'pending',
          requested_at TIMESTAMPTZ DEFAULT NOW(),
          approved_at TIMESTAMPTZ,
          approved_by TEXT,
          last_login_at TIMESTAMPTZ,
          login_count INT DEFAULT 0,
          estimates_created INT DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS device_sessions (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
          device_name TEXT,
          device_type TEXT,
          refresh_token TEXT UNIQUE,
          ip_address TEXT,
          user_agent TEXT,
          is_active INT DEFAULT 1,
          last_active_at TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS otp_attempts (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          phone_number TEXT NOT NULL,
          otp_code TEXT,
          expires_at TIMESTAMPTZ,
          attempts INT DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
        CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
        CREATE INDEX IF NOT EXISTS idx_sessions_token ON device_sessions(refresh_token);
        CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_attempts(phone_number);
      `);
      console.log('PostgreSQL database initialized successfully');
    } else {
      sqliteDb!.exec(`
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
          attempts INT DEFAULT 0,
          created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
        CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
        CREATE INDEX IF NOT EXISTS idx_sessions_token ON device_sessions(refresh_token);
        CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_attempts(phone_number);
      `);
      console.log('SQLite database initialized successfully');
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

// Legacy default export for backward compatibility — DO NOT USE for new code
// Use query(), queryOne(), run(), execute() instead
export default sqliteDb as any;
