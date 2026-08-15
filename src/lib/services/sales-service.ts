/**
 * Sales Service — TASK 009
 * Spec Section 8.11, 12.2:
 *   employee_id = current employee (KHÔNG để client override)
 *   territory_id = validated employee territory
 *   customer_id = validated customer (phải trong scope)
 */
import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { salesTransactions, customers, products, territories, employees } from '../../../db/schema';
import type { CurrentEmployee } from '@/lib/auth/current-user';
import { canAccessCustomer } from '@/lib/authorization';
import { getPrimaryTerritoryForEmployee } from './territory-scope';

export interface CreateSaleInput {
  transactionDate: string;
  customerId: string;
  productId: string;
  quantity: string;
  unitPrice: string;
  source: string;
  note?: string | null;
}

export interface SaleListItem {
  id: string;
  transactionDate: string;
  employeeName: string;
  customerName: string;
  productName: string;
  quantity: string;
  unitPrice: string;
  revenue: string;
  source: string;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function listSales(
  currentEmployee: CurrentEmployee,
  opts: {
    dateFrom?: string;
    dateTo?: string;
    customerId?: string;
    productId?: string;
  } = {},
): Promise<SaleListItem[]> {
  const rows = await db
    .select({
      id: salesTransactions.id,
      transactionDate: salesTransactions.transactionDate,
      employeeName: employees.fullName,
      customerName: customers.name,
      productName: products.productName,
      quantity: salesTransactions.quantity,
      unitPrice: salesTransactions.unitPrice,
      revenue: salesTransactions.revenue,
      source: salesTransactions.source,
      employeeId: salesTransactions.employeeId,
      customerId: salesTransactions.customerId,
    })
    .from(salesTransactions)
    .innerJoin(employees, eq(salesTransactions.employeeId, employees.id))
    .innerJoin(customers, eq(salesTransactions.customerId, customers.id))
    .innerJoin(products, eq(salesTransactions.productId, products.id))
    .orderBy(desc(salesTransactions.transactionDate));

  return rows.filter((r) => {
    // Scope filter: TDV/SUPERVISOR chỉ thấy của mình
    if (!['ADMIN', 'MANAGER'].includes(currentEmployee.roleCode)) {
      if (r.employeeId !== currentEmployee.id) return false;
    }
    if (opts.customerId && r.customerId !== opts.customerId) return false;
    if (opts.dateFrom && r.transactionDate < opts.dateFrom) return false;
    if (opts.dateTo && r.transactionDate > opts.dateTo) return false;
    return true;
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Tạo sale với ownership enforcement.
 * employee_id và territory_id được lấy từ session/DB — client không được gửi.
 */
export async function createSale(
  currentEmployee: CurrentEmployee,
  input: CreateSaleInput,
): Promise<typeof salesTransactions.$inferSelect> {
  // 1. Validate customer scope (Spec 12.2 + Section 11.2 TDV rule)
  const allowed = await canAccessCustomer(currentEmployee, input.customerId);
  if (!allowed) {
    throw new Error('Bạn không có quyền tạo giao dịch cho khách hàng này.');
  }

  // 2. Lấy territory của customer để set territory_id (Spec 12.2)
  const [custRow] = await db
    .select({ territoryId: customers.territoryId })
    .from(customers)
    .where(eq(customers.id, input.customerId))
    .limit(1);

  if (!custRow) throw new Error('Khách hàng không tồn tại.');

  // 3. Tính revenue = quantity * unitPrice
  const revenue = (parseFloat(input.quantity) * parseFloat(input.unitPrice)).toFixed(2);

  const [sale] = await db
    .insert(salesTransactions)
    .values({
      transactionDate: input.transactionDate,
      employeeId: currentEmployee.id, // ownership bắt buộc từ session
      territoryId: custRow.territoryId, // từ customer, không từ client
      customerId: input.customerId,
      productId: input.productId,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
      revenue,
      source: input.source,
      note: input.note ?? null,
    })
    .returning();

  return sale;
}
