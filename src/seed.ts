import { db } from './db'
import { getStatusText } from './constants'

interface SeedOrder {
  label_id: string
  partner_id: string
  status_id: number
  pick_name: string
  pick_tel: string
  pick_address: string
  pick_province: string
  pick_district: string
  pick_ward: string
  deliver_name: string
  deliver_tel: string
  deliver_address: string
  deliver_province: string
  deliver_district: string
  deliver_ward: string
  total_weight: number
  fee: number
  insurance_fee: number
  pick_money: number
  value: number
  transport: string
  note: string
  reason?: string
  products: Array<{
    name: string
    weight: number
    quantity: number
    product_code: string
    price: number
  }>
}

// 3 don hang mau cot loi bat buoc phai co de khop voi Bruno collection trong testing/ghtk
const coreOrders: SeedOrder[] = [
  {
    label_id: 'S1.A1.17373471',
    partner_id: 'a4',
    status_id: 1,
    pick_name: 'HCM - Noi thanh',
    pick_tel: '0911222333',
    pick_address: '590 CMT8 P.11',
    pick_province: 'TP. Ho Chi Minh',
    pick_district: 'Quan 3',
    pick_ward: 'Phuong 11',
    deliver_name: 'Van Nguyen',
    deliver_tel: '0911222333',
    deliver_address: '123 nguyen chi thanh',
    deliver_province: 'TP. Ho Chi Minh',
    deliver_district: 'Quan 1',
    deliver_ward: 'Phuong Ben Nghe',
    total_weight: 0.3,
    fee: 16500,
    insurance_fee: 16500,
    pick_money: 47000,
    value: 3000000,
    transport: 'fly',
    note: 'Khoi luong tinh cuoc toi da: 1.00 kg',
    products: [
      { name: 'But bi', weight: 0.1, quantity: 1, product_code: '23304A3MHLMVMXX625', price: 15000 },
      { name: 'Tay', weight: 0.2, quantity: 1, product_code: '', price: 10000 }
    ]
  },
  {
    label_id: 'S1.A1.2001297581',
    partner_id: '123123a',
    status_id: 2,
    pick_name: 'HCM-noi thanh',
    pick_tel: '0911222333',
    pick_address: '590 CMT8 P.11',
    pick_province: 'TP. Ho Chi Minh',
    pick_district: 'Quan 3',
    pick_ward: 'Phuong 1',
    deliver_name: 'GHTK - HCM - Noi Thanh',
    deliver_tel: '0911222444',
    deliver_address: '123 nguyen chi thanh',
    deliver_province: 'TP. Ho Chi Minh',
    deliver_district: 'Quan 1',
    deliver_ward: 'Phuong Ben Nghe',
    total_weight: 0.3,
    fee: 30400,
    insurance_fee: 15000,
    pick_money: 47000,
    value: 3000000,
    transport: 'fly',
    note: 'Khach hen giao buoi chieu',
    products: [
      { name: 'but', weight: 0.1, quantity: 1, product_code: '1241', price: 15000 },
      { name: 'tay', weight: 0.2, quantity: 1, product_code: '1254', price: 10000 }
    ]
  },
  {
    label_id: 'S1.A1.1737345',
    partner_id: '1234567',
    status_id: 5,
    pick_name: 'Kho Tong Ha Noi',
    pick_tel: '0987654321',
    pick_address: 'So 105, ngo 13 Linh Nam',
    pick_province: 'Ha Noi',
    pick_district: 'Quan Hoang Mai',
    pick_ward: 'Phuong Mai Dong',
    deliver_name: 'Nguyen Van B',
    deliver_tel: '0988776655',
    deliver_address: '456 Le Duan',
    deliver_province: 'Ha Noi',
    deliver_district: 'Quan Dong Da',
    deliver_ward: 'Phuong Phuong Lien',
    total_weight: 2.4,
    fee: 15000,
    insurance_fee: 0,
    pick_money: 100000,
    value: 100000,
    transport: 'road',
    note: 'Da giao hang thanh cong cho nguoi nhan',
    products: [
      { name: 'Laptop Asus', weight: 2.0, quantity: 1, product_code: '23304A3MHLMVMXX625', price: 8000000 }
    ]
  }
]

