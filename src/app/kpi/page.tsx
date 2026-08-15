import { AppShell } from '@/components/layout/app-shell';
import { requireAuth } from '@/lib/auth/current-user';
import { requirePermission } from '@/lib/authorization';
import { getKpiSummary } from '@/lib/services/kpi-service';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/shared';

export default async function KpiPage() {
  const employee = await requireAuth();
  await requirePermission(employee, 'KPI_VIEW');

  const now = new Date();
  const periodStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .substring(0, 10);

  const kpis = await getKpiSummary(employee.id, periodStart, periodEnd);

  return (
    <AppShell currentEmployee={employee}>
      <div className="flex flex-col gap-6">
        <PageHeader title="KPI" description={`Kỳ ${periodStart} → ${periodEnd}`} />
        {kpis.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
            Chưa có chỉ tiêu KPI nào cho kỳ này.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {kpis.map((kpi) => {
              const achievement =
                kpi.achievementRate != null
                  ? Math.round(parseFloat(kpi.achievementRate) * 100)
                  : null;
              return (
                <div key={kpi.kpiCode} className="rounded-lg border border-slate-200 bg-white p-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {kpi.kpiName}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-semibold text-slate-700">
                        {parseFloat(kpi.targetValue).toLocaleString('vi-VN')}
                      </p>
                      <p className="text-xs text-slate-400">Chỉ tiêu</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-slate-700">
                        {kpi.actualValue != null
                          ? parseFloat(kpi.actualValue).toLocaleString('vi-VN')
                          : '—'}
                      </p>
                      <p className="text-xs text-slate-400">Thực tế</p>
                    </div>
                    <div>
                      <p
                        className={`text-lg font-semibold ${
                          achievement == null
                            ? 'text-slate-400'
                            : achievement >= 80
                              ? 'text-emerald-600'
                              : 'text-red-600'
                        }`}
                      >
                        {achievement != null ? `${achievement}%` : '—'}
                      </p>
                      <p className="text-xs text-slate-400">Đạt được</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
