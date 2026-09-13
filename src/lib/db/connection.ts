// src/lib/db/connection.ts
import { AsyncLocalStorage } from 'node:async_hooks';
import path from 'node:path';
import fs from 'node:fs';
import postgres from 'postgres';
import { DatabaseSync } from 'node:sqlite';
import { CREATE_TABLES_SQL } from './schema';

export interface TransactionContext {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
  execute(sql: string, params?: any[]): Promise<{ changes: number; lastInsertRowid?: number | bigint }>;
  rawTx?: any;
}

interface DbExecutor {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
  execute(sql: string, params?: any[]): Promise<{ changes: number; lastInsertRowid?: number | bigint }>;
}

const txStorage = new AsyncLocalStorage<DbExecutor>();

let pgClient: postgres.Sql | null = null;
let sqliteClient: DatabaseSync | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Normalizes SQL query for PostgreSQL by replacing ? with $1, $2, ...
 * and translating SQLite datetime/date functions.
 */
export function formatPgQuery(sql: string, params: any[] = []): { text: string; values: any[] } {
  let paramIndex = 1;
  const text = sql
    .replace(/\?/g, () => `$${paramIndex++}`)
    .replace(/datetime\('now'\)/gi, 'NOW()')
    .replace(/date\('now'\)/gi, 'CURRENT_DATE');
  return { text, values: params };
}

/**
 * Returns true if a PostgreSQL connection string is configured.
 */
export function isPostgresConfigured(): boolean {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL;
  return Boolean(url && (url.startsWith('postgres://') || url.startsWith('postgresql://')));
}

/**
 * Retrieves the PostgreSQL client instance for Supabase.
 */
export function getPgClient(): postgres.Sql {
  if (pgClient) {
    return pgClient;
  }

  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not configured for PostgreSQL/Supabase.');
  }

  // Use prepare: false for Supabase Supavisor connection pooler (port 6543 / transaction mode)
  pgClient = postgres(url, {
    prepare: false,
    ssl: 'require',
    max: 5,
    idle_timeout: 20,
    connect_timeout: 20,
  });

  return pgClient;
}

/**
 * Retrieves local SQLite client fallback for offline dev/tests.
 */
