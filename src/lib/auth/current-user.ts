import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { employees, roles } from '../../../db/schema';
import { findValidSession, SESSION_COOKIE_NAME } from './session';

export interface CurrentEmployee {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  status: string;
  roleId: string;
  roleCode: string;
  roleName: string;
}

/**
 * Đọc cookie session, verify, resolve ra employee + role hiện tại.
 * Trả về null nếu:
 * - Không có cookie
 * - Session không hợp lệ/hết hạn/đã revoke
 * - Employee không còn ACTIVE (tài khoản bị khoá sau khi session đã tạo)
 *
 * Đây là hàm DUY NHẤT nên dùng để biết "ai đang đăng nhập" — không tự ý
 * đọc cookie hay session ở nơi khác trong codebase (Spec Section 11:
 * authorization order bắt đầu từ đây).
 */
export async function getCurrentEmployee(): Promise<CurrentEmployee | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const session = await findValidSession(token);
  if (!session) return null;

  const [row] = await db
    .select({
      id: employees.id,
      employeeCode: employees.employeeCode,
      fullName: employees.fullName,
      email: employees.email,
      status: employees.status,
      roleId: roles.id,
      roleCode: roles.code,
      roleName: roles.name,
    })
    .from(employees)
    .innerJoin(roles, eq(employees.roleId, roles.id))
    .where(eq(employees.id, session.employeeId))
    .limit(1);

  if (!row) return null;

  // Account bị khoá sau khi session được tạo — không cho qua dù session
  // còn hạn (Spec Section 11.1, bước "Is account active?").
  if (row.status !== 'ACTIVE') return null;

  return row;
}

/**
 * Dùng ở server component/layout cho route cần đăng nhập. Redirect về
 * /login nếu chưa authenticated. Đây là bước 1 trong Authorization order
 * (Spec Section 11.1) — các bước sau (role/permission/territory/customer
 * scope) được thực hiện ở lib/authorization (TASK 004/005), KHÔNG phải ở
 * đây.
 */
export async function requireAuth(): Promise<CurrentEmployee> {
  const employee = await getCurrentEmployee();
  if (!employee) {
    redirect('/login');
  }
  return employee;
}
