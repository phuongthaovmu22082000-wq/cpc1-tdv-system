import { withAuth, ok, NOT_FOUND, BAD_REQUEST, FORBIDDEN } from '@/lib/api/response';
import { getCustomerById, updateCustomer } from '@/lib/services/customer-service';
import { canAccessCustomer, hasPermission } from '@/lib/authorization';

export const GET = withAuth(async (_req, { employee, params }) => {
  const id = params?.id ?? '';
  const customer = await getCustomerById(id);
  if (!customer) return NOT_FOUND('Khách hàng không tồn tại.');

  const allowed = await canAccessCustomer(employee, id);
  if (!allowed) return FORBIDDEN();

  return ok(customer);
});

export const PATCH = withAuth(async (req, { employee, params }) => {
  const id = params?.id ?? '';
  const allowed = await hasPermission(employee, 'CUSTOMER_UPDATE');
  if (!allowed) return FORBIDDEN();

  const body = await req.json();
  const updated = await updateCustomer(id, body);
  return ok(updated);
});
