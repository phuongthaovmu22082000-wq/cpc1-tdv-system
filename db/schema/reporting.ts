import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { employees } from './organization';

/**
 * kpi_definitions — Spec Section 8.16
 */
export const kpiDefinitions = pgTable(
  'kpi_definitions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    unit: varchar('unit', { length: 50 }).notNull(),
    calculationType: varchar('calculation_type', { length: 50 }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('kpi_definitions_code_key').on(table.code)],
);

/**
 * kpi_targets — Spec Section 8.17
 */
export const kpiTargets = pgTable(
  'kpi_targets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    kpiDefinitionId: uuid('kpi_definition_id')
      .notNull()
      .references(() => kpiDefinitions.id, { onDelete: 'restrict' }),
    periodStart: date('period_start').notNull(),
    periodEnd: date('period_end').notNull(),
    targetValue: numeric('target_value', { precision: 18, scale: 2 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('kpi_targets_employee_id_idx').on(table.employeeId),
    index('kpi_targets_period_idx').on(table.periodStart, table.periodEnd),
  ],
);

/**
 * kpi_results — Spec Section 8.18
 * Kết quả tính toán (KPI engine TASK 013), không nhập tay.
 */
export const kpiResults = pgTable(
  'kpi_results',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    kpiDefinitionId: uuid('kpi_definition_id')
      .notNull()
      .references(() => kpiDefinitions.id, { onDelete: 'restrict' }),
    periodStart: date('period_start').notNull(),
    periodEnd: date('period_end').notNull(),
    targetValue: numeric('target_value', { precision: 18, scale: 2 }).notNull(),
    actualValue: numeric('actual_value', { precision: 18, scale: 2 }).notNull(),
    achievementRate: numeric('achievement_rate', { precision: 9, scale: 4 }).notNull(),
    calculatedAt: timestamp('calculated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('kpi_results_employee_id_idx').on(table.employeeId),
    index('kpi_results_period_idx').on(table.periodStart, table.periodEnd),
  ],
);

/**
 * daily_reports — Spec Section 8.19
 * Unique business key: (employee_id, report_date) — Spec yêu cầu tối đa
 * một report cho một ngày (Section 12.5).
 */
export const dailyReports = pgTable(
  'daily_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    reportDate: date('report_date').notNull(),
    visitsCount: integer('visits_count').notNull().default(0),
    newCustomersCount: integer('new_customers_count').notNull().default(0),
    salesValue: numeric('sales_value', { precision: 18, scale: 2 }).notNull().default('0'),
    prescriptionCount: integer('prescription_count').notNull().default(0),
    tenderActivity: text('tender_activity'),
    summary: text('summary'),
    status: varchar('status', { length: 20 }).notNull().default('DRAFT'),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('daily_reports_employee_id_report_date_key').on(table.employeeId, table.reportDate),
  ],
);
