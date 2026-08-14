import { index, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { employees } from './organization';

/**
 * notifications — Spec Section 8.20
 */
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 50 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message').notNull(),
    referenceType: varchar('reference_type', { length: 50 }),
    referenceId: uuid('reference_id'),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('notifications_employee_id_idx').on(table.employeeId),
    // TASK 016 Notification Center: query "unread của tôi" là truy vấn nóng.
    index('notifications_employee_unread_idx').on(table.employeeId, table.readAt),
  ],
);

/**
 * audit_logs — Spec Section 8.21
 *
 * QUY TẮC (Spec Section 9, rule #7): KHÔNG hard-delete audit logs.
 * Không tạo API/service nào cho phép xoá bảng này ở các task sau — chỉ
 * INSERT. `user_id` KHÔNG đặt FK cascade delete để tránh mất audit trail
 * nếu employee bị xoá (thực tế employees cũng không hard-delete, chỉ đổi
 * status).
 */
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'restrict' }),
    action: varchar('action', { length: 100 }).notNull(),
    entityType: varchar('entity_type', { length: 100 }).notNull(),
    entityId: uuid('entity_id'),
    oldData: jsonb('old_data'),
    newData: jsonb('new_data'),
    ipAddress: varchar('ip_address', { length: 64 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('audit_logs_user_id_idx').on(table.userId),
    index('audit_logs_entity_idx').on(table.entityType, table.entityId),
    index('audit_logs_created_at_idx').on(table.createdAt),
  ],
);