export function getSqliteClient(): DatabaseSync {
  if (sqliteClient) {
    return sqliteClient;
  }

  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const dataDir = isServerless ? '/tmp' : path.resolve(process.cwd(), 'data');
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  } catch {
    // Ignore if directory exists or filesystem is read-only
  }

  const dbPath = path.join(dataDir, 'codebridge.db');
  sqliteClient = new DatabaseSync(dbPath);
  sqliteClient.exec('PRAGMA foreign_keys = ON;');
  sqliteClient.exec('PRAGMA journal_mode = WAL;');
  sqliteClient.exec(CREATE_TABLES_SQL);

  try {
    const cols = sqliteClient.prepare('PRAGMA table_info(users);').all() as any[];
    const hasGoogleId = cols.some((c: any) => c.name === 'google_id');
    if (!hasGoogleId) {
      sqliteClient.exec('ALTER TABLE users ADD COLUMN google_id TEXT;');
    }
    sqliteClient.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);');

    // Phase 3 migrations for SQLite
    const repCols = sqliteClient.prepare('PRAGMA table_info(representatives);').all() as any[];
    if (!repCols.some((c: any) => c.name === 'referral_code')) {
      sqliteClient.exec('ALTER TABLE representatives ADD COLUMN referral_code TEXT;');
      sqliteClient.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_rep_referral_code ON representatives(referral_code);');
    }

    const leadCols = sqliteClient.prepare('PRAGMA table_info(leads);').all() as any[];
    if (!leadCols.some((c: any) => c.name === 'client_id')) {
      sqliteClient.exec(`
        ALTER TABLE leads ADD COLUMN client_id TEXT REFERENCES clients(id);
        ALTER TABLE leads ADD COLUMN service_id TEXT REFERENCES services(id);
        ALTER TABLE leads ADD COLUMN timeline TEXT;
        ALTER TABLE leads ADD COLUMN referral_source TEXT NOT NULL DEFAULT 'DIRECT';
      `);
    }

    const notifCols = sqliteClient.prepare('PRAGMA table_info(notifications);').all() as any[];
    if (!notifCols.some((c: any) => c.name === 'link_url')) {
      sqliteClient.exec('ALTER TABLE notifications ADD COLUMN link_url TEXT;');
    }

    const msgCols = sqliteClient.prepare('PRAGMA table_info(messages);').all() as any[];
    if (!msgCols.some((c: any) => c.name === 'lead_id')) {
      sqliteClient.exec(`
        ALTER TABLE messages ADD COLUMN lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE;
        ALTER TABLE messages ADD COLUMN message_type TEXT NOT NULL DEFAULT 'CHAT';
      `);
    }

    // Flutterwave & Mobile Pricing migrations for SQLite
    const srvCols = sqliteClient.prepare('PRAGMA table_info(services);').all() as any[];
    if (!srvCols.some((c: any) => c.name === 'item_type')) {
      sqliteClient.exec(`
        ALTER TABLE services ADD COLUMN item_type TEXT NOT NULL DEFAULT 'CODEBRIDGE_SERVICE';
        ALTER TABLE services ADD COLUMN platform TEXT NOT NULL DEFAULT 'ALL';
        ALTER TABLE services ADD COLUMN billing_type TEXT NOT NULL DEFAULT 'PROJECT';
        ALTER TABLE services ADD COLUMN is_price_configured INTEGER NOT NULL DEFAULT 1;
      `);
    }

    const propCols = sqliteClient.prepare('PRAGMA table_info(proposals);').all() as any[];
    if (!propCols.some((c: any) => c.name === 'codebridge_total_minor')) {
      sqliteClient.exec(`
        ALTER TABLE proposals ADD COLUMN line_items_json TEXT NOT NULL DEFAULT '[]';
        ALTER TABLE proposals ADD COLUMN codebridge_total_minor INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE proposals ADD COLUMN third_party_total_minor INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE proposals ADD COLUMN app_store_ownership TEXT DEFAULT 'CLIENT_OWNED';
        ALTER TABLE proposals ADD COLUMN store_approval_disclaimer TEXT;
      `);
    }

    const invCols = sqliteClient.prepare('PRAGMA table_info(invoices);').all() as any[];
    if (!invCols.some((c: any) => c.name === 'codebridge_amount_minor')) {
      sqliteClient.exec(`
        ALTER TABLE invoices ADD COLUMN codebridge_amount_minor INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE invoices ADD COLUMN third_party_reimbursement_minor INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE invoices ADD COLUMN line_items_json TEXT;
      `);
    }

    const payCols = sqliteClient.prepare('PRAGMA table_info(payments);').all() as any[];
    if (!payCols.some((c: any) => c.name === 'gateway')) {
      sqliteClient.exec(`
        ALTER TABLE payments ADD COLUMN gateway TEXT NOT NULL DEFAULT 'flutterwave';
        ALTER TABLE payments ADD COLUMN gateway_transaction_id TEXT;
        ALTER TABLE payments ADD COLUMN gateway_reference TEXT;
        ALTER TABLE payments ADD COLUMN gross_amount_minor INTEGER;
        ALTER TABLE payments ADD COLUMN gateway_fee_minor INTEGER DEFAULT 0;
        ALTER TABLE payments ADD COLUMN net_amount_minor INTEGER;
        ALTER TABLE payments ADD COLUMN settlement_status TEXT DEFAULT 'PENDING';
        ALTER TABLE payments ADD COLUMN settlement_currency TEXT;
        ALTER TABLE payments ADD COLUMN settlement_amount_minor INTEGER;
        ALTER TABLE payments ADD COLUMN settlement_destination TEXT;
        ALTER TABLE payments ADD COLUMN metadata_json TEXT;
        ALTER TABLE payments ADD COLUMN paid_at TEXT;
        CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_unique_flw_ref ON payments(gateway_reference);
      `);
    }

    // Financial Hardening column additions for SQLite
    if (!payCols.some((c: any) => c.name === 'client_id')) {
      sqliteClient.exec(`
        ALTER TABLE payments ADD COLUMN client_id TEXT;
        ALTER TABLE payments ADD COLUMN provider_id TEXT;
        ALTER TABLE payments ADD COLUMN transaction_currency TEXT;
        ALTER TABLE payments ADD COLUMN amount_transaction_minor INTEGER;
        ALTER TABLE payments ADD COLUMN settlement_exchange_rate REAL;
        ALTER TABLE payments ADD COLUMN exchange_rate_source TEXT;
        ALTER TABLE payments ADD COLUMN amount_refunded_minor INTEGER DEFAULT 0;
        ALTER TABLE payments ADD COLUMN remaining_refundable_minor INTEGER;
        ALTER TABLE payments ADD COLUMN payout_status TEXT DEFAULT 'RESERVED';
      `);
    }

    const refCols = sqliteClient.prepare('PRAGMA table_info(refunds);').all() as any[];
    if (!refCols.some((c: any) => c.name === 'requested_amount_minor')) {
      sqliteClient.exec(`
        ALTER TABLE refunds ADD COLUMN requested_amount_minor INTEGER;
        ALTER TABLE refunds ADD COLUMN approved_amount_minor INTEGER DEFAULT 0;
        ALTER TABLE refunds ADD COLUMN retry_count INTEGER DEFAULT 0;
        ALTER TABLE refunds ADD COLUMN original_refund_id TEXT;
        ALTER TABLE refunds ADD COLUMN idempotency_key TEXT;
        ALTER TABLE refunds ADD COLUMN shortfall_minor INTEGER DEFAULT 0;
        ALTER TABLE refunds ADD COLUMN operational_block_reason TEXT;
        ALTER TABLE refunds ADD COLUMN approved_at TEXT;
        ALTER TABLE refunds ADD COLUMN initiated_at TEXT;
        ALTER TABLE refunds ADD COLUMN failed_at TEXT;
      `);
    }

    if (!repCols.some((c: any) => c.name === 'territory_id')) {
      sqliteClient.exec(`
        ALTER TABLE representatives ADD COLUMN territory_id TEXT;
        ALTER TABLE representatives ADD COLUMN payout_currency TEXT DEFAULT 'KES';
        ALTER TABLE representatives ADD COLUMN payout_method TEXT DEFAULT 'MPESA';
        ALTER TABLE representatives ADD COLUMN payout_destination TEXT;
        ALTER TABLE representatives ADD COLUMN payout_bank_code TEXT DEFAULT 'MPS';
        ALTER TABLE representatives ADD COLUMN payout_account_name TEXT;
      `);
    }
  } catch (err) {
    console.error('Error applying SQLite migrations:', err);
  }

  return sqliteClient;
}