const warehouses = [
  { name: 'Kho Tong Ha Noi', tel: '0987654321', addr: 'So 105 Linh Nam', ward: 'Phuong Mai Dong', dist: 'Quan Hoang Mai', prov: 'Ha Noi' },
  { name: 'Kho Tong TP.HCM', tel: '0911222333', addr: '1312, Phuong 1', ward: 'Phuong 1', dist: 'Quan Binh Thanh', prov: 'TP. Ho Chi Minh' },
  { name: 'Kho Trung Chuyen Da Nang', tel: '0909888777', addr: '45 Dien Bien Phu', ward: 'Phuong Chinh Gian', dist: 'Quan Thanh Khe', prov: 'Da Nang' },
  { name: 'Kho Chi Nhanh Bac Ninh', tel: '0983222333', addr: 'Khu Cong Nghiep Que Vo', ward: 'Xa Phuong Lieu', dist: 'Huyen Que Vo', prov: 'Bac Ninh' },
  { name: 'Kho Chi Nhanh Can Tho', tel: '0901222333', addr: '333 30 Thang 4', ward: 'Phuong Xuan Khanh', dist: 'Quan Ninh Kieu', prov: 'Can Tho' },
  { name: 'Kho Chi Nhanh Hai Phong', tel: '0934111222', addr: '12 Lach Tray', ward: 'Phuong Lach Tray', dist: 'Quan Ngo Quyen', prov: 'Hai Phong' }
]

