/**
 * Thanh trên cùng — sẽ hiển thị current user (từ TASK 003 Authentication)
 * và notification bell (TASK 016). Ở TASK 001 chỉ là khung tĩnh.
 */
export function Topbar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
      <h1 className="text-sm font-medium text-slate-500">
        Hệ thống Quản lý Trình Dược Viên — CPC1 Hà Nội
      </h1>
      <div className="text-sm text-slate-400">Chưa đăng nhập</div>
    </header>
  );
}
