import { withAuth, ok, BAD_REQUEST, FORBIDDEN } from '@/lib/api/response';
import { listSales, createSale } from '@/lib/services/sales-service';
import { hasPermission } from '@/lib/authorization';
import { z } from 'zod';

const createSchema = z.object({
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  customerId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.string().refine((v) => parseFloat(v) > 0, 'Số lượng phải lớn hơn 0'),
  unitPrice: z.string().refine((v) => parseFloat(v) >= 0, 'Đơn giá không hợp lệ'),
  source: z.string().min(1),
  note: z.string().optional(),
});

export const GET = withAuth(async (req, { employee }) => {
  const url = new URL(req.url);
  const data = await listSales(employee, {
    dateFrom: url.searchParams.get('from') ?? undefined,
    dateTo: url.searchParams.get('to') ?? undefined,
    customerId: url.searchParams.get('customerId') ?? undefined,
  });
  return ok(data);
});

export const POST = withAuth(async (req, { employee }) => {
  const allowed = await hasPermission(employee, 'SALES_CREATE');
  if (!allowed) return FORBIDDEN();

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return BAD_REQUEST(parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ.');

  try {
    const sale = await createSale(employee, parsed.data);
    return ok(sale, 201);
  } catch (e: unknown) {
    return BAD_REQUEST(e instanceof Error ? e.message : 'Lỗi tạo giao dịch.');
  }
});
