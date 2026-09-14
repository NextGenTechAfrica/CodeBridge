// tests/test-db-adapter.mjs
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';
import { DatabaseSync } from 'node:sqlite';

// Automatically load .env.local into process.env for isolated test runs
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const k = trimmed.slice(0, idx).trim();
      const v = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[k]) {
        process.env[k] = v;
      }
    }
  }
}

function getDbUrl() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL;
  if (url) return url;
  return null;
}

const dbUrl = getDbUrl();

class TestDbAdapter {
  constructor() {
    if (dbUrl && (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://'))) {
      this.isPg = true;
      this.sql = postgres(dbUrl, {
        ssl: 'require',
        prepare: false,
        max: 2,
        idle_timeout: 30,
        connect_timeout: 30,
      });
    } else {
      this.isPg = false;
      const dataDir = path.resolve(process.cwd(), './data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const dbPath = path.join(dataDir, 'codebridge.db');
      this.sqlite = new DatabaseSync(dbPath);

      // Ensure system_flutterwave automated user exists for FK integrity
      try {
        this.sqlite.exec(`
          INSERT OR IGNORE INTO users (id, email, password_hash, role, status, email_verified)
          VALUES ('system_flutterwave', 'system.flutterwave@codebridge.internal', 'LOCKED_SYSTEM_ACCOUNT', 'ADMIN', 'ACTIVE', 1);
        `);
      } catch {}
    }
  }

  formatQuery(query) {
    let pIdx = 1;
    return query
      .replace(/\?/g, () => `$${pIdx++}`)
      .replace(/datetime\('now'\)/gi, 'NOW()')
      .replace(/date\('now'\)/gi, 'CURRENT_DATE');
  }

  async get(query, params = []) {
    if (this.isPg) {
      const text = this.formatQuery(query);
      const rows = await this.sql.unsafe(text, params);
      return rows[0] || null;
    } else {
      return this.sqlite.prepare(query).get(...params) || null;
    }
  }

  async all(query, params = []) {
    if (this.isPg) {
      const text = this.formatQuery(query);
      const rows = await this.sql.unsafe(text, params);
      return rows;
    } else {
      return this.sqlite.prepare(query).all(...params);
    }
  }

  async run(query, params = []) {
    if (this.isPg) {
      const text = this.formatQuery(query);
      return await this.sql.unsafe(text, params);
    } else {
      return this.sqlite.prepare(query).run(...params);
    }
  }

  // DbExecutor methods
  async query(sql, params = []) {
    return await this.all(sql, params);
  }

  async queryOne(sql, params = []) {
    return await this.get(sql, params);
  }

  async execute(sql, params = []) {
    const res = await this.run(sql, params);
    return { rowCount: res?.count ?? 1 };
  }

  async close() {
    if (this.isPg) {
      await this.sql.end({ timeout: 1 });
    } else {
      this.sqlite.close();
    }
  }
}

export const testDb = new TestDbAdapter();
