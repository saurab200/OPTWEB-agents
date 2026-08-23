import { Database, Layers, Sparkles, Truck } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/cn";
import { pipelineStages } from "@/lib/mock-data";

const icons = [Layers, Database, Sparkles, Truck];

export function FeatureGrid() {
  return (
    <section id="pipeline" className="mx-auto max-w-6xl px-6 py-20 lg:px-8">
      <div className="mb-10 text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-accent">
          The pipeline
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          Four stages. One clean output.
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {pipelineStages.map((stage, i) => {
          const Icon = icons[i];
          return (
            <GlassCard
              key={stage.key}
              hover
              className={cn(
                "flex flex-col gap-4 p-6",
                i === 0 && "md:col-span-2 md:row-span-1",
                i === 3 && "md:col-span-2"
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-mono text-structure-faint">0{i + 1}</p>
                <h3 className="mt-1 text-lg font-semibold tracking-tight">{stage.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-structure-muted">
                  {stage.description}
                </p>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </section>
  );
}
