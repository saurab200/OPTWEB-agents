import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 grid-fade-mask opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,245,247,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(245,245,247,0.08) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-10%] h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-accent/20 blur-[140px]"
      />

      <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-8">
        <div className="animate-fade-up mb-6 inline-flex">
          <StatusPill tone="accent" dot={false}>
            <Sparkles className="h-3 w-3" />
            Now probing ChatGPT, Claude, Gemini &amp; Perplexity
          </StatusPill>
        </div>

        <h1
          className="animate-fade-up text-balance text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl"
          style={{ animationDelay: "80ms" }}
        >
          <span className="text-gradient-accent">Hedge-fund grade intelligence,</span>
          <br />
          democratized.
        </h1>

        <p
          className="animate-fade-up mx-auto mt-6 max-w-xl text-balance text-base leading-relaxed text-structure-muted md:text-lg"
          style={{ animationDelay: "140ms" }}
        >
          We turn the open web&rsquo;s raw noise into clean, queryable, structured
          data — extracted, normalized, and enriched, delivered straight to
          your warehouse.
        </p>

        <div
          className="animate-fade-up mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          style={{ animationDelay: "200ms" }}
        >
          <Button href="/portal" size="lg">
            Start free
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button href="#playground" variant="secondary" size="lg">
            See it transform data
          </Button>
        </div>

        <p
          className="animate-fade-up mt-6 text-xs text-structure-faint"
          style={{ animationDelay: "260ms" }}
        >
          No credit card · 1,000 rows free · Cancel anytime
        </p>
      </div>
    </section>
  );
}
