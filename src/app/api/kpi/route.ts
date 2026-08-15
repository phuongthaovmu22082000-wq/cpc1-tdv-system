import { withAuth, ok } from '@/lib/api/response';
import { getKpiSummary } from '@/lib/services/kpi-service';

export const GET = withAuth(async (req, { employee }) => {
  const url = new URL(req.url);
  const now = new Date();
  const defaultStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .substring(0, 10);

  const data = await getKpiSummary(
    url.searchParams.get('employeeId') ?? employee.id,
    url.searchParams.get('from') ?? defaultStart,
    url.searchParams.get('to') ?? defaultEnd,
  );
  return ok(data);
});
