import { withAuth, ok, BAD_REQUEST, FORBIDDEN } from '@/lib/api/response';
import {
  listTenders,
  createTender,
  getTenderById,
  transitionTenderStatus,
} from '@/lib/services/tender-service';
import { hasPermission } from '@/lib/authorization';
import { z } from 'zod';

const createSchema = z.object({
  customerId: z.string().uuid(),
  tenderCode: z.string().min(1),
  tenderName: z.string().min(1),
  description: z.string().optional(),
  expectedValue: z.string().optional(),
  startDate: z.string().optional(),
  submissionDate: z.string().optional(),
  note: z.string().optional(),
});

export const GET = withAuth(async (_req, { employee }) => {
  const data = await listTenders(employee);
  return ok(data);
});

export const POST = withAuth(async (req, { employee }) => {
  const allowed = await hasPermission(employee, 'TENDER_CREATE');
  if (!allowed) return FORBIDDEN();

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return BAD_REQUEST(parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ.');

  try {
    const tender = await createTender(employee, parsed.data);
    return ok(tender, 201);
  } catch (e: unknown) {
    return BAD_REQUEST(e instanceof Error ? e.message : 'Lỗi tạo thầu.');
  }
});
