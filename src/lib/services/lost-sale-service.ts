/**
 * Lost Sale Engine — TASK 015
 *
 * Spec Section 12.6 (QUAN TRỌNG):
 *   Lost Sale = customer không phát sinh doanh số trong 4 THÁNG LỊCH
 *   liên tiếp.
 *
 *   KHÔNG dùng: last_sale_date + 120 days  (sai với business requirement)
 *   PHẢI dùng: so sánh theo tháng lịch (calendar months)
 *
 * Ví dụ: nếu hôm nay là 2026-08-15, "4 tháng lịch" bắt đầu từ
 * 2026-04-01 (đầu tháng 4). Customer chưa có sale từ trước 2026-04-01
 * đến nay được coi là Lost Sale.
 */
import { eq, and, gte, isNull, inArray, not, exists } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import {
  customers,
  salesTransactions,
  employeeCustomers,
  territories,
  customerTypes,
} from '../../../db/schema';
import type { CurrentEmployee } from '@/lib/auth/current-user';
import { getAllowedCustomerIds } from '@/lib/authorization';

export interface LostSaleCustomer {
  id: string;
  customerCode: string;
  name: string;
  customerTypeName: string;
  territoryName: string;
  lastSaleDate: string | null;
  monthsSinceLastSale: number | null;
}

/**
 * Tính ngày đầu của "4 tháng lịch trước" so với today.
 * Đây là boundary date: customer có sale < boundary = Lost Sale candidate.
 */
function getLostSaleBoundaryDate(today = new Date()): string {
  const d = new Date(today);
  d.setMonth(d.getMonth() - 4);
  // Đặt về ngày 1 của tháng đó (đầu tháng lịch)
  d.setDate(1);
  return d.toISOString().substring(0, 10); // YYYY-MM-DD
}

/**
 * Tìm tất cả customer trong scope bị "Lost Sale":
 * - Chưa có sale nào, HOẶC
 * - Sale gần nhất trước boundary date (đầu tháng thứ 4 kể từ hôm nay)
 */
export async function getLostSaleCustomers(
  currentEmployee: CurrentEmployee,
  today?: Date,
): Promise<LostSaleCustomer[]> {
  const boundaryDate = getLostSaleBoundaryDate(today);
  const allowedCustomerIds = await getAllowedCustomerIds(currentEmployee);

  // Subquery: tìm customer CÓ sale trong window >= boundaryDate
  const customersWithRecentSale = db
    .selectDistinct({ cid: salesTransactions.customerId })
    .from(salesTransactions)
    .where(gte(salesTransactions.transactionDate, boundaryDate));

  // Subquery: last_sale_date mỗi customer
  const lastSaleSub = db
    .select({
      customerId: salesTransactions.customerId,
      lastSaleDate: sql<string>`max(${salesTransactions.transactionDate})`.as('last_sale_date'),
    })
    .from(salesTransactions)
    .groupBy(salesTransactions.customerId)
    .as('last_sale');

  const rows = await db
    .select({
      id: customers.id,
      customerCode: customers.customerCode,
      name: customers.name,
      customerTypeName: customerTypes.name,
      territoryName: territories.name,
      lastSaleDate: lastSaleSub.lastSaleDate,
    })
    .from(customers)
    .innerJoin(customerTypes, eq(customers.customerTypeId, customerTypes.id))
    .innerJoin(territories, eq(customers.territoryId, territories.id))
    .leftJoin(lastSaleSub, eq(lastSaleSub.customerId, customers.id))
    .where(
      and(
        eq(customers.status, 'ACTIVE'),
        // Lọc customer KHÔNG có sale gần đây (trong 4 tháng lịch)
        not(
          inArray(
            customers.id,
            db
              .select({ cid: salesTransactions.customerId })
              .from(salesTransactions)
              .where(gte(salesTransactions.transactionDate, boundaryDate)),
          ),
        ),
      ),
    )
    .orderBy(customers.name);

  // Áp dụng scope filter sau khi query (tránh subquery phức tạp trong Drizzle)
  const scopeFiltered =
    allowedCustomerIds === null ? rows : rows.filter((r) => allowedCustomerIds.includes(r.id));

  const todayDate = today ?? new Date();
  return scopeFiltered.map((r) => {
    let monthsSinceLastSale: number | null = null;
    if (r.lastSaleDate) {
      const last = new Date(r.lastSaleDate);
      monthsSinceLastSale =
        (todayDate.getFullYear() - last.getFullYear()) * 12 +
        (todayDate.getMonth() - last.getMonth());
    }
    return {
      id: r.id,
      customerCode: r.customerCode,
      name: r.name,
      customerTypeName: r.customerTypeName,
      territoryName: r.territoryName,
      lastSaleDate: r.lastSaleDate ?? null,
      monthsSinceLastSale,
    };
  });
}

/** Expose để dashboard và tests có thể gọi trực tiếp */
export { getLostSaleBoundaryDate };
