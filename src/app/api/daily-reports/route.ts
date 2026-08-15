import { withAuth, ok, BAD_REQUEST } from '@/lib/api/response';
import {
  listDailyReports,
  upsertDailyReport,
  submitDailyReport,
} from '@/lib/services/daily-report-service';
import { z } from 'zod';

const upsertSchema = z.object({
  reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  visitsCount: z.number().int().min(0).optional(),
  newCustomersCount: z.number().int().min(0).optional(),
  salesValue: z.string().optional(),
  prescriptionCount: z.number().int().min(0).optional(),
  tenderActivity: z.string().optional(),
  summary: z.string().optional(),
});

export const GET = withAuth(async (_req, { employee }) => {
  const data = await listDailyReports(employee);
  return ok(data);
});

export const POST = withAuth(async (req, { employee }) => {
  const body = await req.json();
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success)
    return BAD_REQUEST(parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ.');

  const report = await upsertDailyReport(employee, parsed.data);
  return ok(report, 201);
});
