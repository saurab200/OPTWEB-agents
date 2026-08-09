import type { BusinessIdentity } from "@aiv/contracts";

/**
 * Realistic local-search phrasings a real user might type into ChatGPT,
 * Claude, Gemini, or Perplexity. Kept to four per business to bound cost —
 * see fixCatalog-style constant note: this count is intentional and fixed,
 * not re-derived per call.
 */
export function buildQueries(business: BusinessIdentity): string[] {
  const place = business.region ? `${business.city}, ${business.region}` : business.city;
  return [
    `What's the best ${business.category} in ${place}?`,
    `Can you recommend a good ${business.category} near ${place}?`,
    `I'm looking for a ${business.category} in ${place}, any suggestions?`,
    `Where should I go for ${business.category} in ${place}?`,
  ];
}
