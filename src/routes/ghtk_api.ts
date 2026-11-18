import { Hono } from 'hono'
import { db, getSetting } from '../db'
import { getStatusText } from '../constants'
import { sendGhtkWebhook } from '../services/webhook'

export const ghtkApiRouter = new Hono()

// Tao chuoi hex ngau nhien tuong thich 100% ca moi truong Web Standard va Node
function generateRandomHex(byteCount: number): string {
  const bytes = new Uint8Array(byteCount)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < byteCount; i++) {
      bytes[i] = Math.floor(Math.random() * 256)
    }
  }
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

function generateLogId(): string {
  return generateRandomHex(12)
}

// Xac thuc Token va phan quyen
ghtkApiRouter.all('/services/authenticated', (c) => {
  const token = c.req.header('Token') || c.req.header('token')

  if (!token || !token.trim()) {
    return c.json({
      success: false,
      message: 'Can cung cap token hop le',
      error_code: '20101',
      log_id: generateLogId()
    }, 401)
  }

  return c.json({
    success: true,
    message: 'Authenticated',
    log_id: generateLogId(),
    data: []
  }, 200)
})

// Tinh phi van chuyen
ghtkApiRouter.get('/services/shipment/fee', (c) => {
  const query = c.req.query()

  // Kiem tra bat buoc province theo dac ta 422
  if (!query.province || !query.province.trim()) {
    return c.json({
      success: false,
      message: 'Xin hay gui truong province.',
      error_code: '',
      log_id: generateLogId()
    }, 422)
  }

  const pickProvince = (query.pick_province || 'Ha Noi').trim().toLowerCase()
  const deliverProvince = (query.province || 'Ha Noi').trim().toLowerCase()

  // Trong API tinh phi, weight duoc tinh bang GRAM (khac voi API dang don mac dinh KG)
  const weightGram = Number(query.weight || 500)
  const weightKg = weightGram / 1000
  const orderValue = Number(query.value || 0)

  const isIntraProvince = pickProvince.includes(deliverProvince) || deliverProvince.includes(pickProvince)
  const baseFee = isIntraProvince ? 22000 : 32000
  const extraWeightFee = weightKg > 0.5 ? Math.ceil((weightKg - 0.5) / 0.5) * 5000 : 0
  const insuranceFee = orderValue > 1000000 ? Math.round(orderValue * 0.005) : 0
  const totalFee = baseFee + extraWeightFee + insuranceFee

  const extFees: Array<{ display: string; title: string; amount: number; type: string }> = []
  if (query['tags[]'] === '1' || query['tags'] === '1') {
    extFees.push({
      display: '(+ 7,400 d)',
      title: 'Phu phi hang de vo',
      amount: 7400,
      type: 'fragile'
    })
  }

  return c.json({
    success: true,
    message: '',
    fee: {
      name: isIntraProvince ? 'area1' : 'area2',
      fee: totalFee,
      insurance_fee: insuranceFee,
      delivery_type: isIntraProvince ? 'only_hanoi' : 'interprovincial',
      a: 3,
      dt: isIntraProvince ? 'local' : 'interprovincial',
      extFees,
      delivery: true
    }
  }, 200)
})

