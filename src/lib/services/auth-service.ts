import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { credentials, employees } from '../../../db/schema';
import { verifyPassword } from '@/lib/auth/password';
import { createSession, revokeSession } from '@/lib/auth/session';
import type { LoginInput } from '@/lib/validation/auth';

export type LoginResult =
  { ok: true; token: string; expiresAt: Date } | { ok: false; error: string };

/**
 * Thông báo lỗi login LUÔN generic ("Email hoặc mật khẩu không đúng") dù
 * nguyên nhân là email không tồn tại, chưa có credential, sai password,
 * hay account không ACTIVE — tránh lộ thông tin cho kẻ tấn công dò email
 * hợp lệ (Spec Section 19 tinh thần bảo mật, dù không nêu chi tiết).
 */
const GENERIC_LOGIN_ERROR = 'Email hoặc mật khẩu không đúng.';
const ACCOUNT_INACTIVE_ERROR = 'Tài khoản đã bị khoá hoặc ngừng hoạt động.';

export async function login(
  input: LoginInput,
  context: { ipAddress?: string | null; userAgent?: string | null },
): Promise<LoginResult> {
  const [employee] = await db
    .select()
    .from(employees)
    .where(eq(employees.email, input.email))
    .limit(1);

  if (!employee) {
    return { ok: false, error: GENERIC_LOGIN_ERROR };
  }

  const [credential] = await db
    .select()
    .from(credentials)
    .where(eq(credentials.employeeId, employee.id))
    .limit(1);

  if (!credential) {
    return { ok: false, error: GENERIC_LOGIN_ERROR };
  }

  const passwordValid = await verifyPassword(input.password, credential.passwordHash);
  if (!passwordValid) {
    return { ok: false, error: GENERIC_LOGIN_ERROR };
  }

  // Check account active SAU khi verify password thành công — tránh dùng
  // trạng thái active để timing-oracle cho việc dò email tồn tại.
  if (employee.status !== 'ACTIVE') {
    return { ok: false, error: ACCOUNT_INACTIVE_ERROR };
  }

  const session = await createSession({
    employeeId: employee.id,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return { ok: true, token: session.token, expiresAt: session.expiresAt };
}

export async function logout(token: string): Promise<void> {
  await revokeSession(token);
}
