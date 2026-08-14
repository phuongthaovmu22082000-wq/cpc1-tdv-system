import {
  date,
  foreignKey,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { employees, territories } from './organization';
import { customers } from './customer';
import { products } from './product';

/**
 * sales_transactions — Spec Section 8.11
 * Ownership (employee_id / territory_id / customer_id) LUÔN được backend
 * xác định từ session hiện tại (Spec Section 12.2) — client không được
 * override. Việc enforce nằm ở lib/services (TASK 009), không phải ở đây.
 */
export const salesTransactions = pgTable(
  'sales_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    transactionDate: date('transaction_date').notNull(),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'restrict' }),
    territoryId: uuid('territory_id')
      .notNull()
      .references(() => territories.id, { onDelete: 'restrict' }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'restrict' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    quantity: numeric('quantity', { precision: 18, scale: 4 }).notNull(),
    unitPrice: numeric('unit_price', { precision: 18, scale: 2 }).notNull(),
    revenue: numeric('revenue', { precision: 18, scale: 2 }).notNull(),
    source: varchar('source', { length: 50 }).notNull(),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Truy vấn nóng nhất: theo customer (Lost Sale engine TASK 015), theo
    // employee/territory (scope + dashboard), theo ngày (báo cáo theo kỳ).
    index('sales_transactions_customer_id_idx').on(table.customerId),
    index('sales_transactions_employee_id_idx').on(table.employeeId),
    index('sales_transactions_territory_id_idx').on(table.territoryId),
    index('sales_transactions_transaction_date_idx').on(table.transactionDate),
    index('sales_transactions_customer_date_idx').on(table.customerId, table.transactionDate),
  ],
);

/**
 * prescription_reports — Spec Section 8.12
 */
export const prescriptionReports = pgTable(
  'prescription_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reportDate: date('report_date').notNull(),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'restrict' }),
    territoryId: uuid('territory_id')
      .notNull()
      .references(() => territories.id, { onDelete: 'restrict' }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'restrict' }),
    doctorName: varchar('doctor_name', { length: 255 }),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('prescription_reports_customer_id_idx').on(table.customerId),
    index('prescription_reports_employee_id_idx').on(table.employeeId),
    index('prescription_reports_territory_id_idx').on(table.territoryId),
    index('prescription_reports_report_date_idx').on(table.reportDate),
  ],
);

/**
 * prescription_items — Spec Section 8.13
 */
export const prescriptionItems = pgTable(
  'prescription_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    prescriptionReportId: uuid('prescription_report_id').notNull(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    quantity: numeric('quantity', { precision: 18, scale: 4 }).notNull(),
    note: text('note'),
  },
  (table) => [
    index('prescription_items_prescription_report_id_idx').on(table.prescriptionReportId),
    index('prescription_items_product_id_idx').on(table.productId),
    foreignKey({
      columns: [table.prescriptionReportId],
      foreignColumns: [prescriptionReports.id],
      name: 'prescription_items_report_id_fk',
    }).onDelete('cascade'),
  ],
);

/**
 * tenders — Spec Section 8.14
 * Status transition (DRAFT → PREPARING → SUBMITTED → WAITING_RESULT →
 * WON/LOST) được enforce ở service layer (TASK 011), không ở DB constraint,
 * để dễ điều chỉnh nếu business rule thay đổi có kiểm soát.
 */
export const tenders = pgTable(
  'tenders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenderCode: varchar('tender_code', { length: 50 }).notNull(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'restrict' }),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'restrict' }),
    territoryId: uuid('territory_id')
      .notNull()
      .references(() => territories.id, { onDelete: 'restrict' }),
    tenderName: varchar('tender_name', { length: 255 }).notNull(),
    description: text('description'),
    expectedValue: numeric('expected_value', { precision: 18, scale: 2 }),
    startDate: date('start_date'),
    submissionDate: date('submission_date'),
    resultDate: date('result_date'),
    status: varchar('status', { length: 30 }).notNull().default('DRAFT'),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('tenders_tender_code_key').on(table.tenderCode),
    index('tenders_customer_id_idx').on(table.customerId),
    index('tenders_employee_id_idx').on(table.employeeId),
    index('tenders_territory_id_idx').on(table.territoryId),
    index('tenders_status_idx').on(table.status),
  ],
);

/**
 * tender_status_history — Spec Section 8.15
 * Mỗi lần đổi status PHẢI tạo một dòng history (Spec Section 12.4).
 * Bảng này chỉ INSERT, không UPDATE/DELETE.
 */
export const tenderStatusHistory = pgTable(
  'tender_status_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenderId: uuid('tender_id')
      .notNull()
      .references(() => tenders.id, { onDelete: 'cascade' }),
    oldStatus: varchar('old_status', { length: 30 }),
    newStatus: varchar('new_status', { length: 30 }).notNull(),
    changedBy: uuid('changed_by')
      .notNull()
      .references(() => employees.id, { onDelete: 'restrict' }),
    changedAt: timestamp('changed_at', { withTimezone: true }).notNull().defaultNow(),
    note: text('note'),
  },
  (table) => [index('tender_status_history_tender_id_idx').on(table.tenderId)],
);