// Dang don hang moi (Submit Order Express & B2C Order)
const handleOrderSubmit = async (c: any) => {
  let body: Record<string, any>
  try {
    body = await c.req.json()
  } catch {
    return c.json({
      success: false,
      message: 'Thieu thong tin don hang',
      error_code: '30101',
      log_id: generateLogId()
    }, 422)
  }

  const orderData = body.order
  if (!orderData || !orderData.id) {
    return c.json({
      success: false,
      message: 'Thieu thong tin don hang',
      error_code: '30101',
      log_id: generateLogId()
    }, 422)
  }

  const partnerId = String(orderData.id).trim()

  // Kiem tra trung ma don hang ORDER_ID_EXIST
  const checkStmt = db.prepare('SELECT * FROM orders WHERE partner_id = ?')
  const existing = checkStmt.get(partnerId) as any

  if (existing) {
    return c.json({
      success: false,
      message: 'Ma don hang cua ban da ton tai tren he thong GHTK',
      error: {
        code: 'ORDER_ID_EXIST',
        partner_id: partnerId,
        ghtk_label: existing.label_id,
        created: existing.created_at,
        status: existing.status_id
      }
    }, 200)
  }

  // Sinh ma van don chuan GHTK
  const timestampSeq = Date.now().toString().slice(-6)
  const randomSuffix = Math.floor(1000 + Math.random() * 9000)
  const labelId = `S1.A1.${timestampSeq}${randomSuffix}`
  const trackingId = Math.floor(1000000000 + Math.random() * 9000000000)

  // Khoi luong trong submit order mac dinh la KG hoac gram tuy weight_option
  let totalWeight = Number(orderData.total_weight || 0)
  if (!totalWeight && Array.isArray(body.products)) {
    for (const p of body.products) {
      totalWeight += Number(p.weight || 0) * Number(p.quantity || 1)
    }
  }
  if (!totalWeight) totalWeight = 0.5
  if (orderData.weight_option === 'gram' || totalWeight > 50) {
    totalWeight = totalWeight / 1000
  }

  const pickMoney = Number(orderData.pick_money || 0)
  const orderValue = Number(orderData.value || 0)

  const isIntra = (orderData.pick_province || '').toLowerCase() === (orderData.province || orderData.deliver_province || '').toLowerCase()
  const baseFee = isIntra ? 22000 : 32000
  const extraWeightFee = totalWeight > 0.5 ? Math.ceil((totalWeight - 0.5) / 0.5) * 5000 : 0
  const insuranceFee = orderValue > 1000000 ? Math.round(orderValue * 0.005) : 0
  const finalFee = baseFee + extraWeightFee + insuranceFee

  const nowIso = new Date().toISOString()
  const initialStatusId = 2
  const initialStatusText = getStatusText(initialStatusId)

  const deliverName = orderData.name || orderData.deliver_name || 'Khach hang'
  const deliverTel = orderData.tel || orderData.deliver_tel || '0911222333'
  const deliverAddress = orderData.address || orderData.deliver_address || ''
  const deliverProvince = orderData.province || orderData.deliver_province || 'TP. Ho Chi Minh'
  const deliverDistrict = orderData.district || orderData.deliver_district || 'Quan 1'
  const deliverWard = orderData.ward || orderData.deliver_ward || ''

  // Luu vao SQLite
  const insertOrderStmt = db.prepare(`
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

  insertOrderStmt.run(
    labelId,
    partnerId,
    initialStatusId,
    initialStatusText,
    orderData.pick_name || 'Kho mac dinh',
    orderData.pick_tel || '0911222333',
    orderData.pick_address || '',
    orderData.pick_province || 'TP. Ho Chi Minh',
    orderData.pick_district || 'Quan 3',
    orderData.pick_ward || '',
    deliverName,
    deliverTel,
    deliverAddress,
    deliverProvince,
    deliverDistrict,
    deliverWard,
    totalWeight,
    finalFee,
    insuranceFee,
    pickMoney,
    orderValue,
    orderData.transport || 'road',
    String(orderData.is_freeship ?? '1'),
    orderData.note || '',
    nowIso,
    nowIso
  )

  if (Array.isArray(body.products) && body.products.length > 0) {
    const insertProductStmt = db.prepare(`
      INSERT INTO order_products (order_label_id, name, weight, quantity, product_code, price)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    for (const p of body.products) {
      insertProductStmt.run(
        labelId,
        p.name || 'San pham',
        Number(p.weight || 0.2),
        Number(p.quantity || 1),
        String(p.product_code || ''),
        Number(p.price || 0)
      )
    }
  }

  // Tu dong ban webhook tao don neu duoc bat
  if (getSetting('auto_push_on_create', '1') === '1') {
    sendGhtkWebhook({
      labelId,
      partnerId,
      statusId: initialStatusId,
      reason: initialStatusText,
      weight: totalWeight,
      fee: finalFee,
      pickMoney
    }).catch((err) => console.error('Loi auto webhook create:', err))
  }

  return c.json({
    success: true,
    message: '',
    order: {
      partner_id: partnerId,
      label: labelId,
      area: '1',
      fee: String(finalFee),
      insurance_fee: String(insuranceFee),
      tracking_id: trackingId,
      estimated_pick_time: 'Sang 2026-11-19',
      estimated_deliver_time: 'Chieu 2026-11-20',
      products: [],
      status_id: initialStatusId
    }
  }, 200)
}

// Dang ky ca endpoint khong co slash va co slash ver=1.5
ghtkApiRouter.post('/services/shipment/order', handleOrderSubmit)
ghtkApiRouter.post('/services/shipment/order/', handleOrderSubmit)

