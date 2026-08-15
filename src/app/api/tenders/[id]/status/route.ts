import { withAuth, ok, BAD_REQUEST, FORBIDDEN } from '@/lib/api/response';
import { transitionTenderStatus } from '@/lib/services/tender-service';
import { hasPermission } from '@/lib/authorization';
import { z } from 'zod';

const schema = z.object({
  newStatus: z.string().min(1),
  note: z.string().optional(),
});

export const POST = withAuth(async (req, { employee, params }) => {
  const allowed = await hasPermission(employee, 'TENDER_STATUS_UPDATE');
  if (!allowed) return FORBIDDEN();

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return BAD_REQUEST(parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ.');

  try {
    const updated = await transitionTenderStatus(
      params?.id ?? '',
      parsed.data.newStatus,
      employee,
      parsed.data.note,
    );
    return ok(updated);
  } catch (e: unknown) {
    return BAD_REQUEST(e instanceof Error ? e.message : 'Lỗi chuyển trạng thái.');
  }
});
