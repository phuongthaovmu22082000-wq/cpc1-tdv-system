import { AppShell } from '@/components/layout/app-shell';
import { requireAuth } from '@/lib/auth/current-user';
import { requirePermission } from '@/lib/authorization';
import { listProducts } from '@/lib/services/product-service';
import { DataTable } from '@/components/tables/data-table';
import { PageHeader, StatusBadge, SearchBar } from '@/components/ui/shared';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const employee = await requireAuth();
  await requirePermission(employee, 'PRODUCT_VIEW');

  const { q, status } = await searchParams;
  const products = await listProducts({ search: q, status: status ?? 'ACTIVE' });

  return (
    <AppShell currentEmployee={employee}>
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Sản phẩm"
          description={`${products.length} sản phẩm`}
          action={
            ['ADMIN', 'MANAGER'].includes(employee.roleCode)
              ? { label: '+ Thêm sản phẩm', href: '/products/new' }
              : undefined
          }
        />
        <SearchBar placeholder="Tìm theo tên, mã sản phẩm..." />
        <DataTable
          data={products}
          emptyMessage="Chưa có sản phẩm nào."
          columns={[
            { key: 'productCode', header: 'Mã', className: 'font-mono text-xs' },
            { key: 'productName', header: 'Tên sản phẩm', className: 'font-medium' },
            { key: 'groupName', header: 'Nhóm' },
            { key: 'dosageForm', header: 'Dạng bào chế' },
            { key: 'strength', header: 'Hàm lượng' },
            { key: 'unit', header: 'Đơn vị' },
            {
              key: 'status',
              header: 'TT',
              render: (r) => <StatusBadge status={r.status} />,
            },
          ]}
        />
      </div>
    </AppShell>
  );
}
