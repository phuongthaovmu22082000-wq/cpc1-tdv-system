# Tiến độ triển khai — CPC1

Theo dõi theo `CPC1_AI_Agent_Build_Specification.md` Section 29 (Task Breakdown).

| Task | Tên                | Trạng thái |
| ---- | ------------------ | ---------- |
| 001  | Initialize Project | ✅ Done    |
| 002  | Database           | ✅ Done    |
| 003  | Authentication     | ⬜ Pending |
| 004  | RBAC               | ⬜ Pending |
| 005  | Territory Scope    | ⬜ Pending |
| 006  | Employee           | ⬜ Pending |
| 007  | Customer           | ⬜ Pending |
| 008  | Product            | ⬜ Pending |
| 009  | Sales              | ⬜ Pending |
| 010  | Prescription       | ⬜ Pending |
| 011  | Tender             | ⬜ Pending |
| 012  | Daily Report       | ⬜ Pending |
| 013  | KPI                | ⬜ Pending |
| 014  | Dashboard          | ⬜ Pending |
| 015  | Lost Sale          | ⬜ Pending |
| 016  | Notifications      | ⬜ Pending |
| 017  | n8n                | ⬜ Pending |
| 018  | Audit              | ⬜ Pending |
| 019  | Security Test      | ⬜ Pending |
| 020  | Production         | ⬜ Pending |

---

## TASK 001 — Initialize Project — Báo cáo

**Status:** ✅ Completed

**Implemented:**

- Khởi tạo Next.js 16 (App Router) + React 19 + TypeScript.
- ESLint (eslint-config-next) + Prettier, đã tích hợp `eslint-config-prettier`
  để tránh xung đột rule.
- Tailwind CSS v4 cho styling.
- Environment handling: `src/lib/utils/env.ts` validate biến môi trường bằng
  Zod, fail-fast nếu thiếu cấu hình bắt buộc. `.env.example` liệt kê đầy đủ
  biến theo Spec Section 27.2.
- Basic layout: `AppShell` (Sidebar + Topbar) tại `src/components/layout/`,
  áp dụng cho trang `/dashboard`. Trang chủ `/` là landing tĩnh.
- Cấu trúc thư mục đầy đủ theo Spec Section 5 (app routes cho từng module,
  components/ui|forms|tables|charts|layout, lib/auth|authorization|db|
  validation|services|utils, db/schema, db/migrations, tests/unit|
  integration|e2e, docs).
- Git repository đã init với `.gitignore` mặc định của Next.js (đã che
  `.env*`).

**Files changed:**

- `package.json`, `eslint.config.mjs`, `.prettierrc.json`, `.prettierignore`
- `.env.example`
- `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/dashboard/page.tsx`
- `src/components/layout/{app-shell,sidebar,topbar}.tsx`
- `src/lib/utils/env.ts`
- Thư mục rỗng cho các module còn lại (giữ bằng `.gitkeep`)

**Database changes:**

- Không có (thuộc phạm vi TASK 002).

**Tests:**

- Chưa có test runner được thiết lập ở task này (nằm ngoài phạm vi TASK 001).
  Thư mục `tests/unit|integration|e2e` đã tạo sẵn cho các task sau.

**Build:**

- PASS — `npm run lint`, `npm run typecheck`, `npm run format:check`,
  `npm run build` đều thành công.

**Security checks:**

- Không có business logic/authorization ở task này. Đã xác nhận `.env*`
  không được Git track. Sidebar là navigation tĩnh, không phải authorization
  thật — sẽ được gate bằng Role/Permission ở TASK 004.

**Known issues:**

- Đã thay `next/font/google` (mặc định của `create-next-app`) bằng font hệ
  thống (`font-sans` của Tailwind) để tránh phụ thuộc mạng ngoài khi build
  trong môi trường bị giới hạn network. Có thể khôi phục Google Fonts sau
  nếu môi trường deploy thực tế (Netlify) cho phép fetch không giới hạn —
  đây là quyết định kỹ thuật nhỏ, không ảnh hưởng business rule.

