# GHTK OpenAPI Mock Server

Server mock API cua Giao Hang Tiet Kiem (GHTK) xay dung tren Hono framework va SQLite database, bam sat 100% dac ta Bruno collection tai `testing/ghtk`.

Tich hop giao dien Web UI truc quan de quan ly don hang va thu nghiem ban Webhook sang ung dung.

## 1. Danh Muc Endpoint Bam Sat 100% Theo testing/ghtk

### Nhom 01 - Authentication
- `GET /services/authenticated` va `POST /services/authenticated`: Kiem tra ket noi va xac thuc Token + X-Client-Source. Tra ve 200 kem `log_id` hoac 401 loi `20101` ("Can cung cap token hop le").

### Nhom 02 - Orders & Shipments
- `GET /services/shipment/fee`: Tinh phi van chuyen. `weight` tinh bang Gram. Kiem tra bat buoc `province` (tra ve 422 neu thieu). Ho tro phu phi `tags[]`.
- `POST /services/shipment/order/?ver=1.5` (va `/services/shipment/order`): Dang don hang Express / B2C. Kiem tra ma trung `ORDER_ID_EXIST`, thieu thong tin 422 `30101`. Tra ve `order.label`, `order.fee`, `order.tracking_id`.
- `GET /services/shipment/v2/:tracking_order`: Tra cuu hanh trinh van don. Tra ve dung doi tuong `order` (label_id, partner_id, status, status_text, customer_fullname, storage_day, ship_money, insurance...). Ho tro tim theo ma van don hoac `partner_id:a4`. Loi tra ve 400 `50109`.
- `POST /services/shipment/cancel/:tracking_order` (va GET): Huy don hang. Tra ve 200 `log_id` khi thanh cong, 200 loi `50101` neu don da huy truoc do, 200 loi `50102` neu don da lay hang, 400 loi `50109` neu khong tim thay.
- `GET /open/api/v1/shop/solution/list`: Lay danh sach goi giai phap GAM (`solution_id`, `group_name`).
- `GET /services/label/:tracking_order`: In nhan don hang tra ve binary PDF attachment `Content-Type: application/pdf` hoac xem truc tiep HTML tren trinh duyet.

### Nhom 03 - Address & Products
- `GET /services/shipment/list_pick_add`: Danh sach kho lay hang cua shop (`pick_address_id: "88256"`).
- `GET /services/address/getAddressLevel4`: Danh sach dia chi cap 4 (thon, ap, ngo, toa nha).
- `GET /services/kho-hang/thong-tin-san-pham`: Tra cuu san pham va `product_code` theo tu khoa `term`.

### Nhom 04 - B2C Partner
- `POST /services/shops/add`: Tao tai khoan shop con B2C, tra ve `code` va `token`.
- `POST /services/shops/token`: Lay ma shop va token cua shop B2C da dang ky.

### Nhom 05 - Webhooks Push
- Ban webhook cap nhat trang thai don hang ve callback URL (`http://localhost:8069/ohub/webhook/ghtk`):
  - Dinh dang JSON: `application/json`
  - Dinh dang Form URL Encoded: `application/x-www-form-urlencoded`
  - Payload chuan gom: `partner_id`, `label_id`, `status_id`, `action_time`, `reason_code`, `reason`, `weight`, `fee`, `pick_money`, `return_part_package`.

## 2. Cach Cai Dat Va Khoi Dong

### Khoi dong server:
```bash
cd mock/ghtk-mock
npm start
```
Hoac nhap dup vao file [start_ghtk_mock.bat](file:///c:/University/Study/Programming/reference/odoo-all/exercise-odoo-18/start_ghtk_mock.bat).

Mac dinh server lang nghe tai:
- Base URL & Web UI: `http://localhost:4001/` (Dong bo voi bien `baseUrl` trong `testing/ghtk/environments/Mock Local.bru`)

### Chay kiem thu tu dong (13/13 ca test pass 100%):
```bash
npm test
```

### Nap lai du lieu mau (Seed Data):
```bash
npm run seed
```
Du lieu mau duoc dong bo 100% voi cac ma bien trong Bruno:
- `S1.A1.17373471` (partner_id: `a4`)
- `S1.A1.2001297581` (partner_id: `123123a`)
- `S1.A1.1737345` (partner_id: `1234567`)

## 3. Trien Khai Len Vercel
- File cau hinh: `vercel.json`
- Entrypoint Serverless: `api/index.ts`
- Ho tro tu dong luu SQLite vao `/tmp` khi chay tren Vercel Serverless.
