import { Activity, AlertOctagon, Clock, Gauge } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusPill } from "@/components/ui/status-pill";
import { Meter } from "@/components/ui/meter";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/table";
import { cn } from "@/lib/cn";
import { scraperFleet, queueStats } from "@/lib/mock-data";

const queueTiles = [
  { label: "Pending", value: queueStats.pending.toLocaleString(), icon: Clock, tone: "neutral" as const },
  { label: "Processing", value: queueStats.processing.toLocaleString(), icon: Activity, tone: "accent" as const },
  { label: "Failed (last hr)", value: queueStats.failedLastHour.toString(), icon: AlertOctagon, tone: "danger" as const },
  { label: "Avg latency", value: `${queueStats.avgLatencyMs}ms`, icon: Gauge, tone: "neutral" as const },
];

export default function ScraperFleetPage() {
  return (
    <div>
      <PageHeader
        title="Scraper Fleet Orchestration"
        description="Real-time worker health, proxy pool status, and queue throughput."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {queueTiles.map((t) => (
          <GlassCard key={t.label} className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] text-structure-muted">
                <t.icon className="h-4 w-4" />
              </div>
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  t.tone === "accent" && "bg-accent",
                  t.tone === "danger" && "bg-danger",
                  t.tone === "neutral" && "bg-structure-faint"
                )}
              />
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight">{t.value}</p>
            <p className="mt-1 text-xs text-structure-muted">{t.label}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="mt-6 overflow-hidden p-0">
        <Table>
          <Thead>
            <Th>Worker</Th>
            <Th>Region</Th>
            <Th>Status</Th>
            <Th>Success rate</Th>
            <Th>Jobs today</Th>
            <Th className="w-48">Proxy health</Th>
          </Thead>
          <tbody>
            {scraperFleet.map((w) => (
              <Tr key={w.id}>
                <Td className="font-mono text-xs">{w.id}</Td>
                <Td className="text-structure-muted">{w.region}</Td>
                <Td>
                  <StatusPill
                    tone={w.status === "running" ? "success" : w.status === "error" ? "danger" : "neutral"}
                  >
                    {w.status}
                  </StatusPill>
                </Td>
                <Td className="font-mono text-xs">{w.successRate}%</Td>
                <Td className="font-mono text-xs">{w.jobsToday.toLocaleString()}</Td>
                <Td>
                  <Meter
                    label=""
                    value={w.proxyHealth}
                    tone={w.proxyHealth > 80 ? "success" : w.proxyHealth > 50 ? "warning" : "danger"}
                  />
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </GlassCard>
    </div>
  );
}
