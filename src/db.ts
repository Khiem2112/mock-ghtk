import { DatabaseSync } from 'node:sqlite'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'

// Tren moi truong Vercel hoac Serverless he thong tap tin goc la read-only nen su dung os.tmpdir()
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
const dataDir = isServerless ? os.tmpdir() : path.resolve(process.cwd(), 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.resolve(dataDir, 'ghtk.db')
export const db = new DatabaseSync(dbPath)

// Khoi tao cau truc bang du lieu cho SQLite
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      label_id TEXT PRIMARY KEY,
      partner_id TEXT UNIQUE NOT NULL,
      status_id INTEGER NOT NULL DEFAULT 2,
      status_text TEXT NOT NULL DEFAULT 'Da tiep nhan',
      pick_name TEXT,
      pick_tel TEXT,
      pick_address TEXT,
      pick_province TEXT,
      pick_district TEXT,
      pick_ward TEXT,
      deliver_name TEXT,
      deliver_tel TEXT,
      deliver_address TEXT,
      deliver_province TEXT,
      deliver_district TEXT,
      deliver_ward TEXT,
      total_weight REAL DEFAULT 0.5,
      fee INTEGER DEFAULT 22000,
      insurance_fee INTEGER DEFAULT 0,
      pick_money INTEGER DEFAULT 0,
      value INTEGER DEFAULT 0,
      transport TEXT DEFAULT 'road',
      is_freeship TEXT DEFAULT '0',
      note TEXT,
      reason_code TEXT,
      reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_label_id TEXT NOT NULL,
      name TEXT NOT NULL,
      weight REAL DEFAULT 0.2,
      quantity INTEGER DEFAULT 1,
      product_code TEXT,
      price INTEGER DEFAULT 0,
      FOREIGN KEY (order_label_id) REFERENCES orders(label_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS webhook_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label_id TEXT,
      partner_id TEXT,
      status_id INTEGER,
      target_url TEXT NOT NULL,
      request_headers TEXT,
      request_payload TEXT NOT NULL,
      response_status INTEGER,
      response_body TEXT,
      error_message TEXT,
      duration_ms INTEGER,
      created_at TEXT NOT NULL
    );
  `)

  // Thiet lap cac cau hinh mac dinh ban dau neu chua ton tai
  const defaultSettings: Record<string, string> = {
    webhook_url: 'http://localhost:8069/ohub/webhook/ghtk',
    webhook_content_type: 'application/json',
    auto_push_on_create: '1',
    auto_push_on_cancel: '1',
    partner_token: 'mock-ghtk-token-dev'
  }

  const checkStmt = db.prepare('SELECT value FROM settings WHERE key = ?')
  const insertStmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)')

  for (const [k, v] of Object.entries(defaultSettings)) {
    const existing = checkStmt.get(k)
    if (!existing) {
      insertStmt.run(k, v)
    }
  }
}

export function getSetting(key: string, defaultValue = ''): string {
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?')
  const row = stmt.get(key) as { value?: string } | undefined
  return row?.value ?? defaultValue
}

export function setSetting(key: string, value: string): void {
  const stmt = db.prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `)
  stmt.run(key, value)
}

export function getAllSettings(): Record<string, string> {
  const stmt = db.prepare('SELECT key, value FROM settings')
  const rows = stmt.all() as Array<{ key: string; value: string }>
  const result: Record<string, string> = {}
  for (const r of rows) {
    result[r.key] = r.value
  }
  return result
}
