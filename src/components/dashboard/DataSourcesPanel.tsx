import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { Table, Td, Th } from "@/components/ui/Table";
import type { AnalysisSource } from "@/types/analysis";

export function DataSourcesPanel({ sources }: { sources: AnalysisSource[] }) {
  return (
    <Card>
      <CardHeader title="Sumber Data dan Jumlah Analisa" />
      <Table>
        <thead>
          <tr>
            <Th>Data</Th>
            <Th>Provider</Th>
            <Th>Status</Th>
            <Th>Jumlah</Th>
            <Th>Catatan</Th>
          </tr>
        </thead>
        <tbody>
          {sources.map((source) => (
            <tr key={source.name}>
              <Td>{source.name}</Td>
              <Td>{source.provider}</Td>
              <Td>
                <Badge tone={source.status === "REAL" ? "green" : source.status === "FALLBACK" ? "yellow" : "gray"}>
                  {source.status === "REAL" ? "REAL" : source.status === "FALLBACK" ? "CADANGAN" : "NONAKTIF"}
                </Badge>
              </Td>
              <Td>{source.analyzedCount.toLocaleString()}</Td>
              <Td>{source.note}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}
