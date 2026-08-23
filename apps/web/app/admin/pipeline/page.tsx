"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, CircleDashed } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/cn";

const sourceFields = [
  { key: "biz_title", sample: "\"Franklin Barbecue\"", suggested: "business_name", confidence: 0.98 },
  { key: "addr_block", sample: "\"900 E 11th St, Austin, TX 78702\"", suggested: "address", confidence: 0.91 },
  { key: "phone_raw", sample: "\"(512) 653-6330\"", suggested: "phone", confidence: 0.95 },
  { key: "hours_txt", sample: "\"Open · 11am – sold out\"", suggested: "hours_today", confidence: 0.62 },
  { key: "rating_stars", sample: "\"4.7 (9,203)\"", suggested: "rating", confidence: 0.88 },
  { key: "og_type", sample: "\"restaurant.barbecue\"", suggested: null, confidence: 0 },
];

const targetSchema = [
  { key: "business_name", type: "string", required: true },
  { key: "category", type: "string", required: true },
  { key: "address", type: "object", required: true },
  { key: "phone", type: "string", required: false },
  { key: "hours_today", type: "string", required: false },
  { key: "rating", type: "number", required: false },
  { key: "review_count", type: "number", required: false },
];

export default function PipelineBuilderPage() {
  const [mapping, setMapping] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(sourceFields.map((f) => [f.key, f.suggested]))
  );

  const mappedCount = useMemo(
    () => Object.values(mapping).filter(Boolean).length,
    [mapping]
  );

  return (
    <div>
      <PageHeader
        title="Pipeline Transformer & Schema Builder"
        description="Map dirty, unstructured source fields onto the canonical LocalBusiness schema."
        actions={
          <Button size="sm" disabled={mappedCount === 0}>
            Publish mapping
          </Button>
        }
      />

      <GlassCard className="mb-4 flex items-center justify-between p-4">
        <p className="text-sm text-structure-muted">
          <span className="font-semibold text-structure">{mappedCount}</span> of{" "}
          {sourceFields.length} source fields mapped
        </p>
        <StatusPill tone={mappedCount === sourceFields.length ? "success" : "warning"}>
          {mappedCount === sourceFields.length ? "Ready to publish" : "Incomplete mapping"}
        </StatusPill>
      </GlassCard>

      <div className="grid grid-cols-1 gap-3">
        {sourceFields.map((f) => {
          const target = mapping[f.key];
          return (
            <GlassCard key={f.key} className="grid grid-cols-1 items-center gap-3 p-4 md:grid-cols-[1fr_auto_1fr]">
              <div className="min-w-0">
                <p className="font-mono text-xs text-structure-faint">{f.key}</p>
                <p className="mt-1 truncate font-mono text-xs text-structure-muted">{f.sample}</p>
              </div>

              <div className="flex items-center justify-center">
                {target ? (
                  <ArrowRight className="h-4 w-4 text-accent" />
                ) : (
                  <CircleDashed className="h-4 w-4 text-structure-faint" />
                )}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={target ?? ""}
                  onChange={(e) =>
                    setMapping((m) => ({ ...m, [f.key]: e.target.value || null }))
                  }
                  className={cn(
                    "h-9 w-full rounded-lg border bg-white/[0.03] px-3 text-sm outline-none focus:border-accent/50",
                    target ? "border-accent/30 text-structure" : "border-border text-structure-faint"
                  )}
                >
                  <option value="">— unmapped —</option>
                  {targetSchema.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.key} ({t.type})
                    </option>
                  ))}
                </select>
                {target && f.confidence > 0 && (
                  <span className="flex shrink-0 items-center gap-1 text-xs text-structure-faint">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    {Math.round(f.confidence * 100)}%
                  </span>
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold">Canonical schema — LocalBusiness</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {targetSchema.map((t) => {
            const isMapped = Object.values(mapping).includes(t.key);
            return (
              <GlassCard key={t.key} className="p-3.5">
                <p className="font-mono text-xs text-structure">{t.key}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-structure-faint">{t.type}</span>
                  <StatusPill tone={isMapped ? "success" : t.required ? "danger" : "neutral"} dot={false}>
                    {isMapped ? "mapped" : t.required ? "required" : "optional"}
                  </StatusPill>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}
