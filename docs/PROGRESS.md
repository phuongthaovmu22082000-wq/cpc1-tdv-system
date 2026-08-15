# Tiến độ triển khai — CPC1

Theo dõi theo `CPC1_AI_Agent_Build_Specification.md` Section 29 (Task Breakdown).

| Task | Tên                | Trạng thái |
| ---- | ------------------ | ---------- |
| 001  | Initialize Project | ✅ Done    |
| 002  | Database           | ✅ Done    |
| 003  | Authentication     | ✅ Done    |
| 004  | RBAC               | ✅ Done    |
| 005  | Territory Scope    | ✅ Done    |
| 006  | Employee           | ✅ Done    |
| 007  | Customer           | ✅ Done    |
| 008  | Product            | ✅ Done    |
| 009  | Sales              | ✅ Done    |
| 010  | Prescription       | ✅ Done    |
| 011  | Tender             | ✅ Done    |
| 012  | Daily Report       | ✅ Done    |
| 013  | KPI                | ✅ Done    |
| 014  | Dashboard          | ⬜ Pending |
| 015  | Lost Sale          | ✅ Done    |
| 016  | Notifications      | ✅ Done    |
| 017  | n8n                | ⬜ Pending |
| 018  | Audit              | ✅ Done    |
| 019  | Security Test      | ✅ Done    |
| 020  | Production         | ✅ Done    |

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

---

## TASK 003 — Authentication — Báo cáo

**Status:** ✅ Completed

**Implemented:**

- 2 bảng kỹ thuật bổ sung (ngoài 22 domain entities từ TASK 002):
  `credentials` (bcrypt password hash, 1-1 với employees, PK = FK) và
  `sessions` (SHA-256 hash của token, expires_at, revoked_at, ip, user_agent).
- Migration `0001_add_auth_tables.sql` đã apply — DB hiện có 24 bảng.
- `src/lib/auth/password.ts`: hash/verify bằng bcryptjs (pure JS, SALT=12,
  tương thích Netlify serverless không cần native binary).
- `src/lib/auth/session.ts`: tạo session (raw token 32-byte hex chỉ trả về
  một lần, DB lưu SHA-256 hash), verify (check hash + expires_at + revoked_at),
  thu hồi theo token và thu hồi tất cả session của một employee.
- `src/lib/auth/current-user.ts`: `getCurrentEmployee()` (đọc cookie → verify
  session → resolve employee+role từ DB, trả null nếu không hợp lệ) và
  `requireAuth()` (redirect /login nếu null — bước 1 trong Authorization Order
  Spec Section 11.1).
- `src/lib/validation/auth.ts`: Zod schema validate email/password.
- `src/lib/services/auth-service.ts`: business logic login (generic error
  message cho mọi thất bại để chống dò email hợp lệ, check inactive AFTER
  password verify để chống timing oracle) và logout.
- `src/app/login/actions.ts`: Server Actions `loginAction`/`logoutAction`,
  set cookie httpOnly/secure/sameSite=lax, call service, redirect.
- `src/components/forms/login-form.tsx`: form UI (email, password, error,
  loading state — đúng Spec Section 14.1), dùng `useActionState` +
  `useFormStatus`.
- `src/app/login/page.tsx`: trang login, redirect /dashboard nếu đã đăng nhập.
- `/dashboard` bảo vệ bằng `requireAuth()` — unauthenticated → 307 redirect.
- `db/seed-admin.ts` + script `db:seed:admin`: bootstrap tài khoản ADMIN đầu
  tiên từ env vars (ADMIN_EMPLOYEE_CODE, ADMIN_FULL_NAME, ADMIN_EMAIL,
  ADMIN_PASSWORD), idempotent, không hard-code business data.

**Files changed:**

- `db/schema/auth.ts`, `db/schema/index.ts`, `db/schema/relations.ts`
- `db/migrations/0001_add_auth_tables.sql` + `meta/`
- `db/seed-admin.ts`
- `src/lib/auth/{password,session,current-user}.ts`
- `src/lib/validation/auth.ts`
- `src/lib/services/auth-service.ts`
- `src/app/login/{actions,page}.tsx`
- `src/components/forms/login-form.tsx`
- `src/components/layout/{topbar,app-shell}.tsx` (thêm currentEmployee prop)
- `src/app/dashboard/page.tsx` (thêm requireAuth)
- `src/app/page.tsx` (thêm link /login)
- `.env.example`, `package.json`

