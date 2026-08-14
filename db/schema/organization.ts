import {
  boolean,
  date,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { roles } from './authorization';

/**
 * territories — Spec Section 8.3
 * Seed ban đầu: DN, QNA, QNG, BD, GL (Đà Nẵng, Quảng Nam, Quảng Ngãi,
 * Bình Định, Gia Lai). Schema hỗ trợ thêm địa bàn mà không đổi cấu trúc.
 */
export const territories = pgTable(
  'territories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 20 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    province: varchar('province', { length: 255 }),
    status: varchar('status', { length: 20 }).notNull().default('ACTIVE'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('territories_code_key').on(table.code)],
);

/**
 * employees — Spec Section 8.4
 * `email` dùng để liên kết account đăng nhập, KHÔNG dùng làm business PK
 * (Spec Section 10.2).
 */
export const employees = pgTable(
  'employees',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    employeeCode: varchar('employee_code', { length: 50 }).notNull(),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 30 }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'restrict' }),
    status: varchar('status', { length: 20 }).notNull().default('ACTIVE'),
    joinedAt: date('joined_at'),
    leftAt: date('left_at'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('employees_employee_code_key').on(table.employeeCode),
    uniqueIndex('employees_email_key').on(table.email),
    index('employees_role_id_idx').on(table.roleId),
  ],
);

/**
 * employee_territories — Spec Section 8.5
 * Lịch sử phân công địa bàn: một employee có thể có nhiều dòng theo thời
 * gian (start_date/end_date), end_date NULL nghĩa là đang hiệu lực.
 */
export const employeeTerritories = pgTable(
  'employee_territories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    territoryId: uuid('territory_id')
      .notNull()
      .references(() => territories.id, { onDelete: 'restrict' }),
    startDate: date('start_date').notNull(),
    endDate: date('end_date'),
    isPrimary: boolean('is_primary').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('employee_territories_employee_id_idx').on(table.employeeId),
    index('employee_territories_territory_id_idx').on(table.territoryId),
    // Scope resolver (TASK 005) sẽ query theo employee_id + end_date IS NULL
    // rất thường xuyên — đây là truy vấn nóng nhất của toàn hệ thống.
    index('employee_territories_active_scope_idx').on(table.employeeId, table.endDate),
  ],
);
