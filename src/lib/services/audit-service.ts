/**
 * Audit Logger — TASK 018
 * Spec Section 8.21, DB Rule #7: KHÔNG hard-delete audit logs.
 * Bảng này chỉ INSERT — không có hàm update/delete ở đây.
 * Spec Section 19: KHÔNG log password, token, secret.
 */
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { auditLogs } from '../../../db/schema';

export interface AuditInput {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldData?: object | null;
  newData?: object | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Ghi audit log. Tự động lọc field nhạy cảm khỏi oldData/newData.
 */
const SENSITIVE_FIELDS = ['passwordHash', 'password', 'token', 'tokenHash', 'secret'];

function sanitize(data: object | null | undefined): object | null {
  if (!data) return null;
  const result = { ...(data as Record<string, unknown>) };
  for (const key of SENSITIVE_FIELDS) {
    if (key in result) result[key] = '[REDACTED]';
  }
  return result;
}

export async function auditLog(input: AuditInput): Promise<void> {
  await db.insert(auditLogs).values({
    userId: input.userId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    oldData: sanitize(input.oldData) as object,
    newData: sanitize(input.newData) as object,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
  });
}

export async function getAuditLogs(opts: {
  entityType?: string;
  entityId?: string;
  userId?: string;
  limit?: number;
}) {
  const rows = await db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(opts.limit ?? 100);

  return rows.filter((r) => {
    if (opts.userId && r.userId !== opts.userId) return false;
    if (opts.entityType && r.entityType !== opts.entityType) return false;
    if (opts.entityId && r.entityId !== opts.entityId) return false;
    return true;
  });
}
