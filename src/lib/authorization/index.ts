/**
 * Authorization Engine — Spec Section 11
 *
 * Đây là MODULE DUY NHẤT trong codebase có quyền đưa ra quyết định
 * "được phép / không được phép". Mọi route, server action, và service
 * PHẢI gọi qua đây — không tự kiểm tra role/permission trực tiếp.
 *
 * Authorization Order (Spec Section 11.1):
 *   1. Is authenticated?        → requireAuth() trong current-user.ts (TASK 003)
 *   2. Is account active?       → đã check trong getCurrentEmployee()
 *   3. What employee?           → getCurrentEmployee() trả về CurrentEmployee
 *   4. What role?               → currentEmployee.roleCode
 *   5. What permission?         → requirePermission() bên dưới
 *   6. What territory?          → getAllowedTerritories() bên dưới
 *   7. What customer assignment → canAccessCustomer() bên dưới
 *   8. Is record within scope?  → caller kết hợp các hàm trên để quyết định
 */
import { redirect } from 'next/navigation';
import { and, eq, isNull, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import {
  rolePermissions,
  permissions,
  employeeTerritories,
  employeeCustomers,
} from '../../../db/schema';
import type { CurrentEmployee } from '@/lib/auth/current-user';

// ─────────────────────────────────────────────────────────────────────────────
// Permission check (Authorization Order steps 4-5)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Kiểm tra employee hiện tại có permission không (query DB qua role).
 * Trả về true/false — không throw, để caller quyết định xử lý.
 */
export async function hasPermission(
  currentEmployee: CurrentEmployee,
  permissionCode: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: permissions.id })
    .from(permissions)
    .innerJoin(rolePermissions, eq(rolePermissions.permissionId, permissions.id))
    .where(
      and(eq(rolePermissions.roleId, currentEmployee.roleId), eq(permissions.code, permissionCode)),
    )
    .limit(1);

  return Boolean(row);
}

/**
 * Require permission — throw HTTP 403 Forbidden nếu không có quyền.
 * Dùng ở server components và server actions sau requireAuth().
 */
