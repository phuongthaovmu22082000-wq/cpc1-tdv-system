import type { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import type { CurrentEmployee } from '@/lib/auth/current-user';

export function AppShell({
  children,
  currentEmployee,
}: {
  children: ReactNode;
  currentEmployee: CurrentEmployee;
}) {
  return (
    <div className="flex h-full min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar currentEmployee={currentEmployee} />
        <main className="flex-1 bg-slate-50 p-6">{children}</main>
      </div>
    </div>
  );
}
