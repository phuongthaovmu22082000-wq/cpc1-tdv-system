import { AppShell } from '@/components/layout/app-shell';
import { requireAuth } from '@/lib/auth/current-user';
import { requirePermission } from '@/lib/authorization';
import { listTenders } from '@/lib/services/tender-service';
import { DataTable } from '@/components/tables/data-table';
import { PageHeader, StatusBadge } from '@/components/ui/shared';
import Link from 'next/link';

function formatVND(v: string | null) {
  if (!v) return '—';
  const n = parseFloat(v);
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} tỷ`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)} tr`;
  return n.toLocaleString('vi-VN');
}

export default async function TendersPage() {
  const employee = await requireAuth();
  await requirePermission(employee, 'TENDER_VIEW');

  const tenders = await listTenders(employee);

  return (
    <AppShell currentEmployee={employee}>
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Thầu"
          description={`${tenders.length} hồ sơ thầu`}
          action={{ label: '+ Tạo thầu', href: '/tenders/new' }}
        />
        <DataTable
          data={tenders}
          emptyMessage="Chưa có thầu nào."
          columns={[
            {
              key: 'tenderCode',
              header: 'Mã',
              render: (r) => (
                <Link
                  href={`/tenders/${r.id}`}
                  className="font-mono text-xs text-blue-600 hover:underline"
                >
                  {r.tenderCode}
                </Link>
              ),
            },
            { key: 'tenderName', header: 'Tên thầu', className: 'max-w-xs truncate' },
            { key: 'customerName', header: 'Khách hàng' },
            { key: 'employeeName', header: 'Phụ trách' },
            {
              key: 'status',
              header: 'Trạng thái',
              render: (r) => <StatusBadge status={r.status} />,
            },
            {
              key: 'expectedValue',
              header: 'Giá trị dự kiến',
              className: 'text-right',
              render: (r) => formatVND(r.expectedValue),
            },
            { key: 'submissionDate', header: 'Ngày nộp', render: (r) => r.submissionDate ?? '—' },
          ]}
        />
      </div>
    </AppShell>
  );
}