**Next task:**

- TASK 002 — Database (PostgreSQL connection, ORM, migration system, schema,
  seed).

---

## TASK 002 — Database — Báo cáo

**Status:** ✅ Completed

**Implemented:**

- PostgreSQL connection qua Drizzle ORM (`drizzle-orm/postgres-js`), client
  singleton tại `src/lib/db/client.ts` (tái sử dụng connection giữa hot
  reload / serverless invocation, giới hạn pool size khác nhau giữa
  production và dev).
- Schema đầy đủ **22 bảng** theo đúng Spec Section 6–8, chia theo 7 nhóm
  entity trong `db/schema/`: `authorization.ts` (roles, permissions,
  role_permissions), `organization.ts` (territories, employees,
  employee_territories), `customer.ts` (customer_types, customers,
  employee_customers), `product.ts` (product_groups, products),
  `transactions.ts` (sales_transactions, prescription_reports,
  prescription_items, tenders, tender_status_history), `reporting.ts`
  (kpi_definitions, kpi_targets, kpi_results, daily_reports), `system.ts`
  (notifications, audit_logs) + `relations.ts` cho Drizzle relational
  queries (`db.query.*.findMany({ with: ... })`).
- Áp dụng đầy đủ DB Rules (Spec Section 9): UUID PK (`defaultRandom()` dùng
  `pgcrypto`), FK cho mọi quan hệ, unique constraint cho business code
  (role.code, permission.code, territory.code, employee_code, email,
  customer_code, product_code, tender_code, kpi_definition.code,
  customer_type.code, và unique business key
  `(employee_id, report_date)` cho daily_reports), index cho các truy vấn
  transaction nóng nhất (theo customer/employee/territory/date — đặc biệt
  `sales_transactions_customer_date_idx` phục vụ Lost Sale engine TASK 015,
  và `employee_territories_active_scope_idx` /
  `employee_customers_active_scope_idx` phục vụ scope resolver TASK 005),
  numeric cho tiền/quantity, timestamp nhất quán (`withTimezone: true`,
  `defaultNow()`).
- Migration system: `drizzle-kit` với config tại `drizzle.config.ts`, script
  `db:generate` / `db:migrate` / `db:push` / `db:studio` trong
  `package.json`. Migration file `db/migrations/0000_init_schema.sql` +
  `meta/` (journal, snapshot) đã được generate và commit — production sẽ
  chạy `db:migrate`, không sửa schema thủ công (đúng Spec Section 27.4 và
  9.10).
- Seed script `db/seed.ts` (chạy qua `npm run db:seed`, dùng `tsx`):
  - roles: TDV, SUPERVISOR, MANAGER, ADMIN (Spec 8.1)
  - permissions: đủ 30 permission tối thiểu (Spec 8.2)
  - role_permissions: mapping mặc định theo Access Matrix (Build Plan
    Section 3.3) — TDV 13 quyền, SUPERVISOR 21, MANAGER 29, ADMIN 30 (full)
  - customer_types: HOSPITAL, HEALTH_DEPARTMENT, PRIVATE_CLINIC (Spec 8.6)
  - territories: DN, QNA, QNG, BD, GL (Spec Section 2.2)
  - Idempotent (`onConflictDoNothing`) — đã test chạy lại 2 lần, không phát
    sinh dữ liệu trùng.
- Đã cài PostgreSQL 16 thật trong môi trường build (không chỉ mock), tạo
  database `cpc1` + user riêng cho việc thực thi và verify migration.

**Files changed:**

- `db/schema/{authorization,organization,customer,product,transactions,reporting,system,relations,index}.ts`
- `db/seed.ts`, `db/migrations/0000_init_schema.sql`, `db/migrations/meta/*`
- `drizzle.config.ts`
- `src/lib/db/client.ts`
- `package.json` (script `db:generate|migrate|push|studio|seed`)
- `.env.example` (đã có sẵn từ TASK 001)
- `docs/PROGRESS.md`

**Database changes:**

