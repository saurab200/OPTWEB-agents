import { ArrowUpRight, Database, KeyRound, Zap } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { Meter } from "@/components/ui/meter";
import { StatusPill } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { apiKeys, dataRecords, usageMetrics } from "@/lib/mock-data";

const stats = [
  {
    label: "Rows delivered (mo)",
    value: usageMetrics.rowsDelivered.toLocaleString(),
    icon: Database,
    delta: "+12.4%",
  },
  {
    label: "API requests (mo)",
    value: usageMetrics.apiRequests.toLocaleString(),
    icon: Zap,
    delta: "+8.1%",
  },
  {
    label: "Active API keys",
    value: apiKeys.filter((k) => k.status === "active").length.toString(),
    icon: KeyRound,
    delta: null,
  },
];

export default function PortalOverviewPage() {
  return (
    <div>
      <PageHeader
        title="Overview"
        description="Northwind Retail Co. · Growth plan · renews Sep 1, 2026"
        actions={<Button href="/portal/data" size="sm">Query data</Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <GlassCard key={s.label} className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <s.icon className="h-4 w-4" />
              </div>
              {s.delta && (
                <span className="flex items-center gap-0.5 text-xs text-success">
                  <ArrowUpRight className="h-3 w-3" />
                  {s.delta}
                </span>
              )}
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight">{s.value}</p>
            <p className="mt-1 text-xs text-structure-muted">{s.label}</p>
          </GlassCard>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <GlassCard className="p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold">Plan usage</h2>
          <div className="mt-5 space-y-5">
            <Meter
              label="Credits"
              value={usageMetrics.creditsUsed}
              max={usageMetrics.creditsLimit}
              sublabel={`${usageMetrics.creditsUsed.toLocaleString()} / ${usageMetrics.creditsLimit.toLocaleString()}`}
            />
            <Meter
              label="API requests"
              value={usageMetrics.apiRequests}
              max={usageMetrics.apiRequestsLimit}
              tone="success"
              sublabel={`${usageMetrics.apiRequests.toLocaleString()} / ${usageMetrics.apiRequestsLimit.toLocaleString()}`}
            />
            <Meter
              label="Rows delivered"
              value={usageMetrics.rowsDelivered}
              max={usageMetrics.rowsLimit}
              tone="warning"
              sublabel={`${usageMetrics.rowsDelivered.toLocaleString()} / ${usageMetrics.rowsLimit.toLocaleString()}`}
            />
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-sm font-semibold">Recently refreshed</h2>
          <ul className="mt-4 space-y-4">
            {dataRecords.slice(0, 4).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-structure">{r.business_name}</p>
                  <p className="text-xs text-structure-faint">{r.city}, {r.region}</p>
                </div>
                <StatusPill tone="success" dot={false}>
                  {Math.round(r.extraction_confidence * 100)}%
                </StatusPill>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}
