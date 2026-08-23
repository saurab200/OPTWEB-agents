import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/cn";
import { pricingTiers } from "@/lib/mock-data";

export function PricingCta() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-20 lg:px-8">
      <div className="mb-10 text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-accent">Access</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          Start self-serve. Scale to a desk.
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {pricingTiers.map((tier) => (
          <GlassCard
            key={tier.name}
            raised={tier.highlighted}
            hover
            className={cn(
              "flex flex-col p-7",
              tier.highlighted && "border-accent/40 shadow-[0_0_0_1px_rgba(226,183,116,0.25),0_24px_48px_-24px_rgba(226,183,116,0.35)]"
            )}
          >
            {tier.highlighted && (
              <span className="mb-4 w-fit rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-accent">
                Most popular
              </span>
            )}
            <h3 className="text-base font-semibold">{tier.name}</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-semibold tracking-tight">{tier.price}</span>
              {tier.period && <span className="text-sm text-structure-faint">{tier.period}</span>}
            </div>
            <p className="mt-2 text-sm text-structure-muted">{tier.description}</p>

            <ul className="mt-6 flex-1 space-y-3">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-structure-muted">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {f}
                </li>
              ))}
            </ul>

            <Button
              href="/portal"
              variant={tier.highlighted ? "primary" : "secondary"}
              className="mt-7 w-full"
            >
              {tier.cta}
            </Button>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}