/**
 * Ensures PostgreSQL schema has required columns and indexes.
 */
async function ensurePostgresSchema(pg: postgres.Sql): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await pg.unsafe(`
          ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT;
          CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
          
          -- Phase 3 Migrations
          ALTER TABLE representatives ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
          ALTER TABLE representatives ADD COLUMN IF NOT EXISTS territory_id VARCHAR(16);
          ALTER TABLE representatives ADD COLUMN IF NOT EXISTS payout_currency VARCHAR(8) DEFAULT 'KES';
          ALTER TABLE representatives ADD COLUMN IF NOT EXISTS payout_method VARCHAR(32) DEFAULT 'MPESA';
          ALTER TABLE representatives ADD COLUMN IF NOT EXISTS payout_destination TEXT;
          ALTER TABLE representatives ADD COLUMN IF NOT EXISTS payout_bank_code VARCHAR(32) DEFAULT 'MPS';
          ALTER TABLE representatives ADD COLUMN IF NOT EXISTS payout_account_name TEXT;
          
          ALTER TABLE leads ADD COLUMN IF NOT EXISTS client_id TEXT REFERENCES clients(id);
          ALTER TABLE leads ADD COLUMN IF NOT EXISTS service_id TEXT REFERENCES services(id);
          ALTER TABLE leads ADD COLUMN IF NOT EXISTS timeline TEXT;
          ALTER TABLE leads ADD COLUMN IF NOT EXISTS referral_source TEXT NOT NULL DEFAULT 'DIRECT';
          
          ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link_url TEXT;
          
          ALTER TABLE messages ADD COLUMN IF NOT EXISTS lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE;
          ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'CHAT';

          -- Flutterwave & Mobile Pricing Migrations
          ALTER TABLE services ADD COLUMN IF NOT EXISTS item_type VARCHAR(32) DEFAULT 'CODEBRIDGE_SERVICE';
          ALTER TABLE services ADD COLUMN IF NOT EXISTS platform VARCHAR(32) DEFAULT 'ALL';
          ALTER TABLE services ADD COLUMN IF NOT EXISTS billing_type VARCHAR(32) DEFAULT 'PROJECT';
          ALTER TABLE services ADD COLUMN IF NOT EXISTS is_price_configured INTEGER DEFAULT 1;

          ALTER TABLE proposals ADD COLUMN IF NOT EXISTS line_items_json TEXT DEFAULT '[]';
          ALTER TABLE proposals ADD COLUMN IF NOT EXISTS codebridge_total_minor BIGINT DEFAULT 0;
          ALTER TABLE proposals ADD COLUMN IF NOT EXISTS third_party_total_minor BIGINT DEFAULT 0;
          ALTER TABLE proposals ADD COLUMN IF NOT EXISTS app_store_ownership VARCHAR(32) DEFAULT 'CLIENT_OWNED';
          ALTER TABLE proposals ADD COLUMN IF NOT EXISTS store_approval_disclaimer TEXT;

          ALTER TABLE invoices ADD COLUMN IF NOT EXISTS codebridge_amount_minor BIGINT DEFAULT 0;
          ALTER TABLE invoices ADD COLUMN IF NOT EXISTS third_party_reimbursement_minor BIGINT DEFAULT 0;
          ALTER TABLE invoices ADD COLUMN IF NOT EXISTS line_items_json TEXT;

          ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway VARCHAR(32) DEFAULT 'flutterwave';
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway_transaction_id VARCHAR(128);
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway_reference VARCHAR(128);
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS gross_amount_minor BIGINT;
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway_fee_minor BIGINT DEFAULT 0;
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS net_amount_minor BIGINT;
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS client_id VARCHAR(64) REFERENCES clients(id);
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_id VARCHAR(64) REFERENCES users(id);
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS transaction_currency VARCHAR(8);
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount_transaction_minor BIGINT;
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS settlement_status VARCHAR(32) DEFAULT 'PENDING';
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS settlement_currency VARCHAR(8);
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS settlement_amount_minor BIGINT;
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS settlement_exchange_rate NUMERIC(18, 6);
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS exchange_rate_source VARCHAR(64);
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS settlement_destination TEXT;
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount_refunded_minor BIGINT DEFAULT 0;
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS remaining_refundable_minor BIGINT;
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS payout_status VARCHAR(32) DEFAULT 'RESERVED';
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS metadata_json TEXT;
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

          ALTER TABLE refunds ADD COLUMN IF NOT EXISTS requested_amount_minor BIGINT;
          ALTER TABLE refunds ADD COLUMN IF NOT EXISTS approved_amount_minor BIGINT DEFAULT 0;
          ALTER TABLE refunds ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
          ALTER TABLE refunds ADD COLUMN IF NOT EXISTS original_refund_id VARCHAR(64) REFERENCES refunds(id);
          ALTER TABLE refunds ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128) UNIQUE;
          ALTER TABLE refunds ADD COLUMN IF NOT EXISTS shortfall_minor BIGINT DEFAULT 0;
          ALTER TABLE refunds ADD COLUMN IF NOT EXISTS operational_block_reason TEXT;
          ALTER TABLE refunds ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
          ALTER TABLE refunds ADD COLUMN IF NOT EXISTS initiated_at TIMESTAMPTZ;
          ALTER TABLE refunds ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ;

          ALTER TABLE disputes ADD COLUMN IF NOT EXISTS evidence_status VARCHAR(32) DEFAULT 'EVIDENCE_REQUIRED';
          ALTER TABLE disputes ADD COLUMN IF NOT EXISTS evidence_submitted_at TIMESTAMPTZ;
          ALTER TABLE disputes ADD COLUMN IF NOT EXISTS resolution_notes TEXT;

          CREATE INDEX IF NOT EXISTS idx_payments_gateway_tx ON payments(gateway_transaction_id);
          CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_unique_flw_ref ON payments(gateway_reference) WHERE gateway_reference IS NOT NULL;
          CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_unique_flw_tx_id ON payments(gateway_transaction_id) WHERE gateway_transaction_id IS NOT NULL;
        `);
      } catch (err: any) {
        console.error('Error ensuring PostgreSQL schema:', err.message);
      }
    })();
  }
  await initPromise;
}

