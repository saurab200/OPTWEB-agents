"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { qaQueue as initial } from "@/lib/mock-data";

export default function QaQueuePage() {
  const [queue, setQueue] = useState(initial);
  const [resolved, setResolved] = useState<{ id: string; action: "accepted" | "rejected" }[]>([]);

  const resolve = (id: string, action: "accepted" | "rejected") => {
    setQueue((q) => q.filter((item) => item.id !== id));
    setResolved((r) => [{ id, action }, ...r].slice(0, 5));
  };

  return (
    <div>
      <PageHeader
        title="Manual Review & Data QA Queue"
        description="Flagged extraction anomalies awaiting a human decision."
      />

      {queue.length === 0 ? (
        <GlassCard className="p-10 text-center text-sm text-structure-muted">
          Queue clear — nothing flagged right now.
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {queue.map((item) => (
            <GlassCard key={item.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{item.business_name}</p>
                  <StatusPill tone="neutral" dot={false} className="normal-case">
                    {item.field}
                  </StatusPill>
                  <span className="text-xs text-structure-faint">{item.flaggedAt}</span>
                </div>
                <p className="mt-1.5 text-sm text-structure-muted">{item.issue}</p>
                <p className="mt-1 font-mono text-xs text-structure-faint">
                  extracted: {item.extracted}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <StatusPill tone={item.confidence < 0.4 ? "danger" : "warning"}>
                  {Math.round(item.confidence * 100)}% confidence
                </StatusPill>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="!bg-success/10 !text-success hover:!bg-success/20"
                    onClick={() => resolve(item.id, "accepted")}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Accept
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => resolve(item.id, "rejected")}>
                    <X className="h-3.5 w-3.5" />
                    Reject
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-structure-faint">
            Recently resolved
          </h2>
          <ul className="space-y-2 text-sm text-structure-muted">
            {resolved.map((r, i) => (
              <li key={`${r.id}-${i}`} className="flex items-center gap-2">
                <StatusPill tone={r.action === "accepted" ? "success" : "danger"} dot={false}>
                  {r.action}
                </StatusPill>
                {r.id}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
