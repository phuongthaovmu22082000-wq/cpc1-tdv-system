import { index, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { employees } from './organization';

/**
 * credentials — KHÔNG có trong Spec Section 6.1 (Entity Groups) vì spec chỉ
 * mô tả domain entities, không mô tả cơ chế lưu trữ auth cụ thể.
 *
 * QUYẾT ĐỊNH THIẾT KẾ (TASK 003, cần Product Owner biết):
 * - Tách password hash ra bảng riêng thay vì thêm cột vào `employees`, để
 *   không đổi field requirement đã định nghĩa ở Spec Section 8.4 và giữ dữ
 *   liệu nhạy cảm tách biệt khỏi bảng business data.
 * - 1-1 với employees qua PK = FK (một employee có tối đa một credential).
 */
export const credentials = pgTable('credentials', {
  employeeId: uuid('employee_id')
    .primaryKey()
    .references(() => employees.id, { onDelete: 'cascade' }),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * sessions — session được lưu ở DB (không dùng stateless JWT) để hỗ trợ
 * "Session expiration" và "Logout" thật sự thu hồi được (Build Plan
 * Section 28.1 Authentication Tests). Chỉ lưu HASH của token, không lưu
 * token gốc (Spec Section 19: "Không log password, token hoặc secret").
 */
export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 128 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    ipAddress: varchar('ip_address', { length: 64 }),
    userAgent: varchar('user_agent', { length: 512 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('sessions_token_hash_idx').on(table.tokenHash),
    index('sessions_employee_id_idx').on(table.employeeId),
  ],
);