const locationPresets = [
  { prov: 'Ha Noi', dist: 'Quan Hoan Kiem', ward: 'Phuong Hang Trong', street: 'Pho Trang Thi' },
  { prov: 'Ha Noi', dist: 'Quan Dong Da', ward: 'Phuong O Cho Dua', street: 'Pho Ton Duc Thang' },
  { prov: 'Ha Noi', dist: 'Quan Cau Giay', ward: 'Phuong Dich Vong', street: 'Duong Xuan Thuy' },
  { prov: 'Ha Noi', dist: 'Quan Hai Ba Trung', ward: 'Phuong Bach Khoa', street: 'Pho Dai Co Viet' },
  { prov: 'Ha Noi', dist: 'Quan Ha Dong', ward: 'Phuong Mo Lao', street: 'Pho Tran Phu' },
  { prov: 'TP. Ho Chi Minh', dist: 'Quan 1', ward: 'Phuong Ben Nghe', street: 'Duong Nguyen Hue' },
  { prov: 'TP. Ho Chi Minh', dist: 'Quan 3', ward: 'Phuong Vo Thi Sau', street: 'Duong Vo Van Tan' },
  { prov: 'TP. Ho Chi Minh', dist: 'Quan Binh Thanh', ward: 'Phuong 25', street: 'Duong Dien Bien Phu' },
  { prov: 'TP. Ho Chi Minh', dist: 'Quan Tan Binh', ward: 'Phuong 2', street: 'Duong Truong Son' },
  { prov: 'TP. Ho Chi Minh', dist: 'Thanh pho Thu Duc', ward: 'Phuong Thao Dien', street: 'Duong Xuan Thuy' },
  { prov: 'Da Nang', dist: 'Quan Hai Chau', ward: 'Phuong Thach Thang', street: 'Duong Bach Dang' },
  { prov: 'Da Nang', dist: 'Quan Son Tra', ward: 'Phuong An Hai Bac', street: 'Duong Pham Van Dong' },
  { prov: 'Hai Phong', dist: 'Quan Ngo Quyen', ward: 'Phuong May To', street: 'Duong Le Thanh Tong' },
  { prov: 'Hai Phong', dist: 'Quan Le Chan', ward: 'Phuong An Bien', street: 'Duong To Hieu' },
  { prov: 'Can Tho', dist: 'Quan Ninh Kieu', ward: 'Phuong An Cu', street: 'Duong Mau Than' },
  { prov: 'Binh Duong', dist: 'Thanh pho Thu Dau Mot', ward: 'Phuong Phu Cuong', street: 'Dai lo Binh Duong' },
  { prov: 'Binh Duong', dist: 'Thanh pho Di An', ward: 'Phuong Di An', street: 'Duong Ly Thuong Kiet' },
  { prov: 'Dong Nai', dist: 'Thanh pho Bien Hoa', ward: 'Phuong Trung Dung', street: 'Duong 30 Thang 4' },
  { prov: 'Quang Ninh', dist: 'Thanh pho Ha Long', ward: 'Phuong Bai Chay', street: 'Duong Ha Long' },
  { prov: 'Bac Ninh', dist: 'Thanh pho Bac Ninh', ward: 'Phuong Ninh Xa', street: 'Duong Nguyen Du' },
  { prov: 'Thua Thien Hue', dist: 'Thanh pho Hue', ward: 'Phuong Vinh Ninh', street: 'Duong Le Loi' },
  { prov: 'Khanh Hoa', dist: 'Thanh pho Nha Trang', ward: 'Phuong Loc Tho', street: 'Duong Tran Phu' },
  { prov: 'Ba Ria - Vung Tau', dist: 'Thanh pho Vung Tau', ward: 'Phuong Thang Tam', street: 'Duong Thuy Van' },
  { prov: 'Lam Dong', dist: 'Thanh pho Da Lat', ward: 'Phuong 1', street: 'Duong Nguyen Thi Minh Khai' },
  { prov: 'Thanh Hoa', dist: 'Thanh pho Thanh Hoa', ward: 'Phuong Ba Dinh', street: 'Duong Phan Chu Trinh' },
  { prov: 'Nghe An', dist: 'Thanh pho Vinh', ward: 'Phuong Truong Thi', street: 'Duong Truong Thi' },
  { prov: 'Thai Nguyen', dist: 'Thanh pho Thai Nguyen', ward: 'Phuong Hoang Van Thu', street: 'Duong Luong Ngoc Quyen' },
  { prov: 'Nam Dinh', dist: 'Thanh pho Nam Dinh', ward: 'Phuong Tran Hung Dao', street: 'Duong Tran Hung Dao' },
  { prov: 'Hai Duong', dist: 'Thanh pho Hai Duong', ward: 'Phuong Le Thanh Nghi', street: 'Duong Nguyen Luong Bang' },
  { prov: 'Dak Lak', dist: 'Thanh pho Buon Ma Thuot', ward: 'Phuong Tan An', street: 'Duong Nguyen Tat Thanh' },
  { prov: 'Tien Giang', dist: 'Thanh pho My Tho', ward: 'Phuong 4', street: 'Duong Ap Bac' },
  { prov: 'Ben Tre', dist: 'Thanh pho Ben Tre', ward: 'Phuong An Hoi', street: 'Duong Dong Khoi' },
  { prov: 'Vinh Long', dist: 'Thanh pho Vinh Long', ward: 'Phuong 1', street: 'Duong Trung Nu Vuong' },
  { prov: 'Kien Giang', dist: 'Thanh pho Rach Gia', ward: 'Phuong Vinh Thanh', street: 'Duong Nguyen Trung Truc' },
  { prov: 'An Giang', dist: 'Thanh pho Long Xuyen', ward: 'Phuong My Binh', street: 'Duong Tran Hung Dao' },
  { prov: 'Binh Dinh', dist: 'Thanh pho Quy Nhon', ward: 'Phuong Tran Phu', street: 'Duong An Duong Vuong' },
  { prov: 'Phu Yen', dist: 'Thanh pho Tuy Hoa', ward: 'Phuong 5', street: 'Duong Hung Vuong' },
  { prov: 'Quang Nam', dist: 'Thanh pho Hoi An', ward: 'Phuong Minh An', street: 'Duong Tran Phu' },
  { prov: 'Quang Ngai', dist: 'Thanh pho Quang Ngai', ward: 'Phuong Tran Phu', street: 'Duong Quang Trung' },
  { prov: 'Binh Thuan', dist: 'Thanh pho Phan Thiet', ward: 'Phuong Duc Thang', street: 'Duong Tran Hung Dao' },
  { prov: 'Ca Mau', dist: 'Thanh pho Ca Mau', ward: 'Phuong 5', street: 'Duong Tran Hung Dao' },
  { prov: 'Son La', dist: 'Thanh pho Son La', ward: 'Phuong To Hieu', street: 'Duong Chu Van Thinh' },
  { prov: 'Lao Cai', dist: 'Thanh pho Lao Cai', ward: 'Phuong Kim Tan', street: 'Duong Hoang Lien' }
]

