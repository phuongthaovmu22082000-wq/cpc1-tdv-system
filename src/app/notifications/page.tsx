import { AppShell } from '@/components/layout/app-shell';
import { requireAuth } from '@/lib/auth/current-user';
import { getAllNotifications } from '@/lib/services/notification-service';
import { PageHeader } from '@/components/ui/shared';

export default async function NotificationsPage() {
  const employee = await requireAuth();
  const notifications = await getAllNotifications(employee.id);

  return (
    <AppShell currentEmployee={employee}>
      <div className="flex flex-col gap-4">
        <PageHeader title="Thông báo" description={`${notifications.length} thông báo`} />
        {notifications.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
            Không có thông báo nào.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`rounded-lg border p-4 ${n.readAt ? 'border-slate-200 bg-white' : 'border-blue-200 bg-blue-50'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{n.title}</p>
                    <p className="mt-0.5 text-sm text-slate-600">{n.message}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">
                    {new Date(n.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>
                {!n.readAt && (
                  <span className="mt-1 inline-block rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
                    Mới
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
