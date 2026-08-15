import { logoutAction } from '@/app/login/actions';
import type { CurrentEmployee } from '@/lib/auth/current-user';

/**
 * Thanh trên cùng — hiển thị current user (TASK 003) và sẽ có notification
 * bell (TASK 016).
 */
export function Topbar({ currentEmployee }: { currentEmployee: CurrentEmployee }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
      <h1 className="text-sm font-medium text-slate-500">
        Hệ thống Quản lý Trình Dược Viên — CPC1 Hà Nội
      </h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-600">
          {currentEmployee.fullName}{' '}
          <span className="text-slate-400">({currentEmployee.roleName})</span>
        </span>
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-sm text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
          >
            Đăng xuất
          </button>
        </form>
      </div>
    </header>
  );
}
