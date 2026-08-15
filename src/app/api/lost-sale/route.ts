import { withAuth, ok } from '@/lib/api/response';
import { getLostSaleCustomers } from '@/lib/services/lost-sale-service';

export const GET = withAuth(async (_req, { employee }) => {
  const data = await getLostSaleCustomers(employee);
  return ok(data);
});
