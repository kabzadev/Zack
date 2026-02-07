import { Pool } from 'pg';
import BetterSqlite3 from 'better-sqlite3';
import path from 'path';
import { randomUUID } from 'crypto';

// Determine which database to use
const USE_POSTGRES = !!(process.env.AZURE_PG_HOST || process.env.DATABASE_URL);

let pgPool: Pool | null = null;
let sqliteDb: BetterSqlite3.Database | null = null;

// ─── Initializers ───

export function initPgPool() {
  if (!USE_POSTGRES || pgPool) return;

  console.log(`Connecting to PostgreSQL at ${process.env.AZURE_PG_HOST}...`);
  
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

  pgPool.on('error', (err) => {
    console.error('PG pool error:', err.message);
  });
}

function createSqliteAdapter(): BetterSqlite3.Database {
  const DB_PATH = process.env.DB_PATH || (
    process.env.NODE_ENV === 'production' 
      ? '/tmp/pinpoint.db' 
      : path.join(__dirname, '..', '..', 'pinpoint.db')
  );
  const db = new BetterSqlite3(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.function('gen_random_uuid', () => randomUUID());
  return db;
}

// ─── Helper: Query Functions ───

export async function query(sql: string, params: any[] = []): Promise<any[]> {
  if (USE_POSTGRES) {
    if (!pgPool) initPgPool();
    let idx = 0;
    const pgSql = sql
      .replace(/\?/g, () => `$${++idx}`)
      .replace(/datetime\('now'\)/gi, 'NOW()')
      .replace(/\bINTEGER\b/gi, 'INT');
    const result = await pgPool!.query(pgSql, params);
    return result.rows;
  } else {
    if (!sqliteDb) sqliteDb = createSqliteAdapter();
    const stmt = sqliteDb.prepare(sql);
    if (sql.trim().toUpperCase().startsWith('SELECT') || sql.trim().toUpperCase().startsWith('WITH')) {
      return stmt.all(...params);
    } else {
      const info = stmt.run(...params);
      return [{ changes: info.changes }];
    }
  }
}

export async function queryOne(sql: string, params: any[] = []): Promise<any | undefined> {
  if (USE_POSTGRES) {
    if (!pgPool) initPgPool();
    let idx = 0;
    const pgSql = sql
      .replace(/\?/g, () => `$${++idx}`)
      .replace(/datetime\('now'\)/gi, 'NOW()')
      .replace(/\bINTEGER\b/gi, 'INT');
    const result = await pgPool!.query(pgSql, params);
    return result.rows[0];
  } else {
    if (!sqliteDb) sqliteDb = createSqliteAdapter();
    return sqliteDb.prepare(sql).get(...params);
  }
}

export async function execute(sql: string): Promise<void> {
  if (USE_POSTGRES) {
    if (!pgPool) initPgPool();
    const pgSql = sql
      .replace(/datetime\('now'\)/gi, 'NOW()')
      .replace(/\bINTEGER\b/gi, 'INT')
      .replace(/DEFAULT \(lower\(hex\(randomblob\(4\)\).*?hex\(randomblob\(6\)\)\)\)\)\)/gi, "DEFAULT gen_random_uuid()::text");
    await pgPool!.query(pgSql);
  } else {
    if (!sqliteDb) sqliteDb = createSqliteAdapter();
    sqliteDb.exec(sql);
  }
}

export async function run(sql: string, params: any[] = []): Promise<{ changes: number }> {
  if (USE_POSTGRES) {
    if (!pgPool) initPgPool();
    let idx = 0;
    const pgSql = sql
      .replace(/\?/g, () => `$${++idx}`)
      .replace(/datetime\('now'\)/gi, 'NOW()')
      .replace(/\bINTEGER\b/gi, 'INT');
    const result = await pgPool!.query(pgSql, params);
    return { changes: result.rowCount || 0 };
  } else {
    if (!sqliteDb) sqliteDb = createSqliteAdapter();
    const info = sqliteDb.prepare(sql).run(...params);
    return { changes: info.changes };
  }
}

// ─── DB Initializer ───

export const initDatabase = async () => {
  try {
    if (USE_POSTGRES) {
      if (!pgPool) initPgPool();
      await pgPool!.query(`
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
      `);
      console.log('PostgreSQL database initialized successfully');
    } else {
      if (!sqliteDb) sqliteDb = createSqliteAdapter();
      sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          phone_number TEXT UNIQUE NOT NULL,
          name TEXT,
          role TEXT DEFAULT 'estimator',
          status TEXT DEFAULT 'pending'
        );
      `);
      console.log('SQLite database initialized successfully');
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

export default {} as any;
