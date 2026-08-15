/**
 * Daily Report Service — TASK 012
 * Spec Section 8.19, 12.5: mỗi employee có tối đa một daily report cho một ngày.
 */
import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { dailyReports, employees } from '../../../db/schema';
import type { CurrentEmployee } from '@/lib/auth/current-user';

export interface UpsertDailyReportInput {
  reportDate: string;
  visitsCount?: number;
  newCustomersCount?: number;
  salesValue?: string;
  prescriptionCount?: number;
  tenderActivity?: string | null;
  summary?: string | null;
}

export async function listDailyReports(currentEmployee: CurrentEmployee) {
  const rows = await db
    .select({
      id: dailyReports.id,
      reportDate: dailyReports.reportDate,
      employeeName: employees.fullName,
      visitsCount: dailyReports.visitsCount,
      salesValue: dailyReports.salesValue,
      status: dailyReports.status,
      submittedAt: dailyReports.submittedAt,
      employeeId: dailyReports.employeeId,
    })
    .from(dailyReports)
    .innerJoin(employees, eq(dailyReports.employeeId, employees.id))
    .orderBy(desc(dailyReports.reportDate));

  return rows.filter((r) => {
    if (!['ADMIN', 'MANAGER', 'SUPERVISOR'].includes(currentEmployee.roleCode)) {
      return r.employeeId === currentEmployee.id;
    }
    return true;
  });
}

/**
 * Upsert daily report — tạo mới hoặc cập nhật nếu đã tồn tại (Spec 12.5).
 * Unique key: (employee_id, report_date).
 */
export async function upsertDailyReport(
  currentEmployee: CurrentEmployee,
  input: UpsertDailyReportInput,
) {
  const existing = await db
    .select()
    .from(dailyReports)
    .where(
      and(
        eq(dailyReports.employeeId, currentEmployee.id),
        eq(dailyReports.reportDate, input.reportDate),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    const [updated] = await db
      .update(dailyReports)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(dailyReports.id, existing[0].id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(dailyReports)
    .values({
      employeeId: currentEmployee.id,
      ...input,
      status: 'DRAFT',
    })
    .returning();
  return created;
}

export async function submitDailyReport(reportId: string) {
  const [updated] = await db
    .update(dailyReports)
    .set({ status: 'SUBMITTED', submittedAt: new Date(), updatedAt: new Date() })
    .where(eq(dailyReports.id, reportId))
    .returning();
  return updated;
}
