import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { AlertView } from "@/types/prediction";

export function AlertsPanel({ alerts }: { alerts: AlertView[] }) {
  return (
    <Card>
      <CardHeader title="Alerts" />
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div key={`${alert.type}-${alert.title}`} className="rounded-md border border-slate-200 p-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-ink">{alert.title}</h3>
              <Badge tone={alert.severity === "LOW" ? "green" : alert.severity === "MEDIUM" ? "yellow" : "red"}>{alert.severity}</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-600">{alert.message}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
