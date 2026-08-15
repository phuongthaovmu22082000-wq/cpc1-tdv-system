import { withAuth, ok, BAD_REQUEST } from '@/lib/api/response';
import { listCustomers, createCustomer } from '@/lib/services/customer-service';
import { hasPermission } from '@/lib/authorization';
import { z } from 'zod';

export const GET = withAuth(async (req, { employee }) => {
  const url = new URL(req.url);
  const search = url.searchParams.get('q') ?? undefined;
  const territoryId = url.searchParams.get('territoryId') ?? undefined;
  const status = url.searchParams.get('status') ?? undefined;

  const data = await listCustomers(employee, { search, territoryId, status });
  return ok(data);
});

const createSchema = z.object({
  customerCode: z.string().min(1),
  customerTypeId: z.string().uuid(),
  name: z.string().min(1),
  address: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  territoryId: z.string().uuid(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
});

export const POST = withAuth(async (req, { employee }) => {
  const allowed = await hasPermission(employee, 'CUSTOMER_CREATE');
  if (!allowed) return BAD_REQUEST('Không có quyền tạo khách hàng.');

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return BAD_REQUEST(parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ.');

  const customer = await createCustomer(parsed.data);
  return ok(customer, 201);
});
