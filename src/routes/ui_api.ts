import { Hono } from 'hono'
import { db, getAllSettings, getSetting, setSetting } from '../db'
import { GHTK_STATUSES, getStatusText } from '../constants'
import { pingWebhook, sendGhtkWebhook } from '../services/webhook'
import { seedDatabase } from '../seed'

export const uiApiRouter = new Hono()

// Lay danh sach don hang tren he thong
uiApiRouter.get('/api/orders', (c) => {
  const query = c.req.query('q') || ''
  let stmt
  if (query.trim()) {
    stmt = db.prepare(`
      SELECT * FROM orders
      WHERE label_id LIKE ? OR partner_id LIKE ? OR deliver_name LIKE ? OR deliver_tel LIKE ? OR deliver_province LIKE ? OR status_text LIKE ?
      ORDER BY updated_at DESC
      LIMIT 500
    `)
    const term = `%${query.trim()}%`
    return c.json({ success: true, data: stmt.all(term, term, term, term, term, term) })
  } else {
    stmt = db.prepare('SELECT * FROM orders ORDER BY updated_at DESC LIMIT 500')
    return c.json({ success: true, data: stmt.all() })
  }
})

// Tao don hang thu nghiem truc tiep tu giao dien
uiApiRouter.post('/api/orders', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const partnerId = body.partner_id || `TEST_${Date.now().toString().slice(-6)}`

  // Kiem tra ton tai
  const checkStmt = db.prepare('SELECT label_id FROM orders WHERE partner_id = ?')
  if (checkStmt.get(partnerId)) {
    return c.json({ success: false, message: `Ma don ${partnerId} da ton tai tren mock server` }, 400)
  }

  const timestampSeq = Date.now().toString().slice(-6)
  const randomSuffix = Math.floor(1000 + Math.random() * 9000)
  const labelId = `S1.A1.${timestampSeq}${randomSuffix}`
  const nowIso = new Date().toISOString()
  const initialStatusId = Number(body.status_id || 2)
  const initialStatusText = getStatusText(initialStatusId)

  const insertStmt = db.prepare(`
    INSERT INTO orders (
      label_id, partner_id, status_id, status_text,
      pick_name, pick_tel, pick_address, pick_province, pick_district, pick_ward,
      deliver_name, deliver_tel, deliver_address, deliver_province, deliver_district, deliver_ward,
      total_weight, fee, insurance_fee, pick_money, value, transport, is_freeship,
      note, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?
    )
  `)

  insertStmt.run(
    labelId,
    partnerId,
    initialStatusId,
    initialStatusText,
    body.pick_name || 'Kho tong Ha Noi',
    body.pick_tel || '0987654321',
    body.pick_address || 'So 1 Dai Co Viet',
    body.pick_province || 'Ha Noi',
    body.pick_district || 'Hai Ba Trung',
    body.pick_ward || 'Bach Khoa',
    body.deliver_name || 'Nguyen Van A',
    body.deliver_tel || '0912345678',
    body.deliver_address || '123 Tran Hung Dao',
    body.deliver_province || 'Ha Noi',
    body.deliver_district || 'Hoan Kiem',
    body.deliver_ward || 'Phan Chu Trinh',
    Number(body.total_weight || 0.5),
    Number(body.fee || 22000),
    Number(body.insurance_fee || 0),
    Number(body.pick_money || 150000),
    Number(body.value || 150000),
    body.transport || 'road',
    body.is_freeship || '0',
    body.note || 'Don mau tu UI',
    nowIso,
    nowIso
  )

  let webhookResult = null
  if (body.send_webhook) {
    webhookResult = await sendGhtkWebhook({
      labelId,
      partnerId,
      statusId: initialStatusId,
      reason: initialStatusText,
      weight: Number(body.total_weight || 0.5),
      fee: Number(body.fee || 22000),
      pickMoney: Number(body.pick_money || 150000)
    })
  }

  return c.json({
    success: true,
    message: 'Da tao don hang moi thanh cong',
    data: { label_id: labelId, partner_id: partnerId },
    webhook: webhookResult
  })
})

// Cap nhat trang thai don hang va ban webhook ngay lap tuc
uiApiRouter.post('/api/orders/:label_id/update-status', async (c) => {
  const labelId = c.req.param('label_id')
  const body = await c.req.json().catch(() => ({}))

  const stmt = db.prepare('SELECT * FROM orders WHERE label_id = ?')
  const order = stmt.get(labelId) as any

  if (!order) {
    return c.json({ success: false, message: 'Khong tim thay don hang' }, 404)
  }

  const nextStatusId = Number(body.status_id)
  if (isNaN(nextStatusId) || !GHTK_STATUSES[nextStatusId]) {
    return c.json({ success: false, message: 'status_id khong hop le theo chuan GHTK' }, 400)
  }

  const statusText = getStatusText(nextStatusId)
  const reasonCode = body.reason_code || ''
  const reason = body.reason || statusText
  const nowIso = new Date().toISOString()

  const updateStmt = db.prepare(`
    UPDATE orders
    SET status_id = ?, status_text = ?, reason_code = ?, reason = ?, updated_at = ?
    WHERE label_id = ?
  `)
  updateStmt.run(nextStatusId, statusText, reasonCode, reason, nowIso, labelId)

  // Ban webhook neu khong co flag tat
  let webhookResult = null
  if (body.send_webhook !== false) {
    webhookResult = await sendGhtkWebhook({
      labelId: order.label_id,
      partnerId: order.partner_id,
      statusId: nextStatusId,
      reasonCode,
      reason,
      weight: order.total_weight,
      fee: order.fee,
      pickMoney: order.pick_money
    })
  }

  return c.json({
    success: true,
    message: `Da cap nhat don sang trang thai: ${statusText}`,
    data: {
      label_id: order.label_id,
      partner_id: order.partner_id,
      status_id: nextStatusId,
      status_text: statusText
    },
    webhook: webhookResult
  })
})

