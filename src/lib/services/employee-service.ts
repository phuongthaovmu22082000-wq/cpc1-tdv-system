/**
 * Employee Service — TASK 006
 * Spec Section 8.4, 12.x, Authorization Section 11.
 */
import { eq, and, isNull, ilike, or, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { employees, roles, employeeTerritories, credentials } from '../../../db/schema';
import { hashPassword } from '@/lib/auth/password';
import { revokeAllSessionsForEmployee } from '@/lib/auth/session';
import type { CurrentEmployee } from '@/lib/auth/current-user';
import { getAllowedEmployeeIds } from '@/lib/authorization';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EmployeeListItem {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string | null;
  status: string;
  roleCode: string;
  roleName: string;
}

export interface CreateEmployeeInput {
  employeeCode: string;
  fullName: string;
  email: string;
  phone?: string | null;
  roleId: string;
  initialPassword: string;
  joinedAt?: string | null;
}

export interface UpdateEmployeeInput {
  fullName?: string;
  phone?: string | null;
  roleId?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface AssignTerritoryInput {
  employeeId: string;
  territoryId: string;
  startDate: string;
  isPrimary?: boolean;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * Danh sách employee trong scope của currentEmployee.
 */
export async function listEmployees(
  currentEmployee: CurrentEmployee,
  opts: { search?: string; status?: string } = {},
): Promise<EmployeeListItem[]> {
  const allowedIds = await getAllowedEmployeeIds(currentEmployee);

  const rows = await db
    .select({
      id: employees.id,
      employeeCode: employees.employeeCode,
      fullName: employees.fullName,
      email: employees.email,
      phone: employees.phone,
      status: employees.status,
      roleCode: roles.code,
      roleName: roles.name,
    })
    .from(employees)
    .innerJoin(roles, eq(employees.roleId, roles.id))
    .orderBy(employees.fullName);

  return rows.filter((r) => {
    if (allowedIds !== null && !allowedIds.includes(r.id)) return false;
    if (opts.status && r.status !== opts.status) return false;
    if (opts.search) {
      const q = opts.search.toLowerCase();
      return (
        r.fullName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.employeeCode.toLowerCase().includes(q)
      );
    }
    return true;
  });
}

export async function getEmployeeById(id: string) {
  const [row] = await db
    .select({
      id: employees.id,
      employeeCode: employees.employeeCode,
      fullName: employees.fullName,
      email: employees.email,
      phone: employees.phone,
      status: employees.status,
      joinedAt: employees.joinedAt,
      leftAt: employees.leftAt,
      roleId: roles.id,
      roleCode: roles.code,
      roleName: roles.name,
    })
    .from(employees)
    .innerJoin(roles, eq(employees.roleId, roles.id))
    .where(eq(employees.id, id))
    .limit(1);
  return row ?? null;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createEmployee(input: CreateEmployeeInput) {
  if (input.initialPassword.length < 8) {
    throw new Error('Mật khẩu phải có ít nhất 8 ký tự.');
  }

  const [employee] = await db
    .insert(employees)
    .values({
      employeeCode: input.employeeCode,
      fullName: input.fullName,
      email: input.email,
      phone: input.phone ?? null,
      roleId: input.roleId,
      status: 'ACTIVE',
      joinedAt: input.joinedAt ?? null,
    })
    .returning();

  const passwordHash = await hashPassword(input.initialPassword);
  await db.insert(credentials).values({ employeeId: employee.id, passwordHash });

  return employee;
}

export async function updateEmployee(id: string, input: UpdateEmployeeInput) {
  const [updated] = await db
    .update(employees)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(employees.id, id))
    .returning();

  // Khoá tài khoản → thu hồi session ngay lập tức
  if (input.status === 'INACTIVE') {
    await revokeAllSessionsForEmployee(id);
  }

  return updated;
}

export async function assignTerritory(input: AssignTerritoryInput) {
  // Nếu is_primary, kết thúc territory primary hiện tại trước
  if (input.isPrimary) {
    await db
      .update(employeeTerritories)
      .set({ endDate: input.startDate })
      .where(
        and(
          eq(employeeTerritories.employeeId, input.employeeId),
          eq(employeeTerritories.isPrimary, true),
          isNull(employeeTerritories.endDate),
        ),
      );
  }

  const [row] = await db
    .insert(employeeTerritories)
    .values({
      employeeId: input.employeeId,
      territoryId: input.territoryId,
      startDate: input.startDate,
      isPrimary: input.isPrimary ?? false,
    })
    .returning();

  return row;
}

export async function resetPassword(employeeId: string, newPassword: string) {
  if (newPassword.length < 8) throw new Error('Mật khẩu phải có ít nhất 8 ký tự.');
  const passwordHash = await hashPassword(newPassword);
  await db
    .update(credentials)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(credentials.employeeId, employeeId));
  await revokeAllSessionsForEmployee(employeeId);
}
