import path from 'node:path'
import fs from 'node:fs'
import { createRequire } from 'node:module'

export interface IPreparedStatement {
  run(...params: any[]): { changes: number; lastInsertRowid?: number }
  get(...params: any[]): any
  all(...params: any[]): any[]
}

export interface IDatabase {
  exec(sql: string): void
  prepare(sql: string): IPreparedStatement
}

// Bo nho du lieu trong RAM tuong thich SQLite dung cho Serverless va moi truong khong co node:sqlite
export class MemoryDatabase implements IDatabase {
  private settings = new Map<string, string>()
  private orders = new Map<string, Record<string, any>>()
  private orderProducts: Array<Record<string, any>> = []
  private webhookLogs: Array<Record<string, any>> = []
  private nextProductId = 1
  private nextLogId = 1

  exec(sql: string): void {
    const statements = sql.split(';').map(s => s.trim()).filter(Boolean)
    for (const stmt of statements) {
      if (stmt.includes('DELETE FROM order_products') || stmt.includes('DELETE FROM orders')) {
        this.orderProducts = []
        this.orders.clear()
        this.webhookLogs = []
        this.nextProductId = 1
        this.nextLogId = 1
      } else if (stmt.includes('DELETE FROM webhook_logs')) {
        this.webhookLogs = []
        this.nextLogId = 1
      }
    }
  }

