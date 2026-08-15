import { AppShell } from '@/components/layout/app-shell';
import { requireAuth } from '@/lib/auth/current-user';
import { requirePermission } from '@/lib/authorization';
import { listPrescriptions } from '@/lib/services/prescription-service';
import { DataTable } from '@/components/tables/data-table';
import { PageHeader } from '@/components/ui/shared';

export default async function PrescriptionsPage() {
  const employee = await requireAuth();
  await requirePermission(employee, 'PRESCRIPTION_VIEW');
  const prescriptions = await listPrescriptions(employee);

  return (
    <AppShell currentEmployee={employee}>
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Kê đơn"
          description={`${prescriptions.length} báo cáo kê đơn`}
          action={{ label: '+ Nhập kê đơn', href: '/prescriptions/new' }}
        />
        <DataTable
          data={prescriptions}
          emptyMessage="Chưa có kê đơn nào."
          columns={[
            { key: 'reportDate', header: 'Ngày' },
            { key: 'employeeName', header: 'TDV' },
            { key: 'customerName', header: 'Khách hàng' },
            { key: 'doctorName', header: 'Bác sĩ', render: (r) => r.doctorName ?? '—' },
          ]}
        />
      </div>
    </AppShell>
  );
}
