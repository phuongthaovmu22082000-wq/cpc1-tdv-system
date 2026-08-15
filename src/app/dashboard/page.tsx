import { AppShell } from '@/components/layout/app-shell';
import { requireAuth } from '@/lib/auth/current-user';
import { StatCard } from '@/components/ui/stat-card';
import { loadDashboardData } from './data';

function formatVND(amount: number): string {
  if (amount >= 1_000_000_000)
    return `${(amount / 1_000_000_000).toFixed(1).replace(/\.0$/, '')} tỷ`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1).replace(/\.0$/, '')} tr`;
  return amount.toLocaleString('vi-VN');
}

/**
 * Dashboard — TASK 014
 * Server Component: requireAuth() + loadDashboardData() chạy song song
 * không cần client-side fetch.
 */
export default async function DashboardPage() {
  const currentEmployee = await requireAuth();
  const data = await loadDashboardData(currentEmployee);

  const cards = [
    {
      title: 'Doanh số tháng',
      value: formatVND(data.revenueThisMonth),
      sub: 'tháng hiện tại',
      highlight: 'neutral' as const,
    },
    {
      title: 'KPI Achievement',
      value: data.kpiAchievement !== null ? `${data.kpiAchievement}%` : '—',
      sub: data.kpiAchievement !== null ? 'so với chỉ tiêu tháng này' : 'Chưa có chỉ tiêu',
      highlight:
        data.kpiAchievement === null
          ? ('neutral' as const)
          : data.kpiAchievement >= 80
            ? ('ok' as const)
            : ('warn' as const),
    },
    {
      title: 'Kê đơn',
      value: String(data.prescriptionCount),
      sub: 'lượt trong tháng',
      highlight: 'neutral' as const,
    },
    {
      title: 'Active Customers',
      value: String(data.activeCustomerCount),
      sub: 'khách hàng đang hoạt động',
      highlight: 'neutral' as const,
    },
    {
      title: 'Lost Sale',
      value: String(data.lostSaleCount),
      sub: 'khách hàng không có doanh số ≥ 4 tháng',
      highlight: data.lostSaleCount > 0 ? ('warn' as const) : ('ok' as const),
    },
    {
      title: 'Thầu đang xử lý',
      value: String(data.activeTenderCount),
      sub: 'tender chưa kết thúc',
      highlight: 'neutral' as const,
    },
    {
      title: 'Báo cáo hôm nay',
      value: data.dailyReportSubmittedToday ? '✓ Đã nộp' : '✗ Chưa nộp',
      sub: data.dailyReportSubmittedToday ? 'đã submit' : 'cần nộp trước cuối ngày',
      highlight: data.dailyReportSubmittedToday ? ('ok' as const) : ('warn' as const),
    },
  ];

  return (
    <AppShell currentEmployee={currentEmployee}>
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Dashboard</h2>
          <p className="text-sm text-slate-500">
            Xin chào, {currentEmployee.fullName} — {currentEmployee.roleName}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
