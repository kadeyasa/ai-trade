import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import type { ComprehensiveAnalysis } from "@/types/analysis";

export function ComprehensiveAnalysisPanel({ analysis }: { analysis: ComprehensiveAnalysis }) {
  return (
    <Card>
      <CardHeader
        title="AI Comprehensive Analysis"
        action={<Badge tone={analysis.method === "OPENAI" ? "green" : "yellow"}>{analysis.method === "OPENAI" ? "OPENAI" : "HEURISTIC"}</Badge>}
      />
      {analysis.method !== "OPENAI" ? (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
          OpenAI belum aktif atau request AI gagal. Analisa di bawah memakai heuristic lokal berbasis market, sentiment, news, dan risk score.
          Isi `OPENAI API Key` di halaman Admin agar panel ini memakai analisa AI.
        </div>
      ) : null}
      <p className="text-sm leading-6 text-slate-700">{analysis.summary}</p>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="rounded-md border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-ink">Peluang</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            {analysis.opportunities.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div className="rounded-md border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-ink">Risiko</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            {analysis.risks.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div className="rounded-md border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-ink">Pantauan Berikutnya</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            {analysis.nextWatchItems.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </div>
    </Card>
  );
}
