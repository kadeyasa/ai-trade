import { cn } from "@/lib/utils";

export function StatBox({
  label,
  value,
  detail,
  icon,
  className
}: {
  label: string;
  value: string;
  detail?: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-md border border-slate-200 bg-slate-50 p-4", className)}>
      <div className="flex items-center justify-between gap-3 text-xs font-medium uppercase tracking-wide text-slate-500">
        <span>{label}</span>
        {icon ? <span className="text-slate-400">{icon}</span> : null}
      </div>
      <div className="mt-2 text-2xl font-semibold text-ink">{value}</div>
      {detail ? <div className="mt-1 text-sm text-slate-500">{detail}</div> : null}
    </div>
  );
}