// Tra cuu hanh trinh don hang v2
ghtkApiRouter.get('/services/shipment/v2/:tracking_order', (c) => {
  let trackingOrder = c.req.param('tracking_order')
  if (trackingOrder.startsWith('partner_id:')) {
    trackingOrder = trackingOrder.replace('partner_id:', '')
  }

  const stmt = db.prepare('SELECT * FROM orders WHERE label_id = ? OR partner_id = ?')
  const order = stmt.get(trackingOrder, trackingOrder) as any

  if (!order) {
    return c.json({
      success: false,
      message: 'Khong tim thay van don tren he thong',
      error_code: '50109',
      log_id: generateLogId()
    }, 400)
  }

  const fullAddress = [
    order.deliver_address,
    order.deliver_ward,
    order.deliver_district,
    order.deliver_province
  ].filter(Boolean).join(' ')

  const weightGram = Math.round((order.total_weight || 0.5) * 1000)

  return c.json({
    success: true,
    message: '',
    order: {
      label_id: order.label_id,
      partner_id: order.partner_id,
      status: String(order.status_id),
      status_text: order.status_text,
      created: order.created_at ? order.created_at.replace('T', ' ').slice(0, 19) : '',
      modified: order.updated_at ? order.updated_at.replace('T', ' ').slice(0, 19) : '',
      message: order.note || 'Khong giao hang 1 phan',
      pick_date: order.created_at ? order.created_at.slice(0, 10) : '',
      deliver_date: order.updated_at ? order.updated_at.slice(0, 10) : '',
      customer_fullname: order.deliver_name,
      customer_tel: order.deliver_tel,
      address: fullAddress,
      storage_day: '3',
      ship_money: String(order.fee),
      insurance: String(order.insurance_fee || 0),
      value: String(order.value || 0),
      weight: String(weightGram),
      pick_money: order.pick_money,
      is_freeship: String(order.is_freeship || '1'),
      ext_fees: []
    }
  }, 200)
})

// Huy don hang (Cancel Order)
const handleOrderCancel = async (c: any) => {
  let trackingOrder = c.req.param('tracking_order')
  if (trackingOrder.startsWith('partner_id:')) {
    trackingOrder = trackingOrder.replace('partner_id:', '')
  }

  const stmt = db.prepare('SELECT * FROM orders WHERE label_id = ? OR partner_id = ?')
  const order = stmt.get(trackingOrder, trackingOrder) as any

  if (!order) {
    return c.json({
      success: false,
      message: 'Khong tim thay van don tren he thong',
      error_code: '50109',
      log_id: generateLogId()
    }, 400)
  }

  // Neu don da o trang thai huy (-1)
  if (order.status_id === -1) {
    return c.json({
      success: false,
      message: 'Don hang da o trang thai huy',
      error_code: '50101',
      log_id: generateLogId()
    }, 200)
  }

  // Neu don da lay hang (status >= 3)
  if (order.status_id >= 3 && order.status_id !== 12) {
    return c.json({
      success: false,
      message: 'Don da lay hang, khong the huy don.',
      error_code: '50102',
      log_id: generateLogId()
    }, 200)
  }

  const cancelStatusId = -1
  const cancelStatusText = getStatusText(cancelStatusId)
  const nowIso = new Date().toISOString()

  const updateStmt = db.prepare(`
    UPDATE orders
    SET status_id = ?, status_text = ?, updated_at = ?
    WHERE label_id = ?
  `)
  updateStmt.run(cancelStatusId, cancelStatusText, nowIso, order.label_id)

  if (getSetting('auto_push_on_cancel', '1') === '1') {
    sendGhtkWebhook({
      labelId: order.label_id,
      partnerId: order.partner_id,
      statusId: cancelStatusId,
      reason: 'Shop yeu cau huy don hang',
      weight: order.total_weight,
      fee: order.fee,
      pickMoney: order.pick_money
    }).catch((err) => console.error('Loi auto webhook cancel:', err))
  }

  return c.json({
    success: true,
    message: '',
    log_id: generateLogId()
  }, 200)
}

ghtkApiRouter.post('/services/shipment/cancel/:tracking_order', handleOrderCancel)
ghtkApiRouter.get('/services/shipment/cancel/:tracking_order', handleOrderCancel)

// Lay danh sach giai phap GAM
ghtkApiRouter.get('/open/api/v1/shop/solution/list', (c) => {
  return c.json({
    success: true,
    data: [
      {
        solution_id: 1340164168838205440,
        description: 'Giup shop dam bao ngoai quan san pham duoc giu nguyen ven trong suot qua trinh van chuyen.',
        group_name: 'Goi giai phap an toan hang hoa toan dien'
      },
      {
        solution_id: 1341971770371706880,
        description: 'Giup shop dam bao an toan tuyet doi.',
        group_name: 'Goi giai phap an toan hang hoa toan dien'
      }
    ],
    message: 'Thanh cong!',
    code: 200,
    rid: generateLogId().slice(0, 12)
  }, 200)
})

