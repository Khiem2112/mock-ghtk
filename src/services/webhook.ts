import { db, getSetting } from '../db'
import { getStatusText } from '../constants'

export interface WebhookSendResult {
  success: boolean
  status: number | null
  responseBody: string
  errorMessage?: string
  durationMs: number
  targetUrl: string
  payload: Record<string, unknown>
}

// Gui webhook trang thai don hang den ung dung dich theo chuan GHTK
export async function sendGhtkWebhook(params: {
  labelId: string
  partnerId: string
  statusId: number
  reasonCode?: string
  reason?: string
  weight?: number
  fee?: number
  pickMoney?: number
  targetUrlOverride?: string
}): Promise<WebhookSendResult> {
  const targetUrl = params.targetUrlOverride || getSetting('webhook_url')
  const contentType = getSetting('webhook_content_type', 'application/json')

  const payload: Record<string, unknown> = {
    partner_id: params.partnerId,
    label_id: params.labelId,
    status_id: params.statusId,
    action_time: new Date().toISOString(),
    reason_code: params.reasonCode || '',
    reason: params.reason || getStatusText(params.statusId),
    weight: params.weight ?? 0.5,
    fee: params.fee ?? 22000,
    pick_money: params.pickMoney ?? 0,
    return_part_package: 0
  }

  const startTime = Date.now()
  let responseStatus: number | null = null
  let responseBody = ''
  let errorMessage: string | undefined
  let requestHeaders: Record<string, string> = {}
  let requestBodyString = ''

  if (contentType === 'application/x-www-form-urlencoded') {
    requestHeaders = {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
    const formParams = new URLSearchParams()
    for (const [key, value] of Object.entries(payload)) {
      formParams.append(key, String(value ?? ''))
    }
    requestBodyString = formParams.toString()
  } else {
    requestHeaders = {
      'Content-Type': 'application/json'
    }
    requestBodyString = JSON.stringify(payload)
  }

  try {
    if (!targetUrl || !targetUrl.trim()) {
      throw new Error('Chua cau hinh Webhook URL')
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: requestBodyString,
      signal: controller.signal
    })

    clearTimeout(timeoutId)
    responseStatus = response.status
    responseBody = await response.text()
  } catch (err: unknown) {
    if (err instanceof Error) {
      errorMessage = err.name === 'AbortError' ? 'Timeout (qua 10 giay)' : err.message
    } else {
      errorMessage = String(err)
    }
  }

  const durationMs = Date.now() - startTime

  // Ghi nhat ky giao dich vao bang webhook_logs
  try {
    const logStmt = db.prepare(`
      INSERT INTO webhook_logs (
        label_id, partner_id, status_id, target_url,
        request_headers, request_payload, response_status,
        response_body, error_message, duration_ms, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    logStmt.run(
      params.labelId,
      params.partnerId,
      params.statusId,
      targetUrl,
      JSON.stringify(requestHeaders),
      JSON.stringify(payload),
      responseStatus,
      responseBody,
      errorMessage || null,
      durationMs,
      new Date().toISOString()
    )
  } catch (dbErr) {
    console.error('Loi khi ghi webhook_logs:', dbErr)
  }

  return {
    success: responseStatus !== null && responseStatus >= 200 && responseStatus < 300,
    status: responseStatus,
    responseBody,
    errorMessage,
    durationMs,
    targetUrl,
    payload
  }
}

// Gui yeu cau ping kiem tra ket noi den URL webhook
export async function pingWebhook(targetUrl: string): Promise<WebhookSendResult> {
  return sendGhtkWebhook({
    labelId: 'PING.TEST.' + Date.now().toString().slice(-6),
    partnerId: 'PING_TEST_ORDER',
    statusId: 2,
    reason: 'Kiem tra ket noi webhook tu GHTK Mock',
    targetUrlOverride: targetUrl
  })
}
