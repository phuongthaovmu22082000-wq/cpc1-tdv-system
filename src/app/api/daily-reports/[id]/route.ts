import { withAuth, ok } from '@/lib/api/response';
import { submitDailyReport } from '@/lib/services/daily-report-service';

export const PATCH = withAuth(async (_req, { params }) => {
  const updated = await submitDailyReport(params?.id ?? '');
  return ok(updated);
});
