"use client";

import { useState } from "react";
import { Database, FileSpreadsheet, Snowflake, Workflow, Zap } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { integrations as initial } from "@/lib/mock-data";

const icons: Record<string, typeof Database> = {
  postgres: Database,
  bigquery: Database,
  snowflake: Snowflake,
  sheets: FileSpreadsheet,
  zapier: Zap,
};

export default function IntegrationHubPage() {
  const [integrations, setIntegrations] = useState(initial);

  const toggle = (key: string) => {
    setIntegrations((prev) =>
      prev.map((i) => (i.key === key ? { ...i, connected: !i.connected } : i))
    );
  };

  return (
    <div>
      <PageHeader
        title="Integration Hub"
        description="Connect OPTWEB directly to where your team already works."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {integrations.map((i) => {
          const Icon = icons[i.key] ?? Workflow;
          return (
            <GlassCard key={i.key} hover className="flex flex-col p-6">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-structure">
                  <Icon className="h-5 w-5" />
                </div>
                <StatusPill tone={i.connected ? "success" : "neutral"}>
                  {i.connected ? "Connected" : "Not connected"}
                </StatusPill>
              </div>
              <h3 className="mt-4 text-sm font-semibold">{i.name}</h3>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-structure-muted">
                {i.description}
              </p>
              <Button
                variant={i.connected ? "secondary" : "primary"}
                size="sm"
                className="mt-5 w-full"
                onClick={() => toggle(i.key)}
              >
                {i.connected ? "Disconnect" : "Connect"}
              </Button>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