// In nhan van don (Print Order Label - tra ve PDF hoac loi)
ghtkApiRouter.get('/services/label/:tracking_order', (c) => {
  let trackingOrder = c.req.param('tracking_order')
  if (trackingOrder.startsWith('partner_id:')) {
    trackingOrder = trackingOrder.replace('partner_id:', '')
  }

  const stmt = db.prepare('SELECT * FROM orders WHERE label_id = ? OR partner_id = ?')
  const order = stmt.get(trackingOrder, trackingOrder) as any

  if (!order) {
    return c.json({
      success: false,
      message: 'Ma van don khong hop le, khong tim thay van don'
    }, 200)
  }

  // Kiem tra neu client yeu cau HTML xem tren browser hoac goi tai ve PDF
  const acceptHeader = c.req.header('Accept') || ''
  if (acceptHeader.includes('text/html')) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Nhan Don Hang - ${order.label_id}</title>
        <style>
          body { font-family: monospace, sans-serif; padding: 20px; }
          .label-card { width: 380px; border: 2px solid #000; padding: 15px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; }
          .barcode { font-size: 22px; font-weight: bold; text-align: center; margin: 12px 0; background: #eee; padding: 8px; }
        </style>
      </head>
      <body>
        <div class="label-card">
          <div class="header">
            <h3>GIAO HANG TIET KIEM - GHTK</h3>
            <p>Ma shop: ${order.partner_id}</p>
          </div>
          <div class="barcode">||||| ${order.label_id} |||||</div>
          <p><strong>Nguoi nhan:</strong> ${order.deliver_name} (${order.deliver_tel})</p>
          <p>${order.deliver_address}, ${order.deliver_district}, ${order.deliver_province}</p>
          <hr/>
          <p><strong>Tien thu ho (COD):</strong> ${Number(order.pick_money).toLocaleString('vi-VN')} VND</p>
          <p><strong>Phi ship:</strong> ${Number(order.fee).toLocaleString('vi-VN')} VND</p>
          <p><strong>Trong luong:</strong> ${order.total_weight} kg</p>
        </div>
      </body>
      </html>
    `
    return c.html(html)
  }

  // Tra ve binary PDF theo chuan
  const pdfHeader = new TextEncoder().encode(
    `%PDF-1.4\n1 0 obj\n<< /Title (${order.label_id}) /Producer (GHTK Mock Server) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n`
  )

  c.header('Content-Type', 'application/pdf')
  c.header('Content-Disposition', `attachment; filename="${order.label_id}.pdf"`)
  c.header('Content-Transfer-Encoding', 'binary')
  return c.body(pdfHeader)
})

// Danh sach dia chi lay hang cua shop
ghtkApiRouter.get('/services/shipment/list_pick_add', (c) => {
  return c.json({
    success: true,
    message: '',
    data: [
      {
        pick_address_id: '88256',
        address: 'So nha 105, ngo 13 Linh Nam, Phuong Mai Dong, Quan Hoang Mai, Tp. Ha Noi, Linh Nam, Ha Noi',
        pick_tel: '0987654321',
        pick_name: 'Store 1'
      },
      {
        pick_address_id: '88260',
        address: '1312, Phuong 1, Quan Binh Thanh, TP Ho Chi Minh',
        pick_tel: '0987654321',
        pick_name: 'Store 2'
      }
    ]
  }, 200)
})

// Lay dia chi cap 4 (thon, ap, ngo, toa nha)
ghtkApiRouter.get('/services/address/getAddressLevel4', (c) => {
  return c.json({
    success: true,
    data: [
      'IIG - 75 Giang Van Minh',
      'Vinapaco Building - 142 Doi Can',
      'THCS Thong Nhat',
      'Ngo 47 Doi Can',
      'Ngo 46 Doi Can'
    ]
  }, 200)
})

// Tra cuu san pham kho hang
ghtkApiRouter.get('/services/kho-hang/thong-tin-san-pham', (c) => {
  const term = (c.req.query('term') || '').toLowerCase().trim()

  const allProducts = [
    {
      full_name: 'Laptop Asus',
      product_code: '23304A3MHLMVMXX625',
      weigh: 2,
      cost: 8000000
    },
    {
      full_name: 'Laptop Dell',
      product_code: '23304A3MHLMVMXX888',
      weigh: 2.5,
      cost: 12000000
    }
  ]

  const matched = term ? allProducts.filter(p => p.full_name.toLowerCase().includes(term)) : allProducts

  return c.json({
    success: true,
    data: matched
  }, 200)
})

// Tao tai khoan sub-shop B2C
ghtkApiRouter.post('/services/shops/add', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const randomCode = 'S' + Math.floor(10000 + Math.random() * 90000)
  const randomToken = generateRandomHex(20).toUpperCase()

  return c.json({
    success: true,
    message: 'Thanh cong',
    data: {
      code: randomCode,
      token: randomToken
    }
  }, 200)
})

// Lay token shop B2C da co
ghtkApiRouter.post('/services/shops/token', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  if (body.email === 'invalid@example.com') {
    return c.json({
      success: false,
      message: 'Du lieu dang nhap khong hop le'
    }, 200)
  }

  return c.json({
    success: true,
    message: 'Thanh cong',
    data: {
      code: 'S19159',
      token: '5568B780966147C0764EDD207af0233516E4c683'
    }
  }, 200)
})