const lastNames = ['Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Huynh', 'Phan', 'Vu', 'Vo', 'Dang', 'Bui', 'Do', 'Ho', 'Ngo', 'Duong', 'Ly', 'Dinh', 'Doan']
const middleNames = ['Van', 'Thi', 'Hoang', 'Minh', 'Huu', 'Duc', 'Quang', 'Quoc', 'Thanh', 'Ngoc', 'Anh', 'Gia', 'Tuan', 'Trong', 'Tien', 'Thu', 'Xuan']
const firstNames = ['An', 'Binh', 'Cuong', 'Dung', 'Dat', 'Giang', 'Ha', 'Hai', 'Hung', 'Huy', 'Khanh', 'Khoa', 'Linh', 'Long', 'Mai', 'Nam', 'Nga', 'Phong', 'Phuc', 'Quan', 'Son', 'Tam', 'Thao', 'Thang', 'Thinh', 'Trang', 'Trung', 'Tuan', 'Tung', 'Vy', 'Yen']

const productsCatalog = [
  { name: 'Ao thun polo nam thoang khi', weight: 0.25, price: 180000, code: 'AT-POLO' },
  { name: 'Quan jean nam co gian 4 chieu', weight: 0.55, price: 350000, code: 'QJ-NAM' },
  { name: 'Giay the thao Sneaker nam nu', weight: 0.8, price: 520000, code: 'SN-UNISEX' },
  { name: 'Balo laptop chong nuoc 15.6 inch', weight: 0.75, price: 420000, code: 'BL-LAP' },
  { name: 'Tai nghe Bluetooth True Wireless', weight: 0.2, price: 450000, code: 'TN-TWS' },
  { name: 'Sac du phong 20000mAh sac nhanh 22.5W', weight: 0.4, price: 380000, code: 'SDP-20K' },
  { name: 'Bo am chen gom su Bat Trang', weight: 1.2, price: 650000, code: 'AC-BT' },
  { name: 'Noi com dien da nang 1.8L', weight: 2.5, price: 890000, code: 'NC-18L' },
  { name: 'Kem duong am phuc hoi da Centella', weight: 0.15, price: 280000, code: 'KD-SKIN' },
  { name: 'Serum vitamin C sang da 30ml', weight: 0.1, price: 320000, code: 'SR-VITC' },
  { name: 'Mu bao hiem Royal nua dau kem kinh', weight: 0.5, price: 210000, code: 'MBH-ROYAL' },
  { name: 'Binh giu nhiet inox 316 800ml', weight: 0.35, price: 195000, code: 'BGN-800' },
  { name: 'Bo dao bep thep Nhat 5 mon', weight: 0.9, price: 450000, code: 'DAO-5M' },
  { name: 'Den hoc chong can LED cam ung 3 che do', weight: 0.6, price: 260000, code: 'DEN-LED' },
  { name: 'Ban phim co khong day 3 che do ket noi', weight: 0.7, price: 650000, code: 'BP-CO' },
  { name: 'Chuot may tinh khong day Silent', weight: 0.15, price: 175000, code: 'MS-SILENT' },
  { name: 'Noi chien khong dau dien tu 6L', weight: 3.2, price: 1350000, code: 'NC-6L' },
  { name: 'Vay hoa nhi xoe vintage mua he', weight: 0.35, price: 295000, code: 'VAY-HN' },
  { name: 'Dong ho deo tay nam the thao nam chong nuoc', weight: 0.25, price: 780000, code: 'DH-SPORT' },
  { name: 'Kinh mat thoi trang chong tia UV400', weight: 0.15, price: 150000, code: 'KM-UV' },
  { name: 'Dien thoai thong minh 128GB', weight: 0.45, price: 7200000, code: 'DT-128G' },
  { name: 'May say toc ion am toc do cao', weight: 0.6, price: 390000, code: 'MS-ION' },
  { name: 'Tham tap yoga TPE 2 lop chong truot', weight: 0.9, price: 230000, code: 'THAM-YOGA' },
  { name: 'Bo chai xit ve sinh noi that o to', weight: 0.7, price: 185000, code: 'O-TO-VS' },
  { name: 'Hop thuc pham thuy tinh chiu nhiet 3 ngan', weight: 0.8, price: 145000, code: 'HOP-TT' }
]

