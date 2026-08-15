# CPC1 — Hướng dẫn cấu hình n8n

## Yêu cầu

- n8n instance đang chạy (self-hosted hoặc n8n Cloud)
- App CPC1 đã deploy lên Netlify và có URL thật
- `N8N_WEBHOOK_URL` và `N8N_API_KEY` đã set trong Netlify env vars

---

## Cách n8n tích hợp với CPC1

```
CPC1 App  ──[trigger]──►  n8n Webhook URL/{workflowId}
                                │
                                ▼
                          n8n processes logic
                                │
                          ──[callback]──►  POST {APP_URL}/api/webhook/n8n
                                           Header: X-Webhook-Secret: {N8N_API_KEY}
                                           Body: { action, ...payload }
```

---

## WF01 — Daily Report Reminder

**Trigger:** Cron — 17:00 mỗi ngày làm việc (Mon–Fri)

**Steps trong n8n:**

```
1. HTTP Request GET {APP_URL}/api/employees?status=ACTIVE
   → Danh sách nhân viên active

2. HTTP Request GET {APP_URL}/api/daily-reports?date={today}
   → Danh sách báo cáo đã submit hôm nay

3. Filter: employees KHÔNG có trong danh sách đã submit

4. Loop: với mỗi employee thiếu báo cáo:
   POST {APP_URL}/api/webhook/n8n
   Headers: { X-Webhook-Secret: {N8N_API_KEY} }
   Body: {
     "action": "create_notification",
     "notification": {
       "employeeId": "...",
       "type": "DAILY_REPORT_REMINDER",
       "title": "Nhắc nhở: Nộp báo cáo hôm nay",
       "message": "Bạn chưa nộp báo cáo ngày {today}. Vui lòng hoàn tất trước 18:00."
     }
   }
```

---

## WF02 — Lost Sale Detection

**Trigger:** Scheduled — đầu mỗi tháng (ngày 1, 08:00)

**Steps trong n8n:**

```
1. HTTP Request GET {APP_URL}/api/lost-sale
   → Danh sách customers lost sale (đã tính sẵn trong app)

2. HTTP Request GET {APP_URL}/api/employees?roleCode=TDV
   → Danh sách TDV

3. Match customer → TDV phụ trách (qua employee_customers)

4. Loop: với mỗi cặp (customer, TDV):
   POST {APP_URL}/api/webhook/n8n
   Body: {
     "action": "create_notification",
     "notification": {
       "employeeId": "{tdvId}",
       "type": "LOST_SALE_ALERT",
       "title": "Cảnh báo Lost Sale",
       "message": "Khách hàng {customerName} chưa có doanh số {months} tháng."
     }
   }
```

---

## WF03 — Tender Reminder

**Trigger:** Cron — 08:00 mỗi ngày

**Steps trong n8n:**

```
1. HTTP Request GET {APP_URL}/api/tenders
   → Lọc status != WON/LOST và submissionDate trong 7 ngày tới

2. Loop: với mỗi tender sắp đến deadline:
   POST {APP_URL}/api/webhook/n8n
   Body: {
     "action": "create_notification",
     "notification": {
       "employeeId": "{ownerId}",
       "type": "TENDER_DEADLINE",
       "title": "Thầu sắp đến hạn",
       "message": "Thầu {tenderCode} — {tenderName} đến hạn nộp ngày {submissionDate}.",
       "referenceType": "tender",
       "referenceId": "{tenderId}"
     }
   }
```

---

## WF04 — KPI Calculation

**Trigger:** Cron — 00:00 ngày 1 hàng tháng (tính cho tháng vừa qua)

**Steps trong n8n:**

```
1. HTTP Request GET {APP_URL}/api/kpi/targets?period={lastMonth}

2. HTTP Request GET {APP_URL}/api/sales?from={startOfLastMonth}&to={endOfLastMonth}

3. Aggregate: tính actual revenue theo employee

4. POST {APP_URL}/api/kpi/results
   Body: { employeeId, kpiDefinitionId, periodStart, periodEnd, actualValue }
```

---

## WF05 — Monthly KPI Report

**Trigger:** Cron — 07:00 ngày 2 hàng tháng (sau WF04 chạy xong)

**Steps trong n8n:**

```
1. HTTP Request GET {APP_URL}/api/kpi?from={lastMonthStart}&to={lastMonthEnd}

2. Tổng hợp bảng achievement tất cả TDV

3. Gửi email báo cáo cho MANAGER/ADMIN
   (dùng n8n Email node hoặc SendGrid)
```

---

## WF06 — Google Sheets Import

**Trigger:** Webhook (khi có dữ liệu mới từ Google Sheets via Google Sheets trigger)

**Steps trong n8n:**

```
1. Google Sheets Trigger: theo dõi sheet dữ liệu doanh số

2. Validate: kiểm tra format cột (date, customer_code, product_code, qty, price)

3. Loop: với mỗi row hợp lệ:
   POST {APP_URL}/api/sales
   Headers: { Cookie: session-cookie-của-import-account }
   Body: { transactionDate, customerId, productId, quantity, unitPrice, source: "SHEETS_IMPORT" }

4. POST {APP_URL}/api/webhook/n8n
   Body: {
     "action": "audit_log",
     "auditData": {
       "userId": "{importAccountId}",
       "action": "SHEETS_IMPORT",
       "entityType": "sales_transaction"
     }
   }
```

---

## Thiết lập trong n8n Dashboard

### 1. Set Credentials

```
Settings → Credentials → New Credential

Tên: CPC1 Webhook Auth
Type: Header Auth
Header Name: X-Webhook-Secret
Header Value: {giá trị N8N_API_KEY}
```

### 2. Set Base URL variable

```
Settings → Variables
CPC1_APP_URL = https://your-site.netlify.app
```

### 3. Import workflows

Tạo từng workflow trong n8n và đặt Trigger URL dạng:
```
{N8N_WEBHOOK_URL}/WF01  (Daily Report Reminder)
{N8N_WEBHOOK_URL}/WF02  (Lost Sale Detection)
{N8N_WEBHOOK_URL}/WF03  (Tender Reminder)
{N8N_WEBHOOK_URL}/WF04  (KPI Calculation)
{N8N_WEBHOOK_URL}/WF05  (Monthly KPI Report)
{N8N_WEBHOOK_URL}/WF06  (Google Sheets Import)
```

---

## Test thủ công từ terminal

```bash
# Trigger WF01 thủ công
curl -X POST ${N8N_WEBHOOK_URL}/WF01 \
  -H "X-N8N-Api-Key: ${N8N_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"workflowId":"WF01","triggeredAt":"2026-08-15T08:00:00Z"}'

# Test inbound webhook từ n8n → app
curl -X POST ${NEXT_PUBLIC_APP_URL}/api/webhook/n8n \
  -H "X-Webhook-Secret: ${N8N_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"action":"audit_log","auditData":{"userId":"<admin-uuid>","action":"TEST","entityType":"system"}}'
```
