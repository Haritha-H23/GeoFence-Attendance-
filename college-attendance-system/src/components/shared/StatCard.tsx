interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  trend?: { value: number; label: string };
}

export default function StatCard({ title, value, icon, color, subtitle, trend }: StatCardProps) {
  return (
    <div className="group rounded-[22px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(37,99,235,0.12)]">
      <div className="mb-5 flex items-center justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color}`}>
          {icon}
        </div>
        {trend && (
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            trend.value >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
          }`}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-[28px] font-bold leading-none tracking-[-0.04em] text-slate-900">{value}</p>
        <p className="text-sm font-medium text-slate-600">{title}</p>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}
