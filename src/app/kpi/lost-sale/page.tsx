import { AppShell } from '@/components/layout/app-shell';
import { requireAuth } from '@/lib/auth/current-user';
import { requirePermission } from '@/lib/authorization';
import { getLostSaleCustomers, getLostSaleBoundaryDate } from '@/lib/services/lost-sale-service';
import { DataTable } from '@/components/tables/data-table';
import { PageHeader } from '@/components/ui/shared';

export default async function LostSalePage() {
  const employee = await requireAuth();
  await requirePermission(employee, 'CUSTOMER_VIEW');

  const lostSales = await getLostSaleCustomers(employee);
  const boundary = getLostSaleBoundaryDate();

  return (
    <AppShell currentEmployee={employee}>
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Lost Sale"
          description={`${lostSales.length} khách hàng không có doanh số từ ${boundary} đến nay (≥ 4 tháng lịch)`}
        />
        {lostSales.length > 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            ⚠ Các khách hàng dưới đây chưa phát sinh doanh số trong ít nhất 4 tháng lịch liên tiếp.
            Cần liên hệ và xác nhận tình trạng hợp tác.
          </div>
        )}
        <DataTable
          data={lostSales}
          emptyMessage="Không có khách hàng Lost Sale nào. Tốt lắm!"
          columns={[
            { key: 'customerCode', header: 'Mã', className: 'font-mono text-xs' },
            { key: 'name', header: 'Khách hàng', className: 'font-medium' },
            { key: 'customerTypeName', header: 'Loại' },
            { key: 'territoryName', header: 'Địa bàn' },
            {
              key: 'lastSaleDate',
              header: 'Doanh số cuối',
              render: (r) => r.lastSaleDate ?? 'Chưa có lần nào',
            },
            {
              key: 'monthsSinceLastSale',
              header: 'Số tháng trống',
              className: 'text-right font-medium text-red-600',
              render: (r) =>
                r.monthsSinceLastSale != null ? `${r.monthsSinceLastSale} tháng` : '—',
            },
          ]}
        />
      </div>
    </AppShell>
  );
}
