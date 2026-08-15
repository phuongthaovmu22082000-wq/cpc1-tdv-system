import { AppShell } from '@/components/layout/app-shell';
import { requireAuth } from '@/lib/auth/current-user';

/**
 * Protected route (TASK 003 acceptance criteria): chưa đăng nhập sẽ bị
 * redirect về /login bởi requireAuth(). Nội dung thật (KPI cards, charts,
 * Lost Sale view...) sẽ được triển khai ở TASK 014.
 */
export default async function DashboardPage() {
  const currentEmployee = await requireAuth();

  return (
    <AppShell currentEmployee={currentEmployee}>
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
        Dashboard sẽ được triển khai ở TASK 014.
      </div>
    </AppShell>
  );
}
