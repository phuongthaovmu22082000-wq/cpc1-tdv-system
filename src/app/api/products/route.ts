import { withAuth, ok, BAD_REQUEST, FORBIDDEN } from '@/lib/api/response';
import {
  listProducts,
  createProduct,
  getProductById,
  updateProduct,
} from '@/lib/services/product-service';
import { hasPermission } from '@/lib/authorization';
import { z } from 'zod';

const createSchema = z.object({
  productCode: z.string().min(1),
  productName: z.string().min(1),
  productGroupId: z.string().uuid(),
  dosageForm: z.string().min(1),
  strength: z.string().optional(),
  unit: z.string().min(1),
});

export const GET = withAuth(async (req, { employee: _ }) => {
  const url = new URL(req.url);
  const data = await listProducts({
    search: url.searchParams.get('q') ?? undefined,
    status: url.searchParams.get('status') ?? 'ACTIVE',
  });
  return ok(data);
});

export const POST = withAuth(async (req, { employee }) => {
  const allowed = await hasPermission(employee, 'PRODUCT_CREATE');
  if (!allowed) return FORBIDDEN();

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return BAD_REQUEST(parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ.');

  const product = await createProduct(parsed.data);
  return ok(product, 201);
});
