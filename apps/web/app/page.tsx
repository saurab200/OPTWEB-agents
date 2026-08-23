import { NavBar } from "@/components/marketing/nav-bar";
import { Hero } from "@/components/marketing/hero";
import { LiveSamplePlayground } from "@/components/marketing/live-sample-playground";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { PricingCta } from "@/components/marketing/pricing-cta";
import { Footer } from "@/components/marketing/footer";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <main className="flex-1">
        <Hero />
        <LiveSamplePlayground />
        <FeatureGrid />
        <PricingCta />
      </main>
      <Footer />
    </div>
  );
}
