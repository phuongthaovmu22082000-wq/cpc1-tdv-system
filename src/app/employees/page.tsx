import { AppShell } from '@/components/layout/app-shell';
import { requireAuth } from '@/lib/auth/current-user';
import { requirePermission } from '@/lib/authorization';
import { listEmployees } from '@/lib/services/employee-service';
import { DataTable } from '@/components/tables/data-table';
import { PageHeader, StatusBadge, SearchBar } from '@/components/ui/shared';

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const employee = await requireAuth();
  await requirePermission(employee, 'EMPLOYEE_VIEW');

  const { q } = await searchParams;
  const employees = await listEmployees(employee, { search: q });

  return (
    <AppShell currentEmployee={employee}>
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Nhân sự"
          description={`${employees.length} nhân viên`}
          action={
            employee.roleCode === 'ADMIN'
              ? { label: '+ Thêm nhân viên', href: '/employees/new' }
              : undefined
          }
        />
        <SearchBar placeholder="Tìm theo tên, mã, email..." />
        <DataTable
          data={employees}
          emptyMessage="Không có nhân viên nào trong scope."
          columns={[
            { key: 'employeeCode', header: 'Mã NV', className: 'font-mono text-xs' },
            { key: 'fullName', header: 'Họ tên', className: 'font-medium' },
            { key: 'email', header: 'Email' },
            { key: 'roleName', header: 'Vai trò' },
            { key: 'phone', header: 'SĐT', render: (r) => r.phone ?? '—' },
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