const statusReasonMap: Record<number, string[]> = {
  [-1]: [
    'Nguoi mua doi y khong con nhu cau',
    'Shop het hang ton kho',
    'Dat trung don hang',
    'Khach khong dong y muc phi van chuyen',
    'Shop huy don theo yeu cau cua khach hang'
  ],
  [7]: [
    'Shop chua dong goi xong hen ca chieu',
    'Shop dong cua khong co nguoi giao hang',
    'Dia chi lay hang sai khong tim thay nha'
  ],
  [8]: [
    'Shop ban kiem ke kho dot xuat',
    'Shop yeu cau doi gio lay hang sang ngay mai',
    'Troi mua bao lon kho de nghi hoan ca lay'
  ],
  [9]: [
    'Nguoi nhan thue bao khong lien lac duoc',
    'Khach di vang khong co nguoi nhan thay',
    'Sai dia chi giao hang nguoi nhan khong o day'
  ],
  [10]: [
    'Khach hen giao lai sau gio hanh chinh',
    'Khu vuc sua duong khach hen giao lai sau',
    'Khach ban di cong tac hen giao dau tuan toi',
    'Khach chua du tien mat de thanh toan COD'
  ],
  [11]: [
    'Doi soat phi tra hang',
    'Hoan tat doi soat cong no phi chuyen hoan'
  ],
  [13]: [
    'GHTK boi thuong do su co be vo san pham',
    'Boi thuong don hang that lac tren tuyen trung chuyen'
  ],
  [20]: [
    'Khach tu choi nhan do khong ung mau ma',
    'Khach khong dong y xem hang truoc',
    'Hang khong dung mo ta khach yeu cau tra ve'
  ],
  [21]: [
    'Da hoan tra ve cho shop thanh cong',
    'Shop da ky nhan hang tra tai kho'
  ]
}

