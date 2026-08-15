import { AppShell } from '@/components/layout/app-shell';
import { requireAuth } from '@/lib/auth/current-user';
import { listDailyReports } from '@/lib/services/daily-report-service';
import { DataTable } from '@/components/tables/data-table';
import { PageHeader, StatusBadge } from '@/components/ui/shared';

export default async function DailyReportsPage() {
  const employee = await requireAuth();
  const reports = await listDailyReports(employee);

  return (
    <AppShell currentEmployee={employee}>
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Báo cáo hằng ngày"
          description={`${reports.length} báo cáo`}
          action={{ label: '+ Tạo báo cáo hôm nay', href: '/daily-reports/new' }}
        />
        <DataTable
          data={reports}
          emptyMessage="Chưa có báo cáo nào."
          columns={[
            { key: 'reportDate', header: 'Ngày', className: 'font-medium' },
            { key: 'employeeName', header: 'TDV' },
            { key: 'visitsCount', header: 'Số lượt thăm', className: 'text-right' },
            {
              key: 'salesValue',
              header: 'Doanh số',
              className: 'text-right',
              render: (r) => {
                const n = parseFloat(r.salesValue);
                return isNaN(n) ? '—' : `${(n / 1_000_000).toFixed(1)} tr`;
              },
            },
            {
              key: 'status',
              header: 'Trạng thái',
              render: (r) => (
                <StatusBadge status={r.status === 'SUBMITTED' ? 'SUBMITTED' : 'DRAFT'} />
              ),
            },
            {
              key: 'submittedAt',
              header: 'Nộp lúc',
              render: (r) =>
                r.submittedAt ? new Date(r.submittedAt).toLocaleString('vi-VN') : '—',
            },
          ]}
        />
      </div>
    </AppShell>
  );
}
