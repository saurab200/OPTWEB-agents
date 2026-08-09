import type { BusinessIdentity } from "@aiv/contracts";

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, "") // strip apostrophes rather than space-splitting them, so "Katz's" -> "katzs" not "katz s"
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Two business names "match" if they're equal after normalization, or one
 * fully contains the other (e.g. "Katz's" matching "Katz's Delicatessen").
 * A deliberately loose heuristic — false positives (crediting a mention that
 * wasn't really this business) are worse than false negatives here, so this
 * favors precision over recall by requiring a real substring relationship,
 * not token-overlap or edit-distance fuzziness.
 */
export function namesMatch(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

export interface MatchResult {
  mentioned: boolean;
  mention_position: number | null;
  competitors_mentioned: string[];
}

/**
 * Compares a model's list of mentioned business names (already extracted by
 * the probe's structured LLM call) against the target business's name and
 * aliases. Pure and deterministic — no LLM call happens here.
 */
export function matchBusiness(mentionedNames: string[], business: BusinessIdentity): MatchResult {
  const candidates = [business.name, ...(business.aliases ?? [])];
  let mention_position: number | null = null;

  for (let i = 0; i < mentionedNames.length; i++) {
    if (candidates.some((c) => namesMatch(c, mentionedNames[i]))) {
      mention_position = i + 1;
      break;
    }
  }

  const competitors_mentioned = mentionedNames.filter(
    (name) => !candidates.some((c) => namesMatch(c, name)),
  );

  return { mentioned: mention_position !== null, mention_position, competitors_mentioned };
}