// Sinh 300 don hang bao phu toan bo 16 ma trang thai tren 63 tinh thanh
function generateLargeDataset(total = 300): SeedOrder[] {
  const result: SeedOrder[] = [...coreOrders]

  // Ty trong phan bo trang thai cho 297 don con lai
  const statusDistribution = [
    { statusId: -1, count: 18 },
    { statusId: 1, count: 15 },
    { statusId: 2, count: 32 },
    { statusId: 12, count: 26 },
    { statusId: 3, count: 28 },
    { statusId: 4, count: 38 },
    { statusId: 5, count: 48 },
    { statusId: 6, count: 22 },
    { statusId: 7, count: 10 },
    { statusId: 8, count: 10 },
    { statusId: 9, count: 14 },
    { statusId: 10, count: 16 },
    { statusId: 11, count: 6 },
    { statusId: 13, count: 4 },
    { statusId: 20, count: 10 },
    { statusId: 21, count: 10 }
  ]

  let runningSeq = 4

  for (const item of statusDistribution) {
    for (let c = 0; c < item.count; c++) {
      const idx = runningSeq

      const lastName = lastNames[(idx * 7) % lastNames.length]
      const midName = middleNames[(idx * 11) % middleNames.length]
      const firstName = firstNames[(idx * 13) % firstNames.length]
      const customerFullName = `${lastName} ${midName} ${firstName}`

      const telMiddle = String(1000 + (idx * 37) % 9000)
      const telEnd = String(1000 + (idx * 53) % 9000)
      const customerTel = `09${telMiddle.slice(0, 2)}${telEnd}`

      const loc = locationPresets[(idx * 3) % locationPresets.length]
      const houseNum = ((idx * 17) % 350) + 1
      const customerAddress = `So ${houseNum} ${loc.street}`

      const wh = warehouses[idx % warehouses.length]

      const p1 = productsCatalog[(idx * 2) % productsCatalog.length]
      const p2 = productsCatalog[(idx * 5 + 3) % productsCatalog.length]
      const hasTwo = (idx % 3) === 0

      const totalWeight = Number((p1.weight + (hasTwo ? p2.weight : 0)).toFixed(2))
      const isIntra = loc.prov === wh.prov
      const baseFee = isIntra ? 22000 : 32000
      const extraWeightFee = totalWeight > 0.5 ? Math.ceil((totalWeight - 0.5) / 0.5) * 5000 : 0
      const finalFee = baseFee + extraWeightFee

      const value = p1.price + (hasTwo ? p2.price : 0)
      // Mot so don da thanh toan truoc COD = 0
      const pickMoney = (item.statusId === 11 || (idx % 6 === 0)) ? 0 : value

      const partnerId = `SO_MOCK_${String(idx).padStart(4, '0')}`
      const labelId = `S1.A1.${String(100000 + idx)}`

      const orderProducts = [
        { name: p1.name, weight: p1.weight, quantity: 1, product_code: `${p1.code}-${idx}`, price: p1.price }
      ]
      if (hasTwo) {
        orderProducts.push({
          name: p2.name,
          weight: p2.weight,
          quantity: 1,
          product_code: `${p2.code}-${idx}`,
          price: p2.price
        })
      }

      const reasons = statusReasonMap[item.statusId]
      const chosenReason = reasons ? reasons[idx % reasons.length] : ''

      result.push({
        label_id: labelId,
        partner_id: partnerId,
        status_id: item.statusId,
        pick_name: wh.name,
        pick_tel: wh.tel,
        pick_address: wh.addr,
        pick_province: wh.prov,
        pick_district: wh.dist,
        pick_ward: wh.ward,
        deliver_name: customerFullName,
        deliver_tel: customerTel,
        deliver_address: customerAddress,
        deliver_province: loc.prov,
        deliver_district: loc.dist,
        deliver_ward: loc.ward,
        total_weight: totalWeight,
        fee: finalFee,
        insurance_fee: value > 1000000 ? Math.round(value * 0.005) : 0,
        pick_money: pickMoney,
        value: value,
        transport: (idx % 4 === 0) ? 'fly' : 'road',
        note: `Don hang ${partnerId} - ${getStatusText(item.statusId)}`,
        reason: chosenReason,
        products: orderProducts
      })

      runningSeq++
    }
  }

  return result
}

