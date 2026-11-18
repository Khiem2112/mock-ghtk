export function renderDashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GHTK Mock Server - Webhook Testing Console</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f4f6f8; color: #212529; padding: 20px; line-height: 1.5; }
    .container { max-width: 1400px; margin: 0 auto; }
    header { background: #005a32; color: #fff; padding: 18px 24px; border-radius: 8px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
    header h1 { font-size: 20px; font-weight: 600; letter-spacing: 0.5px; }
    header .status-tag { background: #28a745; color: #fff; padding: 4px 12px; border-radius: 4px; font-size: 13px; font-weight: 500; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .card-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #edf2f7; color: #1a202c; display: flex; justify-content: space-between; align-items: center; }
    .form-group { margin-bottom: 14px; }
    .form-group label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #4a5568; }
    .form-control { width: 100%; padding: 8px 12px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 14px; outline: none; }
    .form-control:focus { border-color: #005a32; box-shadow: 0 0 0 2px rgba(0,90,50,0.2); }
    .checkbox-group { display: flex; gap: 20px; align-items: center; margin-top: 8px; }
    .checkbox-label { font-size: 13px; color: #4a5568; cursor: pointer; display: flex; align-items: center; gap: 6px; }
    .btn { display: inline-block; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid transparent; text-align: center; text-decoration: none; }
    .btn-primary { background: #005a32; color: #fff; }
    .btn-primary:hover { background: #004325; }
    .btn-secondary { background: #edf2f7; color: #4a5568; border-color: #cbd5e0; }
    .btn-secondary:hover { background: #e2e8f0; }
    .btn-outline { background: transparent; border-color: #005a32; color: #005a32; }
    .btn-outline:hover { background: #005a32; color: #fff; }
    .btn-danger { background: #e53e3e; color: #fff; }
    .btn-danger:hover { background: #c53030; }
    .btn-sm { padding: 4px 10px; font-size: 12px; }
    .button-group { display: flex; gap: 10px; margin-top: 14px; }
    .table-container { overflow-x: auto; margin-top: 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; }
    th { background: #f7fafc; padding: 10px 12px; border-bottom: 2px solid #e2e8f0; color: #4a5568; font-weight: 600; white-space: nowrap; }
    td { padding: 10px 12px; border-bottom: 1px solid #edf2f7; vertical-align: middle; }
    tr:hover { background: #f8fafc; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .badge-success { background: #def7ec; color: #03543f; }
    .badge-info { background: #e1effe; color: #1e429f; }
    .badge-warning { background: #fef08a; color: #713f12; }
    .badge-danger { background: #fde8e8; color: #9b1c1c; }
    .badge-gray { background: #f3f4f6; color: #374151; }
    .alert { padding: 12px 16px; border-radius: 6px; font-size: 13px; margin-bottom: 14px; display: none; }
    .alert-success { background: #def7ec; color: #03543f; border: 1px solid #bcf0da; }
    .alert-danger { background: #fde8e8; color: #9b1c1c; border: 1px solid #fbd5d5; }
    .code-block { background: #1e293b; color: #e2e8f0; padding: 10px; border-radius: 6px; font-family: monospace; font-size: 12px; max-height: 120px; overflow-y: auto; white-space: pre-wrap; word-break: break-all; }
    .endpoint-pill { display: inline-block; background: #e2e8f0; color: #334155; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 12px; margin-right: 6px; }
    .method-tag { font-weight: bold; color: #005a32; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>GHTK API MOCK SERVER &amp; WEBHOOK CONSOLE</h1>
        <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">
          Mo phong OpenAPI Giao Hang Tiet Kiem voi SQLite va Ban Webhook Real-time
        </div>
      </div>
      <div>
        <span class="status-tag">DANG HOAT DONG</span>
      </div>
    </header>

    <div id="globalAlert" class="alert"></div>

    <div class="grid">
      <!-- Thiet lap cau hinh Webhook -->
      <div class="card">
        <div class="card-title">
          <span>CAU HINH WEBHOOK DICH</span>
          <span style="font-size: 12px; color: #718096; font-weight: normal;">Noi nhan ban tin GHTK</span>
        </div>
        <form id="settingsForm">
          <div class="form-group">
            <label for="webhookUrl">Webhook URL (Ung dung cua ban)</label>
            <input type="text" id="webhookUrl" class="form-control" placeholder="http://localhost:8069/ohub/webhook/ghtk" required>
            <div style="font-size: 11px; color: #718096; margin-top: 4px;">
              Nhap dia chi endpoint webhook trong module ung dung cua ban
            </div>
          </div>
          <div class="form-group">
            <label for="webhookContentType">Dinh dang Content-Type</label>
            <select id="webhookContentType" class="form-control">
              <option value="application/json">application/json (Mac dinh)</option>
              <option value="application/x-www-form-urlencoded">application/x-www-form-urlencoded</option>
            </select>
          </div>
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" id="autoPushCreate"> Tu dong ban khi tao don
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="autoPushCancel"> Tu dong ban khi huy don
            </label>
          </div>
          <div class="button-group">
            <button type="submit" class="btn btn-primary">Luu Cau Hinh</button>
            <button type="button" id="btnPingWebhook" class="btn btn-secondary">Test Ping Webhook</button>
          </div>
        </form>
      </div>

      <!-- Tao don hang thu nghiem nhanh -->
      <div class="card">
        <div class="card-title">
          <span>TAO DON HANG THU NGHIEM</span>
          <span style="font-size: 12px; color: #718096; font-weight: normal;">Thu nghiem nhanh</span>
        </div>
        <form id="createOrderForm">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div class="form-group">
              <label for="partnerIdInput">Ma don shop (partner_id)</label>
              <input type="text" id="partnerIdInput" class="form-control" placeholder="De trong de tu sinh SO_...">
            </div>
            <div class="form-group">
              <label for="deliverNameInput">Nguoi nhan</label>
              <input type="text" id="deliverNameInput" class="form-control" value="Nguyen Van A">
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
            <div class="form-group">
              <label for="pickMoneyInput">Tien COD (VND)</label>
              <input type="number" id="pickMoneyInput" class="form-control" value="150000">
            </div>
            <div class="form-group">
              <label for="weightInput">Trong luong (kg)</label>
              <input type="number" step="0.1" id="weightInput" class="form-control" value="0.5">
            </div>
            <div class="form-group">
              <label for="statusSelectInput">Trang thai ban dau</label>
              <select id="statusSelectInput" class="form-control">
                <option value="2">2 - Da tiep nhan</option>
                <option value="1">1 - Chua tiep nhan</option>
              </select>
            </div>
          </div>
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" id="sendWebhookOnCreate" checked> Ban webhook ngay khi tao
            </label>
          </div>
          <div class="button-group">
            <button type="submit" class="btn btn-primary">Tao Don Hang</button>
            <button type="button" id="btnQuickSample" class="btn btn-outline">Tao Don Mau 1-Click</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Danh sach cac API endpoint duoc mock -->
    <div class="card" style="margin-bottom: 24px;">
      <div class="card-title">
        <span>CAC ENDPOINT MOCK GHTK OPENAPI SAN SANG</span>
        <span style="font-size: 12px; color: #718096; font-weight: normal;">Tro API client cua ban vao day</span>
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 12px; font-size: 13px;">
        <div><span class="endpoint-pill"><span class="method-tag">GET</span> /services/authenticated</span> Kiem tra Token</div>
        <div><span class="endpoint-pill"><span class="method-tag">GET</span> /services/shipment/fee</span> Tinh phi van chuyen</div>
        <div><span class="endpoint-pill"><span class="method-tag">POST</span> /services/shipment/order/?ver=1.5</span> Tao van don Express / B2C</div>
        <div><span class="endpoint-pill"><span class="method-tag">GET</span> /services/shipment/v2/:tracking_order</span> Tra cuu hanh trinh</div>
        <div><span class="endpoint-pill"><span class="method-tag">POST</span> /services/shipment/cancel/:tracking_order</span> Huy van don</div>
        <div><span class="endpoint-pill"><span class="method-tag">GET</span> /open/api/v1/shop/solution/list</span> Goi giai phap GAM</div>
        <div><span class="endpoint-pill"><span class="method-tag">GET</span> /services/label/:tracking_order</span> In nhan van don (PDF)</div>
        <div><span class="endpoint-pill"><span class="method-tag">GET</span> /services/shipment/list_pick_add</span> Danh sach kho lay hang</div>
        <div><span class="endpoint-pill"><span class="method-tag">GET</span> /services/address/getAddressLevel4</span> Dia chi cap 4</div>
        <div><span class="endpoint-pill"><span class="method-tag">GET</span> /services/kho-hang/thong-tin-san-pham</span> Thong tin san pham</div>
        <div><span class="endpoint-pill"><span class="method-tag">POST</span> /services/shops/add</span> Tao shop con B2C</div>
        <div><span class="endpoint-pill"><span class="method-tag">POST</span> /services/shops/token</span> Lay token shop B2C</div>
      </div>
    </div>

    <!-- Danh sach don hang -->
    <div class="card" style="margin-bottom: 24px;">
      <div class="card-title">
        <span>DANH SACH DON HANG HIEN CO</span>
        <div style="display: flex; gap: 10px;">
          <input type="text" id="searchOrderInput" class="form-control" placeholder="Tim ma don, ten, sdt..." style="width: 240px; padding: 4px 8px; font-size: 12px;">
          <button id="btnResetSeed" class="btn btn-outline btn-sm">Nap Lai Seed Data</button>
          <button id="btnRefreshOrders" class="btn btn-secondary btn-sm">Lam Moi</button>
        </div>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Ma Shop (partner_id)</th>
              <th>Ma Van Don (label_id)</th>
              <th>Nguoi Nhan</th>
              <th>Tien COD</th>
              <th>Phi Ship</th>
              <th>Trang Thai Hien Tai</th>
              <th>Thao Tac Cap Nhat &amp; Ban Webhook</th>
            </tr>
          </thead>
          <tbody id="ordersTableBody">
            <tr><td colspan="7" style="text-align: center; color: #718096;">Dang tai du lieu don hang...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Nhat ky Webhook Activity -->
    <div class="card">
      <div class="card-title">
        <span>NHAT KY BAN WEBHOOK (WEBHOOK ACTIVITY LOGS)</span>
        <div style="display: flex; gap: 10px;">
          <button id="btnClearLogs" class="btn btn-danger btn-sm">Xoa Nhat Ky</button>
          <button id="btnRefreshLogs" class="btn btn-secondary btn-sm">Lam Moi</button>
        </div>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Thoi Gian</th>
              <th>Ma Van Don</th>
              <th>Trang Thai Don</th>
              <th>Dich Den (Target URL)</th>
              <th>Phan Hoi HTTP</th>
              <th>Thoi Gian Xu Ly</th>
              <th>Du Lieu Gui (Payload)</th>
              <th>Phan Hoi Nhan Duoc</th>
              <th>Thao Tac</th>
            </tr>
          </thead>
          <tbody id="logsTableBody">
            <tr><td colspan="9" style="text-align: center; color: #718096;">Dang tai nhat ky...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <script>
    let statusList = [];

    function showAlert(msg, type = 'success') {
      const el = document.getElementById('globalAlert');
      el.className = 'alert ' + (type === 'success' ? 'alert-success' : 'alert-danger');
      el.textContent = msg;
      el.style.display = 'block';
      setTimeout(() => { el.style.display = 'none'; }, 6000);
    }

    async function loadStatuses() {
      try {
        const res = await fetch('/api/statuses');
        const json = await res.json();
        if (json.success) {
          statusList = json.data;
        }
      } catch (e) {
        console.error('Loi tai danh muc trang thai:', e);
      }
    }

    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        const json = await res.json();
        if (json.success) {
          document.getElementById('webhookUrl').value = json.data.webhook_url || '';
          document.getElementById('webhookContentType').value = json.data.webhook_content_type || 'application/json';
          document.getElementById('autoPushCreate').checked = json.data.auto_push_on_create === '1';
          document.getElementById('autoPushCancel').checked = json.data.auto_push_on_cancel === '1';
        }
      } catch (e) {
        console.error('Loi tai cau hinh:', e);
      }
    }

    document.getElementById('settingsForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const payload = {
          webhook_url: document.getElementById('webhookUrl').value.trim(),
          webhook_content_type: document.getElementById('webhookContentType').value,
          auto_push_on_create: document.getElementById('autoPushCreate').checked,
          auto_push_on_cancel: document.getElementById('autoPushCancel').checked
        };
        const res = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
          showAlert('Da luu cau hinh Webhook thanh cong');
        } else {
          showAlert(json.message || 'Luu cau hinh that bai', 'danger');
        }
      } catch (err) {
        showAlert('Loi ket noi khi luu cau hinh', 'danger');
      }
    });

    document.getElementById('btnPingWebhook').addEventListener('click', async () => {
      const targetUrl = document.getElementById('webhookUrl').value.trim();
      if (!targetUrl) {
        showAlert('Vui long nhap Webhook URL truoc khi ping', 'danger');
        return;
      }
      try {
        const res = await fetch('/api/webhook/test-ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ webhook_url: targetUrl })
        });
        const json = await res.json();
        if (json.success) {
          showAlert(json.message, 'success');
        } else {
          showAlert(json.message, 'danger');
        }
        loadLogs();
      } catch (err) {
        showAlert('Khong the gui yeu cau test ping', 'danger');
      }
    });

    async function loadOrders() {
      const q = document.getElementById('searchOrderInput').value.trim();
      try {
        const res = await fetch('/api/orders?q=' + encodeURIComponent(q));
        const json = await res.json();
        const tbody = document.getElementById('ordersTableBody');
        if (!json.success || !json.data || json.data.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #718096;">Chua co don hang nao</td></tr>';
          return;
        }

        tbody.innerHTML = json.data.map(order => {
          let statusBadgeClass = 'badge-info';
          if (order.status_id === 5 || order.status_id === 6) statusBadgeClass = 'badge-success';
          else if (order.status_id === -1) statusBadgeClass = 'badge-danger';
          else if ([7, 8, 9, 10, 20].includes(order.status_id)) statusBadgeClass = 'badge-warning';

          const optionsHtml = statusList.map(st => {
            const selected = st.id === order.status_id ? 'selected' : '';
            return '<option value="' + st.id + '" ' + selected + '>' + st.id + ' - ' + st.text + '</option>';
          }).join('');

          return '<tr>' +
            '<td><strong>' + order.partner_id + '</strong></td>' +
            '<td><code>' + order.label_id + '</code></td>' +
            '<td>' + (order.deliver_name || '-') + '<br><small style="color:#718096;">' + (order.deliver_tel || '') + '</small></td>' +
            '<td>' + Number(order.pick_money).toLocaleString('vi-VN') + ' VND</td>' +
            '<td>' + Number(order.fee).toLocaleString('vi-VN') + ' VND</td>' +
            '<td><span class="badge ' + statusBadgeClass + '">' + order.status_id + ': ' + order.status_text + '</span></td>' +
            '<td>' +
              '<div style="display: flex; gap: 6px; align-items: center;">' +
                '<select class="form-control" style="width: auto; padding: 3px 6px; font-size: 12px;" id="sel_' + order.label_id + '">' +
                  optionsHtml +
                '</select>' +
                '<button class="btn btn-primary btn-sm" onclick="updateOrderStatus(\\'' + order.label_id + '\\')">Cap Nhat &amp; Ban</button>' +
                '<a class="btn btn-secondary btn-sm" href="/services/label/' + order.label_id + '" target="_blank">In Nhan</a>' +
              '</div>' +
            '</td>' +
          '</tr>';
        }).join('');
      } catch (err) {
        console.error('Loi tai danh sach don hang:', err);
      }
    }

    async function updateOrderStatus(labelId) {
      const sel = document.getElementById('sel_' + labelId);
      const nextStatusId = Number(sel.value);
      try {
        const res = await fetch('/api/orders/' + encodeURIComponent(labelId) + '/update-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status_id: nextStatusId,
            send_webhook: true
          })
        });
        const json = await res.json();
        if (json.success) {
          const wb = json.webhook;
          if (wb && wb.success) {
            showAlert('Da cap nhat don hang va ban webhook thanh cong (HTTP ' + wb.status + ' trong ' + wb.durationMs + 'ms)');
          } else if (wb && !wb.success) {
            showAlert('Da cap nhat don nhung ban webhook that bai: ' + (wb.errorMessage || 'HTTP ' + wb.status), 'danger');
          } else {
            showAlert(json.message);
          }
          loadOrders();
          loadLogs();
        } else {
          showAlert(json.message || 'Cap nhat that bai', 'danger');
        }
      } catch (err) {
        showAlert('Loi ket noi khi cap nhat trang thai', 'danger');
      }
    }

    async function loadLogs() {
      try {
        const res = await fetch('/api/webhook-logs');
        const json = await res.json();
        const tbody = document.getElementById('logsTableBody');
        if (!json.success || !json.data || json.data.length === 0) {
          tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: #718096;">Chua co nhat ky ban webhook nao</td></tr>';
          return;
        }

        tbody.innerHTML = json.data.map(log => {
          let httpBadge = 'badge-danger';
          if (log.response_status >= 200 && log.response_status < 300) {
            httpBadge = 'badge-success';
          } else if (log.response_status >= 400 && log.response_status < 500) {
            httpBadge = 'badge-warning';
          }

          const statusDisplay = log.response_status ? 'HTTP ' + log.response_status : (log.error_message || 'THAT BAI');
          const dateStr = new Date(log.created_at).toLocaleTimeString('vi-VN');

          return '<tr>' +
            '<td style="white-space: nowrap;">' + dateStr + '</td>' +
            '<td><code>' + (log.label_id || '-') + '</code><br><small>' + (log.partner_id || '') + '</small></td>' +
            '<td><span class="badge badge-gray">' + (log.status_id ?? '-') + '</span></td>' +
            '<td style="max-width: 180px; word-break: break-all;"><small>' + log.target_url + '</small></td>' +
            '<td><span class="badge ' + httpBadge + '">' + statusDisplay + '</span></td>' +
            '<td>' + log.duration_ms + 'ms</td>' +
            '<td><div class="code-block">' + escapeHtml(log.request_payload) + '</div></td>' +
            '<td><div class="code-block">' + escapeHtml(log.response_body || log.error_message || '') + '</div></td>' +
            '<td><button class="btn btn-secondary btn-sm" onclick="retryWebhook(' + log.id + ')">Gui Lai</button></td>' +
          '</tr>';
        }).join('');
      } catch (err) {
        console.error('Loi tai nhat ky webhook:', err);
      }
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    async function retryWebhook(logId) {
      try {
        const res = await fetch('/api/webhook-logs/' + logId + '/retry', { method: 'POST' });
        const json = await res.json();
        if (json.success) {
          showAlert(json.message);
        } else {
          showAlert(json.message, 'danger');
        }
        loadLogs();
      } catch (err) {
        showAlert('Khong the gui lai webhook', 'danger');
      }
    }

    document.getElementById('btnClearLogs').addEventListener('click', async () => {
      if (!confirm('Ban co chac muon xoa sach nhat ky webhook?')) return;
      try {
        await fetch('/api/webhook-logs', { method: 'DELETE' });
        showAlert('Da xoa sach nhat ky');
        loadLogs();
      } catch (err) {
        showAlert('Khong the xoa nhat ky', 'danger');
      }
    });

    document.getElementById('createOrderForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const payload = {
          partner_id: document.getElementById('partnerIdInput').value.trim(),
          deliver_name: document.getElementById('deliverNameInput').value.trim(),
          pick_money: Number(document.getElementById('pickMoneyInput').value),
          total_weight: Number(document.getElementById('weightInput').value),
          status_id: Number(document.getElementById('statusSelectInput').value),
          send_webhook: document.getElementById('sendWebhookOnCreate').checked
        };
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
          showAlert('Tao don hang thanh cong: ' + json.data.label_id);
          document.getElementById('partnerIdInput').value = '';
          loadOrders();
          loadLogs();
        } else {
          showAlert(json.message || 'Tao don that bai', 'danger');
        }
      } catch (err) {
        showAlert('Loi ket noi khi tao don hang', 'danger');
      }
    });

    document.getElementById('btnQuickSample').addEventListener('click', async () => {
      try {
        const partnerId = 'SO_' + Date.now().toString().slice(-6);
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            partner_id: partnerId,
            deliver_name: 'Khach Hang Mua Sam',
            pick_money: 200000,
            total_weight: 0.5,
            status_id: 2,
            send_webhook: true
          })
        });
        const json = await res.json();
        if (json.success) {
          showAlert('Da tao don hang mau: ' + json.data.partner_id + ' (' + json.data.label_id + ')');
          loadOrders();
          loadLogs();
        } else {
          showAlert(json.message || 'Tao don mau that bai', 'danger');
        }
      } catch (err) {
        showAlert('Loi ket noi khi tao don mau', 'danger');
      }
    });

    document.getElementById('btnResetSeed').addEventListener('click', async () => {
      if (!confirm('Ban co muon nap lai toan bo du lieu mau (seed data)?')) return;
      try {
        const res = await fetch('/api/seed', { method: 'POST' });
        const json = await res.json();
        if (json.success) {
          showAlert(json.message);
          loadOrders();
          loadLogs();
        } else {
          showAlert(json.message, 'danger');
        }
      } catch (err) {
        showAlert('Khong the nap seed data', 'danger');
      }
    });

    document.getElementById('btnRefreshOrders').addEventListener('click', loadOrders);
    document.getElementById('btnRefreshLogs').addEventListener('click', loadLogs);
    document.getElementById('searchOrderInput').addEventListener('input', () => {
      clearTimeout(window._searchTimer);
      window._searchTimer = setTimeout(loadOrders, 300);
    });

    // Khoi tao giao dien khi tai trang
    (async function init() {
      await loadStatuses();
      await loadSettings();
      await loadOrders();
      await loadLogs();

      // Tu dong cap nhat dinh ky moi 4 giay
      setInterval(() => {
        loadLogs();
        loadOrders();
      }, 4000);
    })();
  </script>
</body>
</html>`;
}