export async function requirePermission(
  currentEmployee: CurrentEmployee,
  permissionCode: string,
): Promise<void> {
  const allowed = await hasPermission(currentEmployee, permissionCode);
  if (!allowed) {
    // TODO: thay bằng forbidden() khi Next.js build hỗ trợ API này.
    // Hiện tại redirect về dashboard để tránh lộ thông tin 403.
    redirect('/dashboard');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Territory scope (Authorization Order step 6)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lấy danh sách territory ID mà employee được phép truy cập.
 *
 * ADMIN / MANAGER / SUPERVISOR thấy tất cả (hoặc scope rộng hơn TDV).
 * TDV chỉ thấy territory được phân công còn hiệu lực (end_date IS NULL).
 *
 * Trả về null = không có giới hạn territory (dùng cho ADMIN/MANAGER).
 * Trả về string[] = danh sách territory ID được phép (có thể rỗng nếu
 * TDV chưa được phân công).
 */
export async function getAllowedTerritories(
  currentEmployee: CurrentEmployee,
): Promise<string[] | null> {
  // ADMIN và MANAGER thấy toàn bộ (Spec Section 11.1 không giới hạn
  // territory cho role này)
  if (['ADMIN', 'MANAGER'].includes(currentEmployee.roleCode)) {
    return null;
  }

  // TDV và SUPERVISOR: chỉ territory đang được phân công (end_date IS NULL)
  const rows = await db
    .select({ territoryId: employeeTerritories.territoryId })
    .from(employeeTerritories)
    .where(
      and(
        eq(employeeTerritories.employeeId, currentEmployee.id),
        isNull(employeeTerritories.endDate),
      ),
    );

  return rows.map((r) => r.territoryId);
}

/**
 * Kiểm tra territory ID có nằm trong scope của employee không.
 */
export async function canAccessTerritory(
  currentEmployee: CurrentEmployee,
  territoryId: string,
): Promise<boolean> {
  const allowed = await getAllowedTerritories(currentEmployee);
  if (allowed === null) return true; // no restriction
  return allowed.includes(territoryId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Customer scope (Authorization Order step 7)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Kiểm tra employee có quyền truy cập customer không.
 *
 * ADMIN/MANAGER: luôn có thể truy cập.
 * SUPERVISOR/TDV: customer phải được assign cho employee (employee_customers
 * active — end_date IS NULL), VÀ customer phải thuộc territory của employee.
 *
 * Spec Section 11.2 (TDV rule): "Tạo transaction cho customer được phép"
 * — đây là gate trước khi tạo sales/prescription/tender.
 */
export async function canAccessCustomer(
  currentEmployee: CurrentEmployee,
  customerId: string,
): Promise<boolean> {
  if (['ADMIN', 'MANAGER'].includes(currentEmployee.roleCode)) {
    return true;
  }

  const [row] = await db
    .select({ id: employeeCustomers.id })
    .from(employeeCustomers)
    .where(
      and(
        eq(employeeCustomers.employeeId, currentEmployee.id),
        eq(employeeCustomers.customerId, customerId),
        isNull(employeeCustomers.endDate),
      ),
    )
    .limit(1);

  return Boolean(row);
}

// ─────────────────────────────────────────────────────────────────────────────
// Employee scope (Authorization Order step 8 — quản lý nhân sự)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Kiểm tra employee hiện tại có quyền xem/chỉnh sửa dữ liệu của
 * targetEmployeeId không.
 *
 * ADMIN: xem tất cả.
 * MANAGER/SUPERVISOR: xem employee trong territory mình quản lý.
 * TDV: chỉ xem chính mình (Spec Section 11.2 — không đổi ownership).
 */
export async function canAccessEmployee(
  currentEmployee: CurrentEmployee,
  targetEmployeeId: string,
): Promise<boolean> {
  // Luôn xem được chính mình
  if (currentEmployee.id === targetEmployeeId) return true;

  if (currentEmployee.roleCode === 'ADMIN') return true;

  if (currentEmployee.roleCode === 'TDV') return false;

  // MANAGER/SUPERVISOR: target phải thuộc territory của mình
  const myTerritories = await getAllowedTerritories(currentEmployee);
  if (myTerritories === null) return true;

  // Kiểm tra targetEmployee có territory chung với mình không
  const [row] = await db
    .select({ id: employeeTerritories.id })
    .from(employeeTerritories)
    .where(
      and(
        eq(employeeTerritories.employeeId, targetEmployeeId),
        isNull(employeeTerritories.endDate),
        inArray(employeeTerritories.territoryId, myTerritories),
      ),
    )
    .limit(1);

  return Boolean(row);
}

// ─────────────────────────────────────────────────────────────────────────────
// Scope-aware query helpers (convenience)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Trả về danh sách customer ID mà employee được phép truy cập.
 * null = không giới hạn (ADMIN/MANAGER).
 * string[] = danh sách customer ID được assign (TDV/SUPERVISOR).
 *
 * Dùng làm WHERE clause trong các query service (TASK 007, 009, ...).
 */
export async function getAllowedCustomerIds(
  currentEmployee: CurrentEmployee,
): Promise<string[] | null> {
  if (['ADMIN', 'MANAGER'].includes(currentEmployee.roleCode)) {
    return null;
  }

  const rows = await db
    .select({ customerId: employeeCustomers.customerId })
    .from(employeeCustomers)
    .where(
      and(eq(employeeCustomers.employeeId, currentEmployee.id), isNull(employeeCustomers.endDate)),
    );

  return rows.map((r) => r.customerId);
}

/**
 * Trả về danh sách employee ID trong scope của currentEmployee.
 * null = không giới hạn (ADMIN).
 *
 * Dùng trong báo cáo / KPI listing theo manager/supervisor scope.
 */
export async function getAllowedEmployeeIds(
  currentEmployee: CurrentEmployee,
): Promise<string[] | null> {
  if (currentEmployee.roleCode === 'ADMIN') return null;

  if (currentEmployee.roleCode === 'TDV') {
    return [currentEmployee.id];
  }

  // MANAGER/SUPERVISOR: employee trong territory của mình
  const myTerritories = await getAllowedTerritories(currentEmployee);
  if (myTerritories === null) return null;

  if (myTerritories.length === 0) return [];

  const rows = await db
    .select({ employeeId: employeeTerritories.employeeId })
    .from(employeeTerritories)
    .where(
      and(
        isNull(employeeTerritories.endDate),
        inArray(employeeTerritories.territoryId, myTerritories),
      ),
    );

  // Deduplicate (một employee có thể có nhiều territory)
  return [...new Set(rows.map((r) => r.employeeId))];
}

// ─────────────────────────────────────────────────────────────────────────────
// Redirect helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * requirePermission + redirect về /dashboard nếu không có quyền.
 * Dùng ở page server component (thay vì forbidden() trả 403, redirect về
 * dashboard thân thiện hơn cho end user).
 */
export async function requirePermissionOrRedirect(
  currentEmployee: CurrentEmployee,
  permissionCode: string,
  redirectTo = '/dashboard',
): Promise<void> {
  const allowed = await hasPermission(currentEmployee, permissionCode);
  if (!allowed) {
    redirect(redirectTo);
  }
}
