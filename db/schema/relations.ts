import { relations } from 'drizzle-orm';
import { permissions, rolePermissions, roles } from './authorization';
import { employeeTerritories, employees, territories } from './organization';
import { customerTypes, customers, employeeCustomers } from './customer';
import { productGroups, products } from './product';
import {
  prescriptionItems,
  prescriptionReports,
  salesTransactions,
  tenderStatusHistory,
  tenders,
} from './transactions';
import { dailyReports, kpiDefinitions, kpiResults, kpiTargets } from './reporting';
import { auditLogs, notifications } from './system';

// --- Authorization ---
export const rolesRelations = relations(roles, ({ many }) => ({
  employees: many(employees),
  rolePermissions: many(rolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

// --- Organization ---
export const territoriesRelations = relations(territories, ({ many }) => ({
  employeeTerritories: many(employeeTerritories),
  customers: many(customers),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  role: one(roles, { fields: [employees.roleId], references: [roles.id] }),
  employeeTerritories: many(employeeTerritories),
  employeeCustomers: many(employeeCustomers),
  salesTransactions: many(salesTransactions),
  prescriptionReports: many(prescriptionReports),
  tenders: many(tenders),
  dailyReports: many(dailyReports),
  kpiTargets: many(kpiTargets),
  kpiResults: many(kpiResults),
  notifications: many(notifications),
  auditLogs: many(auditLogs),
}));

export const employeeTerritoriesRelations = relations(employeeTerritories, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeTerritories.employeeId],
    references: [employees.id],
  }),
  territory: one(territories, {
    fields: [employeeTerritories.territoryId],
    references: [territories.id],
  }),
}));

// --- Customer ---
export const customerTypesRelations = relations(customerTypes, ({ many }) => ({
  customers: many(customers),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  customerType: one(customerTypes, {
    fields: [customers.customerTypeId],
    references: [customerTypes.id],
  }),
  territory: one(territories, { fields: [customers.territoryId], references: [territories.id] }),
  employeeCustomers: many(employeeCustomers),
  salesTransactions: many(salesTransactions),
  prescriptionReports: many(prescriptionReports),
  tenders: many(tenders),
}));

export const employeeCustomersRelations = relations(employeeCustomers, ({ one }) => ({
  employee: one(employees, { fields: [employeeCustomers.employeeId], references: [employees.id] }),
  customer: one(customers, { fields: [employeeCustomers.customerId], references: [customers.id] }),
}));

// --- Product ---
export const productGroupsRelations = relations(productGroups, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  productGroup: one(productGroups, {
    fields: [products.productGroupId],
    references: [productGroups.id],
  }),
}));

// --- Transactions ---
export const salesTransactionsRelations = relations(salesTransactions, ({ one }) => ({
  employee: one(employees, { fields: [salesTransactions.employeeId], references: [employees.id] }),
  territory: one(territories, {
    fields: [salesTransactions.territoryId],
    references: [territories.id],
  }),
  customer: one(customers, { fields: [salesTransactions.customerId], references: [customers.id] }),
  product: one(products, { fields: [salesTransactions.productId], references: [products.id] }),
}));

export const prescriptionReportsRelations = relations(prescriptionReports, ({ one, many }) => ({
  employee: one(employees, {
    fields: [prescriptionReports.employeeId],
    references: [employees.id],
  }),
  territory: one(territories, {
    fields: [prescriptionReports.territoryId],
    references: [territories.id],
  }),
  customer: one(customers, {
    fields: [prescriptionReports.customerId],
    references: [customers.id],
  }),
  items: many(prescriptionItems),
}));

export const prescriptionItemsRelations = relations(prescriptionItems, ({ one }) => ({
  report: one(prescriptionReports, {
    fields: [prescriptionItems.prescriptionReportId],
    references: [prescriptionReports.id],
  }),
  product: one(products, { fields: [prescriptionItems.productId], references: [products.id] }),
}));

export const tendersRelations = relations(tenders, ({ one, many }) => ({
  employee: one(employees, { fields: [tenders.employeeId], references: [employees.id] }),
  territory: one(territories, { fields: [tenders.territoryId], references: [territories.id] }),
  customer: one(customers, { fields: [tenders.customerId], references: [customers.id] }),
  statusHistory: many(tenderStatusHistory),
}));

export const tenderStatusHistoryRelations = relations(tenderStatusHistory, ({ one }) => ({
  tender: one(tenders, { fields: [tenderStatusHistory.tenderId], references: [tenders.id] }),
  changedByEmployee: one(employees, {
    fields: [tenderStatusHistory.changedBy],
    references: [employees.id],
  }),
}));

// --- Reporting ---
export const kpiDefinitionsRelations = relations(kpiDefinitions, ({ many }) => ({
  kpiTargets: many(kpiTargets),
  kpiResults: many(kpiResults),
}));

export const kpiTargetsRelations = relations(kpiTargets, ({ one }) => ({
  employee: one(employees, { fields: [kpiTargets.employeeId], references: [employees.id] }),
  kpiDefinition: one(kpiDefinitions, {
    fields: [kpiTargets.kpiDefinitionId],
    references: [kpiDefinitions.id],
  }),
}));

export const kpiResultsRelations = relations(kpiResults, ({ one }) => ({
  employee: one(employees, { fields: [kpiResults.employeeId], references: [employees.id] }),
  kpiDefinition: one(kpiDefinitions, {
    fields: [kpiResults.kpiDefinitionId],
    references: [kpiDefinitions.id],
  }),
}));

export const dailyReportsRelations = relations(dailyReports, ({ one }) => ({
  employee: one(employees, { fields: [dailyReports.employeeId], references: [employees.id] }),
}));

// --- System ---
export const notificationsRelations = relations(notifications, ({ one }) => ({
  employee: one(employees, { fields: [notifications.employeeId], references: [employees.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(employees, { fields: [auditLogs.userId], references: [employees.id] }),
}));
