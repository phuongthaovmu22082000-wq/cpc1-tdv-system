/**
 * Territory Scope Resolver — TASK 005
 *
 * Lớp service bổ sung giữa Authorization Engine (TASK 004) và các service
 * nghiệp vụ (TASK 006-015). Cung cấp "scope context" đã được resolve sẵn
 * để service layer không cần tự gọi nhiều hàm authorization riêng lẻ.
 *
 * Spec Section 11.1 steps 6-8.
 */
import { eq, inArray, isNull, and } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { territories, employeeTerritories } from '../../../db/schema';
import {
  getAllowedTerritories,
  getAllowedCustomerIds,
  getAllowedEmployeeIds,
} from '@/lib/authorization';
import type { CurrentEmployee } from '@/lib/auth/current-user';

export interface ScopeContext {
  /**
   * null = không giới hạn (ADMIN/MANAGER xem toàn bộ).
   * string[] = danh sách ID được phép (có thể rỗng nếu chưa được phân công).
   */
  territoryIds: string[] | null;
  customerIds: string[] | null;
  employeeIds: string[] | null;
  /** Convenience: true nếu role không bị giới hạn scope (ADMIN/MANAGER) */
  isUnrestricted: boolean;
}

/**
 * Resolve scope context cho employee hiện tại.
 * Gọi một lần ở đầu mỗi request — truyền xuống toàn bộ service calls trong
 * request đó thay vì query DB nhiều lần.
 */
export async function resolveScopeContext(currentEmployee: CurrentEmployee): Promise<ScopeContext> {
  const [territoryIds, customerIds, employeeIds] = await Promise.all([
    getAllowedTerritories(currentEmployee),
    getAllowedCustomerIds(currentEmployee),
    getAllowedEmployeeIds(currentEmployee),
  ]);

  return {
    territoryIds,
    customerIds,
    employeeIds,
    isUnrestricted: territoryIds === null,
  };
}

/**
 * Lấy danh sách territory entity (không chỉ ID) trong scope của employee.
 * Dùng ở Territory List page (TASK 006) và filter dropdowns toàn hệ thống.
 */
export async function getTerritoriesInScope(currentEmployee: CurrentEmployee) {
  const allowedIds = await getAllowedTerritories(currentEmployee);

  if (allowedIds === null) {
    // ADMIN/MANAGER: tất cả territory active
    return db
      .select()
      .from(territories)
      .where(eq(territories.status, 'ACTIVE'))
      .orderBy(territories.code);
  }

  if (allowedIds.length === 0) return [];

  return db
    .select()
    .from(territories)
    .where(and(inArray(territories.id, allowedIds), eq(territories.status, 'ACTIVE')))
    .orderBy(territories.code);
}

/**
 * Lấy danh sách territory assignment của employee (kể cả lịch sử đã hết hạn).
 * Dùng ở Employee Detail page để hiển thị lịch sử phân công.
 */
export async function getEmployeeTerritoryHistory(employeeId: string) {
  return db
    .select({
      id: employeeTerritories.id,
      territoryId: employeeTerritories.territoryId,
      territoryCode: territories.code,
      territoryName: territories.name,
      startDate: employeeTerritories.startDate,
      endDate: employeeTerritories.endDate,
      isPrimary: employeeTerritories.isPrimary,
    })
    .from(employeeTerritories)
    .innerJoin(territories, eq(employeeTerritories.territoryId, territories.id))
    .where(eq(employeeTerritories.employeeId, employeeId))
    .orderBy(employeeTerritories.startDate);
}

/**
 * Lấy territory đang active (primary) của employee.
 * Dùng trong nhiều service để auto-fill territory_id khi TDV tạo transaction.
 */
export async function getPrimaryTerritoryForEmployee(
  employeeId: string,
): Promise<{ id: string; code: string; name: string } | null> {
  const [row] = await db
    .select({
      id: territories.id,
      code: territories.code,
      name: territories.name,
    })
    .from(employeeTerritories)
    .innerJoin(territories, eq(employeeTerritories.territoryId, territories.id))
    .where(
      and(
        eq(employeeTerritories.employeeId, employeeId),
        eq(employeeTerritories.isPrimary, true),
        isNull(employeeTerritories.endDate),
      ),
    )
    .limit(1);

  return row ?? null;
}