/**
 * Resets client instances (useful for testing or hot-reloads).
 */
export function resetClient(): void {
  if (pgClient) {
    try {
      pgClient.end({ timeout: 1 }).catch(() => {});
    } catch {}
    pgClient = null;
  }
  if (sqliteClient) {
    try {
      sqliteClient.close();
    } catch {}
    sqliteClient = null;
  }
  initPromise = null;
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const activeTx = txStorage.getStore();
  if (activeTx) {
    return activeTx.query<T>(sql, params);
  }

  if (isPostgresConfigured()) {
    const pg = getPgClient();
    await ensurePostgresSchema(pg);
    const { text, values } = formatPgQuery(sql, params);
    const rows = await pg.unsafe(text, values);
    return Array.from(rows).map((r) => ({ ...r })) as T[];
  }

  const sqlite = getSqliteClient();
  const sqliteSql = sql.replace(/\bFOR UPDATE(?: OF [a-zA-Z0-9_, ]+)?\b/ig, '');
  const stmt = sqlite.prepare(sqliteSql);
  const rows = stmt.all(...params);
  return rows.map((r: any) => ({ ...r })) as T[];
}

export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const activeTx = txStorage.getStore();
  if (activeTx) {
    return activeTx.queryOne<T>(sql, params);
  }

  if (isPostgresConfigured()) {
    const pg = getPgClient();
    await ensurePostgresSchema(pg);
    const { text, values } = formatPgQuery(sql, params);
    const rows = await pg.unsafe(text, values);
    if (!rows || rows.length === 0) {
      return null;
    }
    return { ...rows[0] } as T;
  }

  const sqlite = getSqliteClient();
  const sqliteSql = sql.replace(/\bFOR UPDATE(?: OF [a-zA-Z0-9_, ]+)?\b/ig, '');
  const stmt = sqlite.prepare(sqliteSql);
  const row = stmt.get(...params);
  return row ? ({ ...row } as T) : null;
}

