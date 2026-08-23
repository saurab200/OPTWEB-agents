// Static demo data for the three OPTWEB surfaces. None of this touches the
// real Scanner / Scoring / AI-Probe agents — it exists purely to make the
// UI feel populated. Swap for real API responses against `@aiv/contracts`
// shapes when the platform's data API lands.

export const playgroundSample = {
  raw: `<div class="biz-card">
  <h2>Franklin Barbecue</h2>
  <p class="addr">900 E 11th St, Austin, TX 78702</p>
  <span>Open · 11am – sold out</span>
  <a href="tel:5126536330">(512) 653-6330</a>
  <div class="stars">4.7 (9,203)</div>
</div>`,
  structured: {
    business_name: "Franklin Barbecue",
    category: "Barbecue Restaurant",
    address: {
      street: "900 E 11th St",
      city: "Austin",
      region: "TX",
      postal_code: "78702",
    },
    phone: "+15126536330",
    rating: 4.7,
    review_count: 9203,
    hours_today: "11:00–sold out",
    extraction_confidence: 0.97,
  },
};

export const pipelineStages = [
  {
    key: "extraction",
    title: "Extraction",
    description: "Headless rendering + DOM/JSON-LD parsing across the open web, at scale.",
  },
  {
    key: "normalization",
    title: "Normalization",
    description: "Messy HTML and inconsistent formats collapsed into one canonical schema.",
  },
  {
    key: "enrichment",
    title: "Enrichment",
    description: "Entity resolution, geocoding, and AI-visibility signal layered on top.",
  },
  {
    key: "delivery",
    title: "Delivery",
    description: "Query it live, export it, or stream it straight into your warehouse.",
  },
];

export const pricingTiers = [
  {
    name: "Self-serve",
    price: "$0",
    period: "to start",
    description: "For evaluating the API and small, ad-hoc pulls.",
    features: ["1,000 rows / mo", "REST + CSV export", "Community support"],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$490",
    period: "/mo",
    description: "For teams running structured data into a live product.",
    features: [
      "250,000 rows / mo",
      "Webhooks + warehouse sync",
      "Schema Explorer + saved queries",
      "Priority support",
    ],
    cta: "Start free trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For volume pipelines with dedicated SLAs and review workflows.",
    features: [
      "Unlimited volume",
      "Dedicated proxy pool",
      "Manual QA review lane",
      "Custom contracts & DPA",
    ],
    cta: "Book a call",
    highlighted: false,
  },
];

// --- Client Portal -----------------------------------------------------

export const apiKeys = [
  {
    id: "key_a1",
    name: "Production — order-sync",
    prefix: "optw_live_4f2a",
    created: "2026-03-11",
    lastUsed: "2 minutes ago",
    scopes: ["read:records", "read:schema"],
    status: "active" as const,
  },
  {
    id: "key_a2",
    name: "Staging",
    prefix: "optw_test_9b31",
    created: "2026-02-02",
    lastUsed: "3 days ago",
    scopes: ["read:records"],
    status: "active" as const,
  },
  {
    id: "key_a3",
    name: "Legacy ETL job",
    prefix: "optw_live_0c77",
    created: "2025-11-19",
    lastUsed: "41 days ago",
    scopes: ["read:records", "read:schema", "write:webhooks"],
    status: "revoked" as const,
  },
];

export const webhooks = [
  {
    id: "wh_1",
    url: "https://hooks.northwind.co/optweb/records",
    event: "record.updated",
    status: "healthy" as const,
    lastDelivery: "success · 210ms",
  },
  {
    id: "wh_2",
    url: "https://hooks.northwind.co/optweb/qa-flags",
    event: "record.flagged",
    status: "degraded" as const,
    lastDelivery: "2 failures in last 24h",
  },
];

export interface DataRecord {
  id: string;
  business_name: string;
  category: string;
  city: string;
  region: string;
  rating: number;
  review_count: number;
  extraction_confidence: number;
  ai_mention_rate: number;
  last_refreshed: string;
}

export const dataRecords: DataRecord[] = [
  { id: "rec_001", business_name: "Franklin Barbecue", category: "Restaurant", city: "Austin", region: "TX", rating: 4.7, review_count: 9203, extraction_confidence: 0.97, ai_mention_rate: 0.81, last_refreshed: "2026-08-22" },
  { id: "rec_002", business_name: "Blue Bottle Coffee", category: "Cafe", city: "Oakland", region: "CA", rating: 4.4, review_count: 3120, extraction_confidence: 0.94, ai_mention_rate: 0.63, last_refreshed: "2026-08-22" },
  { id: "rec_003", business_name: "Zingerman's Deli", category: "Deli", city: "Ann Arbor", region: "MI", rating: 4.6, review_count: 5871, extraction_confidence: 0.91, ai_mention_rate: 0.72, last_refreshed: "2026-08-21" },
  { id: "rec_004", business_name: "Pike Place Chowder", category: "Restaurant", city: "Seattle", region: "WA", rating: 4.5, review_count: 8022, extraction_confidence: 0.89, ai_mention_rate: 0.58, last_refreshed: "2026-08-21" },
  { id: "rec_005", business_name: "Voodoo Doughnut", category: "Bakery", city: "Portland", region: "OR", rating: 4.2, review_count: 15230, extraction_confidence: 0.96, ai_mention_rate: 0.77, last_refreshed: "2026-08-20" },
  { id: "rec_006", business_name: "Katz's Delicatessen", category: "Deli", city: "New York", region: "NY", rating: 4.5, review_count: 21044, extraction_confidence: 0.98, ai_mention_rate: 0.88, last_refreshed: "2026-08-20" },
  { id: "rec_007", business_name: "Al's Beef", category: "Restaurant", city: "Chicago", region: "IL", rating: 4.3, review_count: 2410, extraction_confidence: 0.85, ai_mention_rate: 0.41, last_refreshed: "2026-08-19" },
  { id: "rec_008", business_name: "Sqirl", category: "Cafe", city: "Los Angeles", region: "CA", rating: 4.0, review_count: 3980, extraction_confidence: 0.79, ai_mention_rate: 0.35, last_refreshed: "2026-08-19" },
];

