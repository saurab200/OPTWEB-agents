import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { Meter } from "@/components/ui/meter";
import { Button } from "@/components/ui/button";
import { usageMetrics } from "@/lib/mock-data";

export default function UsageBillingPage() {
  const max = Math.max(...usageMetrics.dailyRequests);

  return (
    <div>
      <PageHeader
        title="Usage & Billing"
        description={`${usageMetrics.plan} plan · renews ${usageMetrics.renewsOn}`}
        actions={
          <Button variant="secondary" size="sm">
            Manage billing
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <GlassCard className="p-6 lg:col-span-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Requests, last 14 days</h2>
            <span className="font-mono text-xs text-structure-faint">
              {usageMetrics.dailyRequests.at(-1)} today
            </span>
          </div>
          <div className="mt-6 flex h-40 items-end gap-2">
            {usageMetrics.dailyRequests.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-accent/40 to-accent transition-all"
                  style={{ height: `${(v / max) * 100}%`, minHeight: 4 }}
                />
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-sm font-semibold">Plan limits</h2>
          <div className="mt-5 space-y-5">
            <Meter
              label="Credits"
              value={usageMetrics.creditsUsed}
              max={usageMetrics.creditsLimit}
              sublabel={`${Math.round((usageMetrics.creditsUsed / usageMetrics.creditsLimit) * 100)}%`}
            />
            <Meter
              label="API requests"
              value={usageMetrics.apiRequests}
              max={usageMetrics.apiRequestsLimit}
              tone="success"
              sublabel={`${Math.round((usageMetrics.apiRequests / usageMetrics.apiRequestsLimit) * 100)}%`}
            />
            <Meter
              label="Rows delivered"
              value={usageMetrics.rowsDelivered}
              max={usageMetrics.rowsLimit}
              tone="warning"
              sublabel={`${Math.round((usageMetrics.rowsDelivered / usageMetrics.rowsLimit) * 100)}%`}
            />
          </div>
        </GlassCard>
      </div>

      <GlassCard className="mt-4 flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-sm font-semibold">Growth plan</h2>
          <p className="mt-1 text-sm text-structure-muted">$490/mo · next invoice Sep 1, 2026</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">View invoices</Button>
          <Button size="sm">Upgrade plan</Button>
        </div>
      </GlassCard>
    </div>
  );
}
