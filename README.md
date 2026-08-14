# CPC1 — Hệ thống Quản lý Trình Dược Viên

Hệ thống web nội bộ quản lý đội ngũ trình dược viên (TDV) — CPC1 Hà Nội.

## Tech Stack

- **Frontend:** Next.js (App Router) + React + TypeScript
- **Styling:** Tailwind CSS
- **Validation:** Zod
- **Database:** PostgreSQL (thiết lập ở TASK 002)
- **Automation:** n8n
- **Hosting:** Netlify

## Cấu trúc thư mục

```text
src/
├── app/            # Route theo App Router (1 thư mục = 1 module nghiệp vụ)
├── components/     # ui / forms / tables / charts / layout
└── lib/            # auth / authorization / db / validation / services / utils
db/
├── schema/         # Database schema (TASK 002)
└── migrations/     # Migration files
tests/
├── unit/
├── integration/
└── e2e/
docs/               # Tài liệu bổ sung
```

## Bắt đầu (Local Development)

```bash
npm install
cp .env.example .env.local   # điền giá trị thật, không commit file này
npm run dev
```

Mở http://localhost:3000

## Scripts

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Chạy dev server |
| `npm run build` | Build production |
| `npm run start` | Chạy production build |
| `npm run lint` | Kiểm tra lint |
| `npm run typecheck` | Kiểm tra TypeScript |
| `npm run format` | Format code với Prettier |
| `npm run format:check` | Kiểm tra format (dùng trong CI) |

## Environment Variables

Xem `.env.example` để biết danh sách đầy đủ. Việc đọc và validate biến môi trường
tập trung tại `src/lib/utils/env.ts` (dùng Zod) — không đọc `process.env` trực
tiếp ở nơi khác trong codebase.

## Trạng thái triển khai

Dự án được xây dựng theo `CPC1_AI_Agent_Build_Specification.md`, thực thi tuần tự
từng TASK. Xem `docs/PROGRESS.md` để biết tiến độ.

- [x] TASK 001 — Initialize Project
- [ ] TASK 002 — Database
- [ ] TASK 003 — Authentication
- [ ] ... (xem specification để biết danh sách đầy đủ TASK 001–020)
