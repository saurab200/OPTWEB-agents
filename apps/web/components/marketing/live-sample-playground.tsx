"use client";

import { useState } from "react";
import { Braces, Code2, ShieldCheck } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/cn";
import { playgroundSample } from "@/lib/mock-data";

export function LiveSamplePlayground() {
  const [structured, setStructured] = useState(true);

  return (
    <section id="playground" className="mx-auto max-w-5xl px-6 py-20 lg:px-8">
      <div className="mb-10 text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-accent">
          Live sample
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          Raw web noise, structured on the way in.
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-structure-muted md:text-base">
          One real listing, before and after our extraction pipeline runs.
        </p>
      </div>

      <GlassCard raised className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2 text-xs text-structure-faint">
            <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
            <span className="ml-2 font-mono">franklinbbq.com/listing</span>
          </div>

          <div className="flex items-center gap-1 rounded-full bg-white/[0.05] p-1">
            <button
              onClick={() => setStructured(false)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                !structured ? "bg-white/[0.08] text-structure" : "text-structure-faint hover:text-structure-muted"
              )}
            >
              <Code2 className="h-3.5 w-3.5" />
              Raw HTML
            </button>
            <button
              onClick={() => setStructured(true)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                structured ? "bg-accent text-canvas" : "text-structure-faint hover:text-structure-muted"
              )}
            >
              <Braces className="h-3.5 w-3.5" />
              Structured JSON
            </button>
          </div>
        </div>

        <div className="grid gap-0 md:grid-cols-2">
          <pre className="scrollbar-none max-h-96 overflow-auto p-6 font-mono text-[13px] leading-relaxed text-structure-muted">
            <code>{playgroundSample.raw}</code>
          </pre>

          <div className="relative border-t border-border md:border-l md:border-t-0">
            <div
              className={cn(
                "scrollbar-none max-h-96 overflow-auto p-6 font-mono text-[13px] leading-relaxed transition-opacity duration-300",
                structured ? "opacity-100" : "opacity-30 md:opacity-100"
              )}
            >
              <pre className="text-structure">
                <code>{JSON.stringify(playgroundSample.structured, null, 2)}</code>
              </pre>
            </div>
            <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[11px] text-success">
              <ShieldCheck className="h-3 w-3" />
              97% confidence
            </div>
          </div>
        </div>
      </GlassCard>
    </section>
  );
}
