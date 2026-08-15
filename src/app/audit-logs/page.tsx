import { AppShell } from '@/components/layout/app-shell';
import { requireAuth } from '@/lib/auth/current-user';
import { requirePermission } from '@/lib/authorization';
import { getAuditLogs } from '@/lib/services/audit-service';
import { DataTable } from '@/components/tables/data-table';
import { PageHeader } from '@/components/ui/shared';

export default async function AuditLogsPage() {
  const employee = await requireAuth();
  await requirePermission(employee, 'AUDIT_VIEW');

  const logs = await getAuditLogs({ limit: 200 });

  return (
    <AppShell currentEmployee={employee}>
      <div className="flex flex-col gap-4">
        <PageHeader title="Nhật ký hệ thống" description={`${logs.length} bản ghi gần nhất`} />
        <DataTable
          data={logs}
          emptyMessage="Chưa có log nào."
          columns={[
            {
              key: 'createdAt',
              header: 'Thời gian',
              render: (r) => new Date(r.createdAt).toLocaleString('vi-VN'),
            },
            { key: 'action', header: 'Hành động', className: 'font-mono text-xs' },
            { key: 'entityType', header: 'Đối tượng' },
            {
              key: 'entityId',
              header: 'ID',
              className: 'font-mono text-xs',
              render: (r) => (r.entityId ? r.entityId.substring(0, 8) + '...' : '—'),
            },
            { key: 'ipAddress', header: 'IP', render: (r) => r.ipAddress ?? '—' },
          ]}
        />
      </div>
    </AppShell>
  );
}
