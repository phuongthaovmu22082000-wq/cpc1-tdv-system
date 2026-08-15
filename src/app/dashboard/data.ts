/**
 * Dashboard data loader — TASK 014
 * Tổng hợp dữ liệu cho 7 cards theo Spec Section 14.2.
 * Chạy ở server (async Server Component) để không cần API route riêng.
 */
import { eq, and, gte, lte, count, sum, isNull, not, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import {
  salesTransactions,
  kpiResults,
  kpiDefinitions,
  prescriptionReports,
  customers,
  tenders,
  dailyReports,
} from '@/../db/schema';
import { getLostSaleCustomers } from '@/lib/services/lost-sale-service';
import { getAllowedCustomerIds } from '@/lib/authorization';
import type { CurrentEmployee } from '@/lib/auth/current-user';

function currentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().substring(0, 10),
    end: end.toISOString().substring(0, 10),
  };
}

export interface DashboardData {
  revenueThisMonth: number;
  kpiAchievement: number | null; // percent, null nếu chưa có target
  prescriptionCount: number;
  activeCustomerCount: number;
  lostSaleCount: number;
  activeTenderCount: number;
  dailyReportSubmittedToday: boolean;
}

export async function loadDashboardData(currentEmployee: CurrentEmployee): Promise<DashboardData> {
  const { start, end } = currentMonthRange();
  const today = new Date().toISOString().substring(0, 10);

  // Scope: TDV chỉ thấy data của mình
  const isLimited = !['ADMIN', 'MANAGER'].includes(currentEmployee.roleCode);
  const empFilter = isLimited ? eq(salesTransactions.employeeId, currentEmployee.id) : undefined;
  const allowedCustomerIds = await getAllowedCustomerIds(currentEmployee);

  // 1. Doanh số tháng hiện tại
  const [revenueRow] = await db
    .select({ total: sum(salesTransactions.revenue) })
    .from(salesTransactions)
    .where(
      and(
        empFilter,
        gte(salesTransactions.transactionDate, start),
        lte(salesTransactions.transactionDate, end),
      ),
    );

  // 2. KPI achievement tháng hiện tại (lấy KPI doanh số đầu tiên tìm được)
  const kpiRows = await db
    .select({
      achievementRate: kpiResults.achievementRate,
    })
    .from(kpiResults)
    .innerJoin(kpiDefinitions, eq(kpiResults.kpiDefinitionId, kpiDefinitions.id))
    .where(
      and(
        eq(kpiResults.employeeId, currentEmployee.id),
        eq(kpiResults.periodStart, start),
        eq(kpiResults.periodEnd, end),
      ),
    )
    .limit(1);

  // 3. Số kê đơn tháng này
  const [prescRow] = await db
    .select({ cnt: count() })
    .from(prescriptionReports)
    .where(
      and(
        isLimited ? eq(prescriptionReports.employeeId, currentEmployee.id) : undefined,
        gte(prescriptionReports.reportDate, start),
        lte(prescriptionReports.reportDate, end),
      ),
    );

  // 4. Active customers trong scope
  const custQuery = db
    .select({ cnt: count() })
    .from(customers)
    .where(eq(customers.status, 'ACTIVE'));
  const [custRow] =
    allowedCustomerIds === null
      ? await custQuery
      : await db
          .select({ cnt: count() })
          .from(customers)
          .where(and(eq(customers.status, 'ACTIVE'), inArray(customers.id, allowedCustomerIds)));

  // 5. Lost Sale count
  const lostSaleList = await getLostSaleCustomers(currentEmployee);

  // 6. Active tenders
  const [tenderRow] = await db
    .select({ cnt: count() })
    .from(tenders)
    .where(
      and(
        isLimited ? eq(tenders.employeeId, currentEmployee.id) : undefined,
        not(inArray(tenders.status, ['WON', 'LOST'])),
      ),
    );

  // 7. Daily report hôm nay
  const [drRow] = await db
    .select({ cnt: count() })
    .from(dailyReports)
    .where(
      and(
        eq(dailyReports.employeeId, currentEmployee.id),
        eq(dailyReports.reportDate, today),
        eq(dailyReports.status, 'SUBMITTED'),
      ),
    );

  return {
    revenueThisMonth: parseFloat(revenueRow?.total ?? '0'),
    kpiAchievement:
      kpiRows[0]?.achievementRate != null
        ? Math.round(parseFloat(kpiRows[0].achievementRate) * 100)
        : null,
    prescriptionCount: Number(prescRow?.cnt ?? 0),
    activeCustomerCount: Number(custRow?.cnt ?? 0),
    lostSaleCount: lostSaleList.length,
    activeTenderCount: Number(tenderRow?.cnt ?? 0),
    dailyReportSubmittedToday: Number(drRow?.cnt ?? 0) > 0,
  };
}
