/**
 * KPI Service — TASK 013
 * Tính achievement_rate = actual / target theo period.
 */
import { eq, and, gte, lte, sum } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import {
  kpiTargets,
  kpiResults,
  kpiDefinitions,
  salesTransactions,
  prescriptionReports,
} from '../../../db/schema';
import type { CurrentEmployee } from '@/lib/auth/current-user';

export async function getKpiSummary(employeeId: string, periodStart: string, periodEnd: string) {
  const targets = await db
    .select({
      kpiCode: kpiDefinitions.code,
      kpiName: kpiDefinitions.name,
      unit: kpiDefinitions.unit,
      targetValue: kpiTargets.targetValue,
    })
    .from(kpiTargets)
    .innerJoin(kpiDefinitions, eq(kpiTargets.kpiDefinitionId, kpiDefinitions.id))
    .where(
      and(
        eq(kpiTargets.employeeId, employeeId),
        lte(kpiTargets.periodStart, periodEnd),
        gte(kpiTargets.periodEnd, periodStart),
      ),
    );

  const results = await db
    .select({
      kpiCode: kpiDefinitions.code,
      actualValue: kpiResults.actualValue,
      achievementRate: kpiResults.achievementRate,
    })
    .from(kpiResults)
    .innerJoin(kpiDefinitions, eq(kpiResults.kpiDefinitionId, kpiDefinitions.id))
    .where(
      and(
        eq(kpiResults.employeeId, employeeId),
        eq(kpiResults.periodStart, periodStart),
        eq(kpiResults.periodEnd, periodEnd),
      ),
    );

  const resultByCode = new Map(results.map((r) => [r.kpiCode, r]));

  return targets.map((t) => {
    const result = resultByCode.get(t.kpiCode);
    return {
      ...t,
      actualValue: result?.actualValue ?? null,
      achievementRate: result?.achievementRate ?? null,
    };
  });
}

/**
 * Tính toán KPI doanh số thực tế từ sales_transactions và upsert vào kpi_results.
 */
export async function calculateRevenueKpi(
  employeeId: string,
  kpiDefinitionId: string,
  targetValue: string,
  periodStart: string,
  periodEnd: string,
) {
  const [row] = await db
    .select({ total: sum(salesTransactions.revenue) })
    .from(salesTransactions)
    .where(
      and(
        eq(salesTransactions.employeeId, employeeId),
        gte(salesTransactions.transactionDate, periodStart),
        lte(salesTransactions.transactionDate, periodEnd),
      ),
    );

  const actualValue = parseFloat(row?.total ?? '0').toFixed(2);
  const achievementRate = (parseFloat(actualValue) / parseFloat(targetValue)).toFixed(4);

  const [result] = await db
    .insert(kpiResults)
    .values({
      employeeId,
      kpiDefinitionId,
      periodStart,
      periodEnd,
      targetValue,
      actualValue,
      achievementRate,
    })
    .onConflictDoUpdate({
      target: [kpiResults.employeeId, kpiResults.kpiDefinitionId, kpiResults.periodStart],
      set: { actualValue, achievementRate, calculatedAt: new Date() },
    })
    .returning();

  return result;
}
