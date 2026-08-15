import { randomBytes, createHash } from 'crypto';
import { and, eq, isNull, gt } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { sessions } from '../../../db/schema';

export const SESSION_COOKIE_NAME = 'cpc1_session';
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 ngày

function hashToken(token: string): string {
  // Token gốc không được lưu trong DB (Spec Section 19) — chỉ lưu SHA-256
  // hash. Token đủ ngẫu nhiên (32 bytes) nên hash không cần salt riêng.
  return createHash('sha256').update(token).digest('hex');
}

function generateToken(): string {
  return randomBytes(32).toString('hex');
}

export interface CreateSessionInput {
  employeeId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Tạo session mới, trả về raw token để set vào cookie.
 * Raw token CHỈ tồn tại ở đây và ở cookie phía client — DB chỉ giữ hash.
 */
export async function createSession(input: CreateSessionInput): Promise<{
  token: string;
  expiresAt: Date;
}> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.insert(sessions).values({
    employeeId: input.employeeId,
    tokenHash,
    expiresAt,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
  });

  return { token, expiresAt };
}

/**
 * Tìm session hợp lệ theo raw token (chưa hết hạn, chưa bị revoke).
 * Trả về null nếu token không hợp lệ — caller (getCurrentEmployee) coi đây
 * là "chưa đăng nhập", KHÔNG được suy diễn thêm.
 */
export async function findValidSession(token: string) {
  const tokenHash = hashToken(token);

  const [session] = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return session ?? null;
}

/**
 * Thu hồi session (logout). Không hard-delete row — set revoked_at để giữ
 * lịch sử đăng nhập/đăng xuất (nhất quán với nguyên tắc không hard-delete
 * dữ liệu quan trọng, Build Plan Section 2.2 rule #6).
 */
export async function revokeSession(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.tokenHash, tokenHash));
}

/**
 * Thu hồi TẤT CẢ session của một employee (dùng khi đổi mật khẩu, khoá tài
 * khoản, hoặc admin ép logout).
 */
export async function revokeAllSessionsForEmployee(employeeId: string): Promise<void> {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.employeeId, employeeId), isNull(sessions.revokedAt)));
}
