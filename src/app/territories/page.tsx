import { AppShell } from '@/components/layout/app-shell';
import { requireAuth } from '@/lib/auth/current-user';
import { requirePermission } from '@/lib/authorization';
import { getTerritoriesInScope } from '@/lib/services/territory-scope';
import { DataTable } from '@/components/tables/data-table';
import { PageHeader, StatusBadge } from '@/components/ui/shared';

export default async function TerritoriesPage() {
  const employee = await requireAuth();
  await requirePermission(employee, 'TERRITORY_VIEW');

  const territories = await getTerritoriesInScope(employee);

  return (
    <AppShell currentEmployee={employee}>
      <div className="flex flex-col gap-4">
        <PageHeader title="Địa bàn" description={`${territories.length} địa bàn`} />
        <DataTable
          data={territories}
          emptyMessage="Chưa có địa bàn nào."
          columns={[
            { key: 'code', header: 'Mã', className: 'font-mono font-medium' },
            { key: 'name', header: 'Tên địa bàn' },
            { key: 'province', header: 'Tỉnh/Thành phố', render: (r) => r.province ?? '—' },
            {
              key: 'status',
              header: 'Trạng thái',
              render: (r) => <StatusBadge status={r.status} />,
            },
          ]}
        />
      </div>
    </AppShell>
  );
}
