import { index, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

/**
 * product_groups — Spec Section 8.9
 */
export const productGroups = pgTable(
  'product_groups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    status: varchar('status', { length: 20 }).notNull().default('ACTIVE'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('product_groups_code_key').on(table.code)],
);

/**
 * products — Spec Section 8.10
 */
export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productCode: varchar('product_code', { length: 50 }).notNull(),
    productName: varchar('product_name', { length: 255 }).notNull(),
    productGroupId: uuid('product_group_id')
      .notNull()
      .references(() => productGroups.id, { onDelete: 'restrict' }),
    dosageForm: varchar('dosage_form', { length: 100 }).notNull(),
    strength: varchar('strength', { length: 100 }),
    unit: varchar('unit', { length: 50 }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('ACTIVE'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('products_product_code_key').on(table.productCode),
    index('products_product_group_id_idx').on(table.productGroupId),
  ],
);
