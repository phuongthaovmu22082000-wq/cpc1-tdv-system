import { AppShell } from '@/components/layout/app-shell';
import { requireAuth } from '@/lib/auth/current-user';
import { requirePermission } from '@/lib/authorization';
import { listSales } from '@/lib/services/sales-service';
import { DataTable } from '@/components/tables/data-table';
import { PageHeader, SearchBar } from '@/components/ui/shared';
import Link from 'next/link';

function formatVND(v: string) {
  const n = parseFloat(v);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} tr`;
  return n.toLocaleString('vi-VN');
}

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; customerId?: string }>;
}) {
  const employee = await requireAuth();
  await requirePermission(employee, 'SALES_VIEW');

  const { from, to, customerId } = await searchParams;
  const sales = await listSales(employee, { dateFrom: from, dateTo: to, customerId });

  return (
    <AppShell currentEmployee={employee}>
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Doanh số"
          description={`${sales.length} giao dịch`}
          action={{ label: '+ Nhập doanh số', href: '/sales/new' }}
        />
        <DataTable
          data={sales}
          emptyMessage="Chưa có giao dịch nào."
          columns={[
            { key: 'transactionDate', header: 'Ngày' },
            { key: 'customerName', header: 'Khách hàng' },
            { key: 'productName', header: 'Sản phẩm' },
            { key: 'employeeName', header: 'TDV' },
            { key: 'quantity', header: 'Số lượng', className: 'text-right' },
            {
              key: 'revenue',
              header: 'Doanh thu',
              className: 'text-right font-medium',
              render: (r) => formatVND(r.revenue),
            },
            { key: 'source', header: 'Nguồn' },
          ]}
        />
      </div>
    </AppShell>
  );
}