export async function execute(
  sql: string,
  params: any[] = []
): Promise<{ changes: number; lastInsertRowid?: number | bigint }> {
  const activeTx = txStorage.getStore();
  if (activeTx) {
    return activeTx.execute(sql, params);
  }

  if (isPostgresConfigured()) {
    const pg = getPgClient();
    await ensurePostgresSchema(pg);
    const { text, values } = formatPgQuery(sql, params);
    const result = await pg.unsafe(text, values);
    return { changes: result.count || 0 };
  }

  const sqlite = getSqliteClient();
  const stmt = sqlite.prepare(sql);
  const res = stmt.run(...params);
  return {
    changes: Number(res.changes),
    lastInsertRowid: res.lastInsertRowid,
  };
}

export async function transaction<T>(fn: (tx: TransactionContext) => Promise<T>): Promise<T> {
  if (isPostgresConfigured()) {
    const pg = getPgClient();
    await ensurePostgresSchema(pg);
    const result = await pg.begin(async (txSql: any) => {
      const txContext: TransactionContext = {
        rawTx: txSql,
        query: async <R = any>(sql: string, params: any[] = []): Promise<R[]> => {
          const { text, values } = formatPgQuery(sql, params);
          const rows = await txSql.unsafe(text, values);
          return Array.from(rows).map((r: any) => ({ ...r })) as R[];
        },
        queryOne: async <R = any>(sql: string, params: any[] = []): Promise<R | null> => {
          const { text, values } = formatPgQuery(sql, params);
          const rows = await txSql.unsafe(text, values);
          return rows && rows.length > 0 ? ({ ...rows[0] } as R) : null;
        },
        execute: async (sql: string, params: any[] = []): Promise<{ changes: number }> => {
          const { text, values } = formatPgQuery(sql, params);
          const result = await txSql.unsafe(text, values);
          return { changes: result.count || 0 };
        },
      };

      return txStorage.run(txContext, async () => {
        return fn(txContext);
      });
    });
    return result as T;
  }

  // SQLite fallback transaction
  const sqlite = getSqliteClient();
  sqlite.exec('BEGIN TRANSACTION;');

  const txContext: TransactionContext = {
    query: async <R = any>(sql: string, params: any[] = []): Promise<R[]> => {
      const sqliteSql = sql.replace(/\bFOR UPDATE(?: OF [a-zA-Z0-9_, ]+)?\b/ig, '');
      const stmt = sqlite.prepare(sqliteSql);
      const rows = stmt.all(...params);
      return rows.map((r: any) => ({ ...r })) as R[];
    },
    queryOne: async <R = any>(sql: string, params: any[] = []): Promise<R | null> => {
      const sqliteSql = sql.replace(/\bFOR UPDATE(?: OF [a-zA-Z0-9_, ]+)?\b/ig, '');
      const stmt = sqlite.prepare(sqliteSql);
      const row = stmt.get(...params);
      return row ? ({ ...row } as R) : null;
    },
    execute: async (sql: string, params: any[] = []): Promise<{ changes: number; lastInsertRowid: number | bigint }> => {
      const stmt = sqlite.prepare(sql);
      const res = stmt.run(...params);
      return {
        changes: Number(res.changes),
        lastInsertRowid: res.lastInsertRowid,
      };
    },
  };

  return txStorage.run(txContext, async () => {
    try {
      const result = await fn(txContext);
      sqlite.exec('COMMIT;');
      return result;
    } catch (err) {
      try {
        sqlite.exec('ROLLBACK;');
      } catch {}
      throw err;
    }
  });
}