**Database changes:**

- Tạo mới 2 bảng: `credentials`, `sessions`.

**Tests:**

- AUTH-001 (valid account → login success): PASS
- AUTH-002 (invalid password → rejected): PASS
- Non-existent email → rejected với cùng error message như sai password: PASS
- Session resolve đúng employee (admin@cpc1.local → roleCode: ADMIN): PASS
- Logout → session bị revoke (findValidSession trả null): PASS
- HTTP smoke test: `GET /dashboard` (no cookie) → 307 redirect /login: PASS
- `GET /login` → 200: PASS, `GET /` → 200: PASS
- `npm run build` → PASS (route /dashboard và /login đều Dynamic ƒ — đúng)

**Build:** PASS — lint, typecheck, format:check, build đều sạch.

**Security checks:**

- Token không bao giờ lưu trong DB — chỉ SHA-256 hash (Spec Section 19).
- Generic error message cho mọi thất bại login (không lộ email hợp lệ).
- Cookie: httpOnly, secure (production), sameSite=lax.
- Session revoke thật sự (DB-based), không phải stateless JWT — logout thật
  sự vô hiệu hoá session, không thể tái sử dụng token cũ.
- inactive employee bị từ chối kể cả khi session còn hạn.
- bootstrap admin dùng env var, không hard-code (Spec 1.5).

**Known issues:**

- Chưa có rate limiting cho endpoint login (chống brute force) — nằm ngoài
  phạm vi TASK 003, cần bổ sung ở TASK 019 (Security Test) hoặc tầng CDN
  (Netlify Edge Rules).
- Không log thất bại login ra audit_logs ở TASK này (chưa có audit service) —
  sẽ thêm ở TASK 018 (Audit).

**Next task:** TASK 004 — RBAC (Authorization Engine).

---

## TASK 004 — RBAC — Báo cáo

**Status:** ✅ Completed

**Implemented:**
`src/lib/authorization/index.ts` — Authorization Engine duy nhất của toàn hệ
thống (Spec Section 11), implement đầy đủ Authorization Order 8 bước:

- `hasPermission(employee, code)`: query DB role→permissions, trả boolean.
- `requirePermission(employee, code)`: redirect /dashboard nếu không có quyền
  (Note: sẽ upgrade sang `forbidden()` khi Next.js version hỗ trợ API này).
- `getAllowedTerritories(employee)`: ADMIN/MANAGER → null (unrestricted);
  TDV/SUPERVISOR → danh sách territory_id active (end_date IS NULL).
- `canAccessTerritory(employee, territoryId)`: kiểm tra territory trong scope.
- `canAccessCustomer(employee, customerId)`: ADMIN/MANAGER → true; TDV/SUPERVISOR
  → phải có employee_customers active (Spec Section 11.2 TDV rule).
- `canAccessEmployee(employee, targetId)`: ADMIN → tất cả; TDV → chỉ chính mình;
  MANAGER/SUPERVISOR → employee trong territory chung.
- `getAllowedCustomerIds(employee)`: trả null hoặc []string dùng làm WHERE
  clause trong service layer (TASK 007, 009...).
- `getAllowedEmployeeIds(employee)`: tương tự cho employee scope.
- `requirePermissionOrRedirect(employee, code, redirectTo)`: variant redirect-
  friendly cho page server components.

**Files changed:**

- `src/lib/authorization/index.ts` (mới)
- `src/lib/authorization/.gitkeep` (xóa)
- `docs/PROGRESS.md`

**Database changes:** Không có.

**Tests:**

- ADMIN hasPermission(DASHBOARD_VIEW) → true: PASS
- ADMIN hasPermission(NONEXISTENT) → false: PASS
- ADMIN getAllowedTerritories → null (unrestricted): PASS
- ADMIN canAccessCustomer(any) → true: PASS
- ADMIN getAllowedEmployeeIds → null (unrestricted): PASS
- lint, typecheck, build: PASS

**Security checks:**

- Module này là SINGLE SOURCE OF TRUTH cho authorization — không self-check
  role ở nơi khác.
- Permission query qua DB (không cache) để đảm bảo thay đổi permission có
  hiệu lực ngay.
- TDV không thể override ownership (Spec Section 11.2) — enforced qua
  canAccessCustomer/canAccessEmployee.

**Next task:** TASK 005 — Territory Scope.