// Kich hoat ban webhook thu cong cho mot don hang
uiApiRouter.post('/api/orders/:label_id/trigger-webhook', async (c) => {
  const labelId = c.req.param('label_id')
  const body = await c.req.json().catch(() => ({}))

  const stmt = db.prepare('SELECT * FROM orders WHERE label_id = ?')
  const order = stmt.get(labelId) as any

  if (!order) {
    return c.json({ success: false, message: 'Khong tim thay don hang' }, 404)
  }

  const statusId = body.status_id ? Number(body.status_id) : order.status_id
  const reasonCode = body.reason_code ?? order.reason_code
  const reason = body.reason ?? order.reason ?? getStatusText(statusId)

  const result = await sendGhtkWebhook({
    labelId: order.label_id,
    partnerId: order.partner_id,
    statusId,
    reasonCode,
    reason,
    weight: order.total_weight,
    fee: order.fee,
    pickMoney: order.pick_money
  })

  return c.json({
    success: true,
    message: 'Da gui yeu cau webhook',
    webhook: result
  })
})

// Lay thong tin cau hinh he thong
uiApiRouter.get('/api/settings', (c) => {
  return c.json({ success: true, data: getAllSettings() })
})

// Luu thong tin cau hinh he thong
uiApiRouter.post('/api/settings', async (c) => {
  const body = await c.req.json().catch(() => ({}))

  if (body.webhook_url !== undefined) {
    setSetting('webhook_url', String(body.webhook_url).trim())
  }
  if (body.webhook_content_type !== undefined) {
    setSetting('webhook_content_type', String(body.webhook_content_type).trim())
  }
  if (body.auto_push_on_create !== undefined) {
    setSetting('auto_push_on_create', body.auto_push_on_create ? '1' : '0')
  }
  if (body.auto_push_on_cancel !== undefined) {
    setSetting('auto_push_on_cancel', body.auto_push_on_cancel ? '1' : '0')
  }
  if (body.partner_token !== undefined) {
    setSetting('partner_token', String(body.partner_token).trim())
  }

  return c.json({
    success: true,
    message: 'Da luu cau hinh he thong',
    data: getAllSettings()
  })
})

// Thu nghiem ping webhook den ung dung cua nguoi dung
uiApiRouter.post('/api/webhook/test-ping', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const targetUrl = (body.webhook_url || getSetting('webhook_url')).trim()

  if (!targetUrl) {
    return c.json({ success: false, message: 'Chua nhap URL webhook de test' }, 400)
  }

  const result = await pingWebhook(targetUrl)
  return c.json({
    success: result.success,
    message: result.success
      ? `Ket noi thanh cong (HTTP ${result.status}) trong ${result.durationMs}ms`
      : `Ket noi that bai: ${result.errorMessage || `HTTP ${result.status}`}`,
    result
  })
})

// Lay danh sach nhat ky ban webhook
uiApiRouter.get('/api/webhook-logs', (c) => {
  const stmt = db.prepare('SELECT * FROM webhook_logs ORDER BY id DESC LIMIT 100')
  const rows = stmt.all()
  return c.json({ success: true, data: rows })
})

// Thu gui lai mot ban tin webhook tu nhat ky
uiApiRouter.post('/api/webhook-logs/:id/retry', async (c) => {
  const logId = c.req.param('id')
  const stmt = db.prepare('SELECT * FROM webhook_logs WHERE id = ?')
  const log = stmt.get(logId) as any

  if (!log) {
    return c.json({ success: false, message: 'Khong tim thay nhat ky webhook' }, 404)
  }

  const result = await sendGhtkWebhook({
    labelId: log.label_id || 'RETRY_TEST',
    partnerId: log.partner_id || 'RETRY_PARTNER',
    statusId: log.status_id || 2,
    targetUrlOverride: log.target_url
  })

  return c.json({
    success: result.success,
    message: result.success
      ? `Gui lai thanh cong (HTTP ${result.status})`
      : `Gui lai that bai: ${result.errorMessage || `HTTP ${result.status}`}`,
    result
  })
})

// Xoa toan bo nhat ky webhook
uiApiRouter.delete('/api/webhook-logs', (c) => {
  db.exec('DELETE FROM webhook_logs')
  return c.json({ success: true, message: 'Da xoa toan bo nhat ky webhook' })
})

// Tra ve danh sach tat ca cac trang thai GHTK de phuc vu UI
uiApiRouter.get('/api/statuses', (c) => {
  return c.json({
    success: true,
    data: Object.values(GHTK_STATUSES)
  })
})

// Nap lai seed data theo yeu cau tu UI
uiApiRouter.post('/api/seed', (c) => {
  try {
    seedDatabase(true)
    return c.json({
      success: true,
      message: 'Da khoi phuc va nap lai toan bo seed data mau thanh cong'
    })
  } catch (err) {
    return c.json({
      success: false,
      message: 'Loi khi nap seed data: ' + String(err)
    }, 500)
  }
})
