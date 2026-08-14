import {
  boolean,
  date,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { employees, territories } from './organization';

/**
 * customer_types — Spec Section 8.6
 * Seed: HOSPITAL, HEALTH_DEPARTMENT, PRIVATE_CLINIC
 */
export const customerTypes = pgTable(
  'customer_types',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
  },
  (table) => [uniqueIndex('customer_types_code_key').on(table.code)],
);

/**
 * customers — Spec Section 8.7 ("Đơn vị/Khách hàng" trong UI)
 */
export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerCode: varchar('customer_code', { length: 50 }).notNull(),
    customerTypeId: uuid('customer_type_id')
      .notNull()
      .references(() => customerTypes.id, { onDelete: 'restrict' }),
    name: varchar('name', { length: 255 }).notNull(),
    address: text('address'),
    province: varchar('province', { length: 255 }),
    district: varchar('district', { length: 255 }),
    territoryId: uuid('territory_id')
      .notNull()
      .references(() => territories.id, { onDelete: 'restrict' }),
    contactName: varchar('contact_name', { length: 255 }),
    contactPhone: varchar('contact_phone', { length: 30 }),
    status: varchar('status', { length: 20 }).notNull().default('ACTIVE'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('customers_customer_code_key').on(table.customerCode),
    index('customers_territory_id_idx').on(table.territoryId),
    index('customers_customer_type_id_idx').on(table.customerTypeId),
  ],
);

/**
 * employee_customers — Spec Section 8.8
 * Mapping TDV ↔ customer, có lịch sử theo start_date/end_date như
 * employee_territories.
 */
export const employeeCustomers = pgTable(
  'employee_customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    startDate: date('start_date').notNull(),
    endDate: date('end_date'),
    isPrimary: boolean('is_primary').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('employee_customers_employee_id_idx').on(table.employeeId),
    index('employee_customers_customer_id_idx').on(table.customerId),
    index('employee_customers_active_scope_idx').on(table.employeeId, table.endDate),
  ],
);