- Tạo mới 22 bảng: roles, permissions, role_permissions, territories,
  employees, employee_territories, customer_types, customers,
  employee_customers, product_groups, products, sales_transactions,
  prescription_reports, prescription_items, tenders,
  tender_status_history, kpi_definitions, kpi_targets, kpi_results,
  daily_reports, notifications, audit_logs.
- Seed dữ liệu configuration (roles/permissions/customer_types/territories)
  — không phải business data thật (Spec Section 1.5 vẫn được tuân thủ:
  employee/customer/product thật KHÔNG được hard-code, sẽ nhập qua UI/import
  ở các task sau).

**Tests:**

- Migration reproducibility: drop database → `db:migrate` → `db:seed` từ
  đầu → thành công, không lỗi.
- Idempotency: chạy `db:seed` 2 lần liên tiếp → số lượng bản ghi không đổi.
- Schema-migration drift check: `drizzle-kit generate` sau khi migration đã
  áp dụng → "No schema changes, nothing to migrate" (schema code và DB thật
  khớp nhau tuyệt đối).
- Relational query smoke test: `db.query.roles.findMany({ with: { rolePermissions: { with: { permission: true } } } })`
  chạy đúng qua Drizzle relations (không chỉ raw SQL) — xác nhận
  `relations.ts` hoạt động.
- Unit/integration test tự động hoá (trong `tests/`) sẽ được viết dần theo
  từng module ở các TASK sau, khi đã có API để test — TASK 002 chỉ có
  schema/migration nên chưa có unit test riêng, đây là hạn chế đã ghi nhận.

**Build:**

- PASS — `npm run lint`, `npm run typecheck`, `npm run format:check`,
  `npm run build` đều thành công, kể cả khi không có `DATABASE_URL` (build
  không phụ thuộc kết nối DB thật vì chưa route nào import
  `src/lib/db/client.ts`).

**Security checks:**

- `DATABASE_URL` không hard-code, đọc từ `.env.local` (dev, bị git-ignore)
  hoặc biến môi trường Netlify (production).
- audit_logs: không tạo API xoá (DB Rule #7) — chỉ INSERT, FK `user_id`
  dùng `onDelete: 'restrict'` để không mất audit trail.
- tender_status_history: chỉ INSERT, dùng làm append-only log cho mọi thay
  đổi status (Spec Section 12.4).
- Ownership fields (employee_id, territory_id, customer_id ở
  sales_transactions/prescription_reports/tenders) đã có ở schema nhưng
  **chưa** có enforcement — việc backend tự gán các giá trị này từ session
  (không cho client override, Spec Section 12.2) sẽ triển khai ở
  TASK 009/010/011 khi xây service layer. Ghi chú rõ trong code comment để
  tránh Agent sau này quên.

**Known issues:**

- npm audit báo 4 moderate vulnerability trong `esbuild` (qua
  `@esbuild-kit` — dependency của `drizzle-kit`). Đây là lỗ hổng chỉ ảnh
  hưởng dev server cục bộ của esbuild (không phải runtime production), và
  bản vá đòi hỏi downgrade `drizzle-kit` xuống bản cũ hơn (breaking change)
  — quyết định giữ nguyên, theo dõi thêm ở các release sau của
  `drizzle-kit`.
- Package `dotenv` (dùng trong `db/seed.ts` và `drizzle.config.ts` gián
  tiếp) in ra dòng "tip" quảng cáo kèm URL bên thứ ba
  (`vestauth.com`, `dotenvx.com`) mỗi lần chạy — đây là tính năng có sẵn
  trong chính package `dotenv` v17 (không phải injection từ bên ngoài), chỉ
  là log ra console, không ảnh hưởng chức năng. Ghi nhận để Product Owner
  biết, không cần hành động.
- Chưa có test runner (Vitest/Jest) được cài đặt — nằm ngoài phạm vi
  TASK 002 theo Task Breakdown, sẽ cân nhắc thêm khi bắt đầu viết unit test
  thực sự (TASK 003 trở đi).

**Next task:**

- TASK 003 — Authentication (Login, Session, Current user).
