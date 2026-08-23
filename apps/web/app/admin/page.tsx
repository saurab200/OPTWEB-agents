import { AlertTriangle, Clock, ListChecks, Server } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusPill } from "@/components/ui/status-pill";
import { scraperFleet, qaQueue, queueStats, tenants } from "@/lib/mock-data";

const stats = [
  { label: "Workers running", value: scraperFleet.filter((w) => w.status === "running").length, icon: Server },
  { label: "Queue pending", value: queueStats.pending.toLocaleString(), icon: Clock },
  { label: "Flagged for review", value: qaQueue.length, icon: ListChecks },
  { label: "Tenants past due", value: tenants.filter((t) => t.status === "past_due").length, icon: AlertTriangle },
];

export default function AdminOverviewPage() {
  return (
    <div>
      <PageHeader
        title="Ops overview"
        description="Fleet health, pipeline queue, and QA backlog at a glance."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <GlassCard key={s.label} className="p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <s.icon className="h-4 w-4" />
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight">{s.value}</p>
            <p className="mt-1 text-xs text-structure-muted">{s.label}</p>
          </GlassCard>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GlassCard className="p-6">
          <h2 className="text-sm font-semibold">Fleet status</h2>
          <ul className="mt-4 space-y-3">
            {scraperFleet.map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs text-structure">{w.id}</p>
                  <p className="text-xs text-structure-faint">{w.region}</p>
                </div>
                <StatusPill
                  tone={w.status === "running" ? "success" : w.status === "error" ? "danger" : "neutral"}
                >
                  {w.status}
                </StatusPill>
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-sm font-semibold">Needs review</h2>
          <ul className="mt-4 space-y-3">
            {qaQueue.map((q) => (
              <li key={q.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-structure">{q.business_name}</p>
                  <p className="truncate text-xs text-structure-faint">{q.issue}</p>
                </div>
                <span className="shrink-0 font-mono text-xs text-warning">
                  {Math.round(q.confidence * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}
