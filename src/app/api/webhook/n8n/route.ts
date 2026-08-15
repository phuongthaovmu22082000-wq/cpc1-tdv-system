/**
 * Inbound webhook từ n8n → app — TASK 017
 * n8n gọi endpoint này để trigger server-side actions (tạo notification,
 * upsert KPI result, v.v.).
 *
 * Auth: kiểm tra X-Webhook-Secret header (shared secret, lưu trong
 * N8N_API_KEY). KHÔNG dùng session cookie — đây là machine-to-machine.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createNotification } from '@/lib/services/notification-service';
import { auditLog } from '@/lib/services/audit-service';

function verifySecret(req: NextRequest): boolean {
  const secret = process.env.N8N_API_KEY;
  if (!secret) return true; // dev mode — bỏ qua nếu chưa cấu hình
  return req.headers.get('x-webhook-secret') === secret;
}

export async function POST(req: NextRequest) {
  if (!verifySecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const action = body.action as string;

  try {
    switch (action) {
      case 'create_notification': {
        const n = body.notification as {
          employeeId: string;
          type: string;
          title: string;
          message: string;
          referenceType?: string;
          referenceId?: string;
        };
        const notification = await createNotification({
          employeeId: n.employeeId,
          type: n.type,
          title: n.title,
          message: n.message,
          referenceType: n.referenceType ?? null,
          referenceId: n.referenceId ?? null,
        });
        return NextResponse.json({ ok: true, id: notification.id });
      }

      case 'audit_log': {
        const a = body.auditData as {
          userId: string;
          action: string;
          entityType: string;
          entityId?: string;
        };
        await auditLog({
          userId: a.userId,
          action: a.action,
          entityType: a.entityType,
          entityId: a.entityId ?? null,
          ipAddress: 'n8n-automation',
        });
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    console.error('[webhook/n8n] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