export const usageMetrics = {
  creditsUsed: 61200,
  creditsLimit: 100000,
  apiRequests: 428_910,
  apiRequestsLimit: 750_000,
  rowsDelivered: 182_440,
  rowsLimit: 250_000,
  plan: "Growth",
  renewsOn: "Sep 1, 2026",
  dailyRequests: [42, 58, 51, 70, 66, 84, 91, 77, 63, 88, 95, 102, 90, 84],
};

export const integrations = [
  { key: "postgres", name: "PostgreSQL", description: "Direct connection string sync into a managed schema.", connected: true },
  { key: "bigquery", name: "BigQuery", description: "Scheduled dataset export via service account.", connected: true },
  { key: "snowflake", name: "Snowflake", description: "Native share, no data movement required.", connected: false },
  { key: "sheets", name: "Google Sheets", description: "Live-refreshing sheet, good for quick sharing.", connected: false },
  { key: "zapier", name: "Zapier", description: "Trigger workflows on new or flagged records.", connected: true },
];

// --- Internal Ops --------------------------------------------------------

export interface ScraperWorker {
  id: string;
  region: string;
  status: "running" | "idle" | "error";
  successRate: number;
  jobsToday: number;
  proxyHealth: number;
}

export const scraperFleet: ScraperWorker[] = [
  { id: "worker-us-east-01", region: "us-east-1", status: "running", successRate: 98.2, jobsToday: 4210, proxyHealth: 96 },
  { id: "worker-us-east-02", region: "us-east-1", status: "running", successRate: 97.4, jobsToday: 3990, proxyHealth: 94 },
  { id: "worker-us-west-01", region: "us-west-2", status: "running", successRate: 91.8, jobsToday: 3512, proxyHealth: 78 },
  { id: "worker-eu-central-01", region: "eu-central-1", status: "error", successRate: 54.1, jobsToday: 812, proxyHealth: 31 },
  { id: "worker-ap-south-01", region: "ap-south-1", status: "idle", successRate: 99.1, jobsToday: 0, proxyHealth: 89 },
];

export const queueStats = {
  pending: 1284,
  processing: 96,
  failedLastHour: 22,
  avgLatencyMs: 640,
};

export interface QaItem {
  id: string;
  business_name: string;
  issue: string;
  field: string;
  extracted: string;
  confidence: number;
  flaggedAt: string;
}

export const qaQueue: QaItem[] = [
  { id: "qa_101", business_name: "Rosie's Diner", issue: "Ambiguous phone format", field: "phone", extracted: "555 0134 ext maybe", confidence: 0.42, flaggedAt: "12m ago" },
  { id: "qa_102", business_name: "Cedar & Vine", issue: "Address split across two schema blocks", field: "address", extracted: "123 Cedar St / Suite — Vine", confidence: 0.38, flaggedAt: "26m ago" },
  { id: "qa_103", business_name: "Northgate Hardware", issue: "Hours contradict JSON-LD vs visible text", field: "hours", extracted: "Mon–Fri 8–6 (schema) vs 9–5 (page)", confidence: 0.55, flaggedAt: "1h ago" },
  { id: "qa_104", business_name: "Ember & Oak", issue: "Category mismatch vs. taxonomy", field: "category", extracted: "\"vibes\"", confidence: 0.21, flaggedAt: "2h ago" },
];

export interface Tenant {
  id: string;
  name: string;
  plan: string;
  rateLimit: number;
  usagePct: number;
  seats: number;
  status: "active" | "past_due" | "trial";
}

export const tenants: Tenant[] = [
  { id: "t_1", name: "Northwind Retail Co.", plan: "Growth", rateLimit: 500, usagePct: 61, seats: 6, status: "active" },
  { id: "t_2", name: "Fathom Analytics", plan: "Enterprise", rateLimit: 5000, usagePct: 83, seats: 22, status: "active" },
  { id: "t_3", name: "Basecamp Ventures", plan: "Self-serve", rateLimit: 50, usagePct: 12, seats: 1, status: "trial" },
  { id: "t_4", name: "Loopline Media", plan: "Growth", rateLimit: 500, usagePct: 104, seats: 4, status: "past_due" },
];
