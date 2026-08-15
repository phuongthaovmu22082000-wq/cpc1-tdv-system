import { withAuth, ok, NOT_FOUND, FORBIDDEN } from '@/lib/api/response';
import { getProductById, updateProduct } from '@/lib/services/product-service';
import { hasPermission } from '@/lib/authorization';

export const GET = withAuth(async (_req, { params }) => {
  const product = await getProductById(params?.id ?? '');
  if (!product) return NOT_FOUND('Sản phẩm không tồn tại.');
  return ok(product);
});

export const PATCH = withAuth(async (req, { employee, params }) => {
  const allowed = await hasPermission(employee, 'PRODUCT_UPDATE');
  if (!allowed) return FORBIDDEN();
  const body = await req.json();
  const updated = await updateProduct(params?.id ?? '', body);
  return ok(updated);
});
