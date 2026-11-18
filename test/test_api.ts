import { app } from '../src/app'

async function runTests() {
  console.log('--- BAT DAU KIEM THU 100% THEO DAC TA TESTING/GHTK ---')

  // 1. Kiem thu Check Authenticated
  console.log('[TEST] GET /services/authenticated hop le:')
  const authRes = await app.request('/services/authenticated', {
    headers: { Token: 'mock-ghtk-token-dev', 'X-Client-Source': 'S308157' }
  })
  const authData = await authRes.json()
  console.log('Ket qua auth hop le:', authData)
  if (!authData.success || !authData.log_id) {
    throw new Error('Test authenticated that bai')
  }

  console.log('[TEST] GET /services/authenticated khong co token (401):')
  const authFailRes = await app.request('/services/authenticated')
  const authFailData = await authFailRes.json()
  if (authFailRes.status !== 401 || authFailData.error_code !== '20101') {
    throw new Error('Test 401 authenticated that bai')
  }

  // 2. Kiem thu Calculate Shipping Fee
  console.log('[TEST] GET /services/shipment/fee tinh phi van chuyen:')
  const feeRes = await app.request('/services/shipment/fee?pick_province=Ha+Noi&province=TP.+Ho+Chi+Minh&weight=1000&value=3000000&tags[]=1')
  const feeData = await feeRes.json()
  console.log('Ket qua tinh phi:', feeData)
  if (!feeData.success || !feeData.fee || typeof feeData.fee.fee !== 'number') {
    throw new Error('Test tinh phi that bai')
  }

  console.log('[TEST] GET /services/shipment/fee thieu province (422):')
  const feeMissingRes = await app.request('/services/shipment/fee?weight=1000')
  const feeMissingData = await feeMissingRes.json()
  if (feeMissingRes.status !== 422 || !feeMissingData.message.includes('province')) {
    throw new Error('Test 422 tinh phi that bai')
  }

  // 3. Kiem thu Submit Order Express
  const testId = `ORDER_TEST_${Date.now()}`
  console.log(`[TEST] POST /services/shipment/order/?ver=1.5 dang don moi (${testId}):`)
  const submitRes = await app.request('/services/shipment/order/?ver=1.5', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Token: 'mock-ghtk-token-dev' },
    body: JSON.stringify({
      products: [
        { name: 'But bi', price: 15000, weight: 0.1, quantity: 1, product_code: '23304A3MHLMVMXX625' }
      ],
      order: {
        id: testId,
        pick_name: 'HCM - Noi thanh',
        pick_address: '590 CMT8 P.11',
        pick_province: 'TP. Ho Chi Minh',
        pick_district: 'Quan 3',
        pick_ward: 'Phuong 11',
        pick_tel: '0911222333',
        tel: '0911222444',
        name: 'Nguyen Van A',
        address: '123 Nguyen Chi Thanh',
        province: 'TP. Ho Chi Minh',
        district: 'Quan 1',
        ward: 'Phuong Ben Nghe',
        is_freeship: '1',
        pick_money: 47000,
        value: 3000000,
        transport: 'fly'
      }
    })
  })
  const submitData = await submitRes.json()
  console.log('Ket qua submit order:', submitData)
  if (!submitData.success || !submitData.order.label || submitData.order.partner_id !== testId) {
    throw new Error('Test submit order that bai')
  }

  const labelId = submitData.order.label

  // 4. Kiem thu trung ma don hang (ORDER_ID_EXIST)
  console.log(`[TEST] POST /services/shipment/order trung ma don (${testId}):`)
  const dupRes = await app.request('/services/shipment/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order: { id: testId } })
  })
  const dupData = await dupRes.json()
  if (dupData.success !== false || dupData.error?.code !== 'ORDER_ID_EXIST') {
    throw new Error('Test ORDER_ID_EXIST that bai')
  }

  // 5. Kiem thu Get Order Tracking Status v2 (tra ve truong "order")
  console.log(`[TEST] GET /services/shipment/v2/${labelId}:`)
  const trackRes = await app.request(`/services/shipment/v2/${labelId}`)
  const trackData = await trackRes.json()
  console.log('Ket qua tracking v2:', trackData)
  if (!trackData.success || !trackData.order || trackData.order.partner_id !== testId) {
    throw new Error('Test tracking v2 tra ve truong order that bai')
  }

  // 6. Kiem thu Get Shop Solutions
  console.log('[TEST] GET /open/api/v1/shop/solution/list:')
  const solutionRes = await app.request('/open/api/v1/shop/solution/list')
  const solutionData = await solutionRes.json()
  if (!solutionData.success || !Array.isArray(solutionData.data)) {
    throw new Error('Test solution list that bai')
  }

  // 7. Kiem thu Print Order Label (PDF binary header)
  console.log(`[TEST] GET /services/label/${labelId}:`)
  const labelRes = await app.request(`/services/label/${labelId}`)
  const contentType = labelRes.headers.get('Content-Type')
  if (!contentType || !contentType.includes('application/pdf')) {
    throw new Error('Test in nhan PDF that bai')
  }

  // 8. Kiem thu Cancel Order
  console.log(`[TEST] POST /services/shipment/cancel/${labelId}:`)
  const cancelRes = await app.request(`/services/shipment/cancel/${labelId}`, { method: 'POST' })
  const cancelData = await cancelRes.json()
  if (!cancelData.success || !cancelData.log_id) {
    throw new Error('Test cancel order that bai')
  }

  // 9. Kiem thu Cancel Order khi don da o trang thai huy (50101)
  console.log(`[TEST] POST /services/shipment/cancel/${labelId} lan 2 (da huy 50101):`)
  const cancelAgainRes = await app.request(`/services/shipment/cancel/${labelId}`, { method: 'POST' })
  const cancelAgainData = await cancelAgainRes.json()
  if (cancelAgainData.success !== false || cancelAgainData.error_code !== '50101') {
    throw new Error('Test 50101 da huy that bai')
  }

  // 10. Kiem thu danh sach kho lay hang list_pick_add
  console.log('[TEST] GET /services/shipment/list_pick_add:')
  const pickRes = await app.request('/services/shipment/list_pick_add')
  const pickData = await pickRes.json()
  if (!pickData.success || !Array.isArray(pickData.data) || pickData.data.length === 0) {
    throw new Error('Test list_pick_add that bai')
  }

  // 11. Kiem thu dia chi cap 4 getAddressLevel4
  console.log('[TEST] GET /services/address/getAddressLevel4:')
  const addrRes = await app.request('/services/address/getAddressLevel4')
  const addrData = await addrRes.json()
  if (!addrData.success || !Array.isArray(addrData.data)) {
    throw new Error('Test getAddressLevel4 that bai')
  }

  // 12. Kiem thu thong tin san pham
  console.log('[TEST] GET /services/kho-hang/thong-tin-san-pham?term=laptop:')
  const prodRes = await app.request('/services/kho-hang/thong-tin-san-pham?term=laptop')
  const prodData = await prodRes.json()
  if (!prodData.success || prodData.data.length === 0) {
    throw new Error('Test thong-tin-san-pham that bai')
  }

  // 13. Kiem thu B2C Shop creation & token
  console.log('[TEST] POST /services/shops/add:')
  const shopAddRes = await app.request('/services/shops/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Shop Test OHub', tel: '01234555666' })
  })
  const shopAddData = await shopAddRes.json()
  if (!shopAddData.success || !shopAddData.data?.token) {
    throw new Error('Test shops/add that bai')
  }

  console.log('[TEST] POST /services/shops/token:')
  const shopTokenRes = await app.request('/services/shops/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'shop@example.com', password: '1S@fF#K2' })
  })
  const shopTokenData = await shopTokenRes.json()
  if (!shopTokenData.success || !shopTokenData.data?.token) {
    throw new Error('Test shops/token that bai')
  }

  console.log('--- TAT CA 13 MUC KIEM THU CHUAN 100% THEO TESTING/GHTK DEU HOAN HAO ---')
}

runTests().catch((err) => {
  console.error('Loi test:', err)
  process.exit(1)
})