  prepare(sql: string): IPreparedStatement {
    const trimmed = sql.trim()

    // Truy van doc cau hinh theo key
    if (/SELECT\s+value\s+FROM\s+settings\s+WHERE\s+key\s*=/i.test(trimmed)) {
      return {
        get: (key: string) => {
          const value = this.settings.get(key)
          return value !== undefined ? { value } : undefined
        },
        all: () => [],
        run: () => ({ changes: 0 })
      }
    }

    // Truy van lay toan bo danh sach cau hinh
    if (/SELECT\s+key,\s*value\s+FROM\s+settings/i.test(trimmed)) {
      return {
        get: () => undefined,
        all: () => Array.from(this.settings.entries()).map(([key, value]) => ({ key, value })),
        run: () => ({ changes: 0 })
      }
    }

    // Ghi hoac cap nhat cau hinh
    if (/INSERT\s+INTO\s+settings/i.test(trimmed)) {
      return {
        get: () => undefined,
        all: () => [],
        run: (key: string, value: string) => {
          this.settings.set(key, String(value))
          return { changes: 1 }
        }
      }
    }

    // Dem so luong don hang hien co
    if (/SELECT\s+COUNT\(\*\)\s+as\s+cnt\s+FROM\s+orders/i.test(trimmed)) {
      return {
        get: () => ({ cnt: this.orders.size }),
        all: () => [{ cnt: this.orders.size }],
        run: () => ({ changes: 0 })
      }
    }

    // Chen ban ghi moi vao cac bang du lieu
    if (/INSERT\s+INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)/i.test(trimmed)) {
      const match = trimmed.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)/i)
      const table = match ? match[1].toLowerCase() : ''
      const cols = match ? match[2].split(',').map(s => s.trim()) : []

      if (table === 'orders') {
        return {
          get: () => undefined,
          all: () => [],
          run: (...params: any[]) => {
            const row: Record<string, any> = {}
            for (let i = 0; i < cols.length; i++) {
              row[cols[i]] = params[i]
            }
            if (row.label_id) {
              this.orders.set(row.label_id, row)
            }
            return { changes: 1 }
          }
        }
      }

      if (table === 'order_products') {
        return {
          get: () => undefined,
          all: () => [],
          run: (...params: any[]) => {
            const row: Record<string, any> = { id: this.nextProductId++ }
            for (let i = 0; i < cols.length; i++) {
              row[cols[i]] = params[i]
            }
            this.orderProducts.push(row)
            return { changes: 1, lastInsertRowid: row.id }
          }
        }
      }

      if (table === 'webhook_logs') {
        return {
          get: () => undefined,
          all: () => [],
          run: (...params: any[]) => {
            const row: Record<string, any> = { id: this.nextLogId++ }
            for (let i = 0; i < cols.length; i++) {
              row[cols[i]] = params[i]
            }
            this.webhookLogs.push(row)
            return { changes: 1, lastInsertRowid: row.id }
          }
        }
      }
    }

    // Tim kiem don hang theo ca label_id va partner_id
    if (/SELECT\s+.*FROM\s+orders\s+WHERE\s+label_id\s*=\s*\?\s+OR\s+partner_id\s*=\s*\?/i.test(trimmed)) {
      return {
        get: (arg1: string, arg2: string) => {
          for (const o of this.orders.values()) {
            if (o.label_id === arg1 || o.partner_id === arg2 || o.label_id === arg2 || o.partner_id === arg1) {
              return { ...o }
            }
          }
          return undefined
        },
        all: (arg1: string, arg2: string) => {
          const res = []
          for (const o of this.orders.values()) {
            if (o.label_id === arg1 || o.partner_id === arg2 || o.label_id === arg2 || o.partner_id === arg1) {
              res.push({ ...o })
            }
          }
          return res
        },
        run: () => ({ changes: 0 })
      }
    }

    // Tim kiem don hang theo partner_id
    if (/SELECT\s+(.*)\s+FROM\s+orders\s+WHERE\s+partner_id\s*=\s*\?/i.test(trimmed)) {
      const isLabelOnly = /SELECT\s+label_id\s+FROM/i.test(trimmed)
      return {
        get: (partnerId: string) => {
          for (const o of this.orders.values()) {
            if (o.partner_id === partnerId) {
              return isLabelOnly ? { label_id: o.label_id } : { ...o }
            }
          }
          return undefined
        },
        all: (partnerId: string) => {
          for (const o of this.orders.values()) {
            if (o.partner_id === partnerId) {
              return [isLabelOnly ? { label_id: o.label_id } : { ...o }]
            }
          }
          return []
        },
        run: () => ({ changes: 0 })
      }
    }

    // Tim kiem don hang theo label_id
    if (/SELECT\s+\*\s+FROM\s+orders\s+WHERE\s+label_id\s*=\s*\?/i.test(trimmed)) {
      return {
        get: (labelId: string) => {
          const o = this.orders.get(labelId)
          return o ? { ...o } : undefined
        },
        all: (labelId: string) => {
          const o = this.orders.get(labelId)
          return o ? [{ ...o }] : []
        },
        run: () => ({ changes: 0 })
      }
    }

    // Cap nhat thong tin don hang theo label_id
    if (/UPDATE\s+orders\s+SET/i.test(trimmed)) {
      const setPartMatch = trimmed.match(/SET\s+([\s\S]+?)\s+WHERE/i)
      const setCols = setPartMatch
        ? setPartMatch[1].split(',').map(s => s.split('=')[0].trim())
        : []
      return {
        get: () => undefined,
        all: () => [],
        run: (...params: any[]) => {
          const labelId = params[params.length - 1]
          const existing = this.orders.get(labelId)
          if (existing) {
            for (let i = 0; i < setCols.length; i++) {
              existing[setCols[i]] = params[i]
            }
            this.orders.set(labelId, existing)
            return { changes: 1 }
          }
          return { changes: 0 }
        }
      }
    }

    // Danh sach va tim kiem don hang co sap xep theo thoi gian cap nhat
    if (/SELECT\s+\*\s+FROM\s+orders/i.test(trimmed) && /ORDER\s+BY/i.test(trimmed)) {
      const hasWhere = /WHERE/i.test(trimmed)
      return {
        get: () => undefined,
        all: (...params: any[]) => {
          let list = Array.from(this.orders.values())
          if (hasWhere && params.length > 0) {
            const rawTerm = String(params[0] || '').replace(/%/g, '').trim().toLowerCase()
            if (rawTerm) {
              list = list.filter(o => {
                return (
                  String(o.label_id || '').toLowerCase().includes(rawTerm) ||
                  String(o.partner_id || '').toLowerCase().includes(rawTerm) ||
                  String(o.deliver_name || '').toLowerCase().includes(rawTerm) ||
                  String(o.deliver_tel || '').toLowerCase().includes(rawTerm) ||
                  String(o.deliver_province || '').toLowerCase().includes(rawTerm) ||
                  String(o.status_text || '').toLowerCase().includes(rawTerm)
                )
              })
            }
          }
          list.sort((a, b) => {
            const tA = a.updated_at ? new Date(a.updated_at).getTime() : 0
            const tB = b.updated_at ? new Date(b.updated_at).getTime() : 0
            return tB - tA
          })
          return list.slice(0, 500)
        },
        run: () => ({ changes: 0 })
      }
    }

    // Danh sach nhat ky webhook sap xep giam dan
    if (/SELECT\s+\*\s+FROM\s+webhook_logs\s+ORDER\s+BY\s+id\s+DESC/i.test(trimmed)) {
      return {
        get: () => undefined,
        all: () => {
          return [...this.webhookLogs].sort((a, b) => b.id - a.id).slice(0, 100)
        },
        run: () => ({ changes: 0 })
      }
    }

    // Chi tiet mot nhat ky webhook theo id
    if (/SELECT\s+\*\s+FROM\s+webhook_logs\s+WHERE\s+id\s*=\s*\?/i.test(trimmed)) {
      return {
        get: (id: any) => {
          const numId = Number(id)
          return this.webhookLogs.find(l => l.id === numId)
        },
        all: (id: any) => {
          const numId = Number(id)
          const found = this.webhookLogs.find(l => l.id === numId)
          return found ? [found] : []
        },
        run: () => ({ changes: 0 })
      }
    }

    // Danh sach san pham theo order_label_id
    if (/SELECT\s+\*\s+FROM\s+order_products\s+WHERE\s+order_label_id\s*=\s*\?/i.test(trimmed)) {
      return {
        get: (orderLabelId: string) => {
          return this.orderProducts.find(p => p.order_label_id === orderLabelId)
        },
        all: (orderLabelId: string) => {
          return this.orderProducts.filter(p => p.order_label_id === orderLabelId)
        },
        run: () => ({ changes: 0 })
      }
    }

    // Phan hoi mac dinh cho cac cau lenh chua dang ky
    return {
      get: () => undefined,
      all: () => [],
      run: () => ({ changes: 0 })
    }
  }
}

// Khoi tao ket noi database linh hoat tuy theo moi truong thuc thi
function createDatabase(): IDatabase {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
  if (isServerless) {
    return new MemoryDatabase()
  }

  try {
    const req = createRequire(import.meta.url)
    const sqlite = req('node:sqlite')
    if (sqlite && sqlite.DatabaseSync) {
      const dataDir = path.resolve(process.cwd(), 'data')
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
      }
      const dbPath = path.resolve(dataDir, 'ghtk.db')
      return new sqlite.DatabaseSync(dbPath)
    }
  } catch {
    // Tu dong fallback ve MemoryDatabase neu runtime khong co module sqlite
  }

  return new MemoryDatabase()
}

export const db: IDatabase = createDatabase()

// Khoi tao cau truc bang va du lieu mac dinh
export function initDatabase(): void {
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
