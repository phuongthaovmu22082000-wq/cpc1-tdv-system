import { AppShell } from '@/components/layout/app-shell';
import { requireAuth } from '@/lib/auth/current-user';
import { requirePermission } from '@/lib/authorization';
import { listCustomers } from '@/lib/services/customer-service';
import { getLostSaleCustomers } from '@/lib/services/lost-sale-service';
import { DataTable } from '@/components/tables/data-table';
import { PageHeader, StatusBadge, SearchBar } from '@/components/ui/shared';
import Link from 'next/link';

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const employee = await requireAuth();
  await requirePermission(employee, 'CUSTOMER_VIEW');

  const { q, status } = await searchParams;
  const [customers, lostSales] = await Promise.all([
    listCustomers(employee, { search: q, status }),
    getLostSaleCustomers(employee),
  ]);
  const lostSaleIds = new Set(lostSales.map((ls) => ls.id));

  return (
    <AppShell currentEmployee={employee}>
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Đơn vị / Khách hàng"
          description={`${customers.length} khách hàng`}
          action={
            employee.roleCode !== 'TDV'
              ? { label: '+ Thêm khách hàng', href: '/customers/new' }
              : undefined
          }
        />
        <div className="flex gap-3">
          <SearchBar placeholder="Tìm theo tên, mã..." />
          <Link
            href={status === 'ACTIVE' ? '/customers' : '/customers?status=ACTIVE'}
            className={`rounded-md border px-3 py-2 text-sm ${status === 'ACTIVE' || !status ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
          >
            Đang hoạt động
          </Link>
          <Link
            href="/customers?status=INACTIVE"
            className={`rounded-md border px-3 py-2 text-sm ${status === 'INACTIVE' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
          >
            Ngừng HĐ
          </Link>
        </div>

        <DataTable
          data={customers}
          emptyMessage="Không có khách hàng nào trong scope của bạn."
          columns={[
            { key: 'customerCode', header: 'Mã', className: 'font-mono text-xs' },
            {
              key: 'name',
              header: 'Tên',
              render: (r) => (
                <Link
                  href={`/customers/${r.id}`}
                  className="font-medium text-slate-900 hover:underline"
                >
                  {r.name}
                </Link>
              ),
            },
            { key: 'customerTypeName', header: 'Loại' },
            { key: 'territoryName', header: 'Địa bàn' },
            {
              key: 'status',
              header: 'Trạng thái',
              render: (r) => <StatusBadge status={r.status} />,
            },
            {
              key: 'id',
              header: 'Lost Sale',
              render: (r) =>
                lostSaleIds.has(r.id) ? (
                  <span className="text-xs font-medium text-red-600">⚠ Lost Sale</span>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                ),
            },
          ]}
        />
      </div>
    </AppShell>
  );
}
