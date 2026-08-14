import Link from 'next/link';

/**
 * Điều hướng chính của hệ thống.
 * Danh sách module bám theo Spec Section 5 (Project Structure).
 *
 * LƯU Ý: Đây là navigation tĩnh cho TASK 001 (Initialize Project).
 * Việc ẩn/hiện theo Role & Permission sẽ được xử lý ở TASK 004 (RBAC)
 * thông qua lib/authorization — KHÔNG tự ý coi navigation này là
 * authorization thật.
 */
const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/customers', label: 'Đơn vị/Khách hàng' },
  { href: '/products', label: 'Sản phẩm' },
  { href: '/sales', label: 'Doanh số' },
  { href: '/prescriptions', label: 'Kê đơn' },
  { href: '/tenders', label: 'Thầu' },
  { href: '/kpi', label: 'KPI' },
  { href: '/daily-reports', label: 'Báo cáo hằng ngày' },
  { href: '/employees', label: 'Nhân sự' },
  { href: '/territories', label: 'Địa bàn' },
  { href: '/notifications', label: 'Thông báo' },
  { href: '/audit-logs', label: 'Nhật ký hệ thống' },
] as const;

export function Sidebar() {
  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white">
      <div className="flex h-14 items-center border-b border-slate-200 px-4">
        <span className="text-sm font-semibold tracking-wide text-slate-900">
          CPC1 &middot; TDV
        </span>
      </div>
      <nav className="flex flex-col gap-0.5 p-2">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
