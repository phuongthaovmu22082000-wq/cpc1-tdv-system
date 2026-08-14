# Tiến độ triển khai — CPC1

Theo dõi theo `CPC1_AI_Agent_Build_Specification.md` Section 29 (Task Breakdown).

| Task | Tên | Trạng thái |
|---|---|---|
| 001 | Initialize Project | ✅ Done |
| 002 | Database | ⬜ Pending |
| 003 | Authentication | ⬜ Pending |
| 004 | RBAC | ⬜ Pending |
| 005 | Territory Scope | ⬜ Pending |
| 006 | Employee | ⬜ Pending |
| 007 | Customer | ⬜ Pending |
| 008 | Product | ⬜ Pending |
| 009 | Sales | ⬜ Pending |
| 010 | Prescription | ⬜ Pending |
| 011 | Tender | ⬜ Pending |
| 012 | Daily Report | ⬜ Pending |
| 013 | KPI | ⬜ Pending |
| 014 | Dashboard | ⬜ Pending |
| 015 | Lost Sale | ⬜ Pending |
| 016 | Notifications | ⬜ Pending |
| 017 | n8n | ⬜ Pending |
| 018 | Audit | ⬜ Pending |
| 019 | Security Test | ⬜ Pending |
| 020 | Production | ⬜ Pending |

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