// Nap du lieu khoi tao mau vao database sqlite
export function seedDatabase(force = false): void {
  const countRow = db.prepare('SELECT COUNT(*) as cnt FROM orders').get() as { cnt: number }
  if (countRow.cnt > 0 && !force) {
    return
  }

  if (force) {
    db.exec('DELETE FROM order_products; DELETE FROM orders; DELETE FROM webhook_logs;')
  }

  const sampleOrders = generateLargeDataset(300)

  const insertOrderStmt = db.prepare(`
    INSERT INTO orders (
      label_id, partner_id, status_id, status_text,
      pick_name, pick_tel, pick_address, pick_province, pick_district, pick_ward,
      deliver_name, deliver_tel, deliver_address, deliver_province, deliver_district, deliver_ward,
      total_weight, fee, insurance_fee, pick_money, value, transport, is_freeship,
      note, reason_code, reason, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?
    )
  `)

  const insertProductStmt = db.prepare(`
    INSERT INTO order_products (order_label_id, name, weight, quantity, product_code, price)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const now = new Date()

  // Thuc hien transaction de luu 300 don cuc nhanh trong vai chuc mili-giay
  db.exec('BEGIN TRANSACTION')

  try {
    for (let i = 0; i < sampleOrders.length; i++) {
      const item = sampleOrders[i]
      const createdTime = new Date(now.getTime() - (sampleOrders.length - i) * 600000).toISOString()
      const updatedTime = new Date(now.getTime() - (sampleOrders.length - i) * 300000).toISOString()

      insertOrderStmt.run(
        item.label_id,
        item.partner_id,
        item.status_id,
        getStatusText(item.status_id),
        item.pick_name,
        item.pick_tel,
        item.pick_address,
        item.pick_province,
        item.pick_district,
        item.pick_ward,
        item.deliver_name,
        item.deliver_tel,
        item.deliver_address,
        item.deliver_province,
        item.deliver_district,
        item.deliver_ward,
        item.total_weight,
        item.fee,
        item.insurance_fee,
        item.pick_money,
        item.value,
        item.transport,
        '1',
        item.note,
        '',
        item.reason || '',
        createdTime,
        updatedTime
      )

      for (const prod of item.products) {
        insertProductStmt.run(
          item.label_id,
          prod.name,
          prod.weight,
          prod.quantity,
          prod.product_code,
          prod.price
        )
      }
    }

    // Tao 50 ban ghi nhat ky webhook da dang
    const insertLogStmt = db.prepare(`
      INSERT INTO webhook_logs (
        label_id, partner_id, status_id, target_url,
        request_headers, request_payload, response_status,
        response_body, error_message, duration_ms, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const webhookTargetUrl = 'http://localhost:8069/ohub/webhook/ghtk'
    const logStatuses = [5, 4, 3, 2, 12, 10, 6, 9, 20, 21, -1, 5, 4, 3, 10, 5, 4, 2, 6, 5]

    for (let i = 0; i < 50; i++) {
      const stId = logStatuses[i % logStatuses.length]
      const matchedOrder = sampleOrders.find(o => o.status_id === stId) || sampleOrders[i % sampleOrders.length]
      const logTime = new Date(now.getTime() - (50 - i) * 120000).toISOString()
      const isError = (i % 9 === 0)
      const responseStatus = isError ? 500 : 200
      const responseBody = isError ? 'Internal Server Error: Database locked' : (i % 2 === 0 ? 'OK' : '{"success":true,"message":"Webhook received"}')
      const errorMessage = isError ? 'HTTP 500 Error' : null
      const duration = isError ? 120 : (18 + (i * 7) % 35)

      const payload = {
        partner_id: matchedOrder.partner_id,
        label_id: matchedOrder.label_id,
        status_id: stId,
        action_time: logTime,
        reason_code: '',
        reason: getStatusText(stId),
        weight: matchedOrder.total_weight,
        fee: matchedOrder.fee,
        pick_money: matchedOrder.pick_money,
        return_part_package: 0
      }

      insertLogStmt.run(
        matchedOrder.label_id,
        matchedOrder.partner_id,
        stId,
        webhookTargetUrl,
        JSON.stringify({ 'Content-Type': 'application/json' }),
        JSON.stringify(payload),
        responseStatus,
        responseBody,
        errorMessage,
        duration,
        logTime
      )
    }

    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }

  console.log(`Da nap thanh cong ${sampleOrders.length} don hang va 50 nhat ky webhook vao SQLite`)
}

// Chay truc tiep file script
if (typeof process !== 'undefined' && Array.isArray(process.argv) && process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase(true)
}
