interface StatCardProps {
  title: string;
  value: string;
  sub?: string;
  highlight?: 'warn' | 'ok' | 'neutral';
}

export function StatCard({ title, value, sub, highlight = 'neutral' }: StatCardProps) {
  const valueColor =
    highlight === 'warn'
      ? 'text-red-600'
      : highlight === 'ok'
        ? 'text-emerald-600'
        : 'text-slate-900';

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
      <p className={`text-2xl font-semibold ${valueColor}`}>{value}</p>
      {sub ? <p className="text-xs text-slate-400">{sub}</p> : null}
    </div>
  );
}
