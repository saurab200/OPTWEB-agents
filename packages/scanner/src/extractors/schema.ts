import type { Page } from "playwright";
import type { SchemaFindings } from "@aiv/contracts";
import {
  FAQ_PAGE_TYPE,
  LOCAL_BUSINESS_FIELDS,
  LOCAL_BUSINESS_TYPES,
  QUESTION_TYPE,
  REVIEW_AGGREGATE_FIELDS,
  SERVICE_FIELDS,
} from "./schemaVocab.js";

export interface JsonLdNode {
  "@type"?: string | string[];
  "@graph"?: JsonLdNode[];
  [key: string]: unknown;
}

export interface SchemaParseResult {
  nodes: JsonLdNode[];
  parseErrors: string[];
}

function typesOf(node: JsonLdNode): string[] {
  const t = node["@type"];
  if (!t) return [];
  return Array.isArray(t) ? t : [t];
}

/** Flattens @graph wrappers and top-level arrays into a single node list. Never throws. */
export function parseJsonLd(rawScripts: string[]): SchemaParseResult {
  const nodes: JsonLdNode[] = [];
  const parseErrors: string[] = [];

  for (const raw of rawScripts) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch (err) {
      parseErrors.push(
        `Malformed JSON-LD block: ${err instanceof Error ? err.message : String(err)}`,
      );
      continue;
    }
    const top = Array.isArray(parsed) ? parsed : [parsed];
    for (const entry of top) {
      if (entry && typeof entry === "object") {
        const node = entry as JsonLdNode;
        if (Array.isArray(node["@graph"])) {
          nodes.push(...(node["@graph"] as JsonLdNode[]));
        } else {
          nodes.push(node);
        }
      }
    }
  }
  return { nodes, parseErrors };
}

function findNodeByTypes(nodes: JsonLdNode[], typeSet: Set<string>): JsonLdNode | undefined {
  return nodes.find((n) => typesOf(n).some((t) => typeSet.has(t)));
}

function fieldCompleteness(
  node: JsonLdNode | undefined,
  fields: readonly string[],
): { fields_present: string[]; fields_missing: string[] } {
  const fields_present: string[] = [];
  const fields_missing: string[] = [];
  for (const f of fields) {
    const val = node?.[f];
    const isPresent =
      val !== undefined &&
      val !== null &&
      val !== "" &&
      !(Array.isArray(val) && val.length === 0);
    (isPresent ? fields_present : fields_missing).push(f);
  }
  return { fields_present, fields_missing };
}

export async function extractRawJsonLd(page: Page): Promise<string[]> {
  return page.$$eval('script[type="application/ld+json"]', (nodes) =>
    nodes.map((n) => n.textContent ?? ""),
  );
}

export async function extractSchemaFindings(
  page: Page,
  issues: string[],
): Promise<SchemaFindings> {
  let raw: string[] = [];
  try {
    raw = await extractRawJsonLd(page);
  } catch (err) {
    issues.push(`JSON-LD extraction failed: ${err instanceof Error ? err.message : String(err)}`);
  }
  const { nodes, parseErrors } = parseJsonLd(raw);
  issues.push(...parseErrors);
  return buildSchemaFindings(nodes);
}

export function buildSchemaFindings(nodes: JsonLdNode[]): SchemaFindings {
  const localBusinessNode = findNodeByTypes(nodes, LOCAL_BUSINESS_TYPES);
  const localBusinessCompleteness = fieldCompleteness(localBusinessNode, LOCAL_BUSINESS_FIELDS);

  const serviceNode = findNodeByTypes(nodes, new Set(["Service"]));
  const serviceCompleteness = fieldCompleteness(serviceNode, SERVICE_FIELDS);

  const faqNode = findNodeByTypes(nodes, new Set([FAQ_PAGE_TYPE]));
  const mainEntity = faqNode?.["mainEntity"];
  const questionList = Array.isArray(mainEntity) ? mainEntity : mainEntity ? [mainEntity] : [];
  const question_count = questionList.filter((q) => {
    if (!q || typeof q !== "object") return false;
    const types = typesOf(q as JsonLdNode);
    return types.includes(QUESTION_TYPE) || "acceptedAnswer" in (q as JsonLdNode);
  }).length;

  // AggregateRating can be a top-level node or nested under an item (e.g. LocalBusiness.aggregateRating).
  let reviewNode = findNodeByTypes(nodes, new Set(["AggregateRating", "Review"]));
  if (!reviewNode) {
    const nested = nodes.find(
      (n) => n["aggregateRating"] && typeof n["aggregateRating"] === "object",
    );
    if (nested) reviewNode = nested["aggregateRating"] as JsonLdNode;
  }
  const reviewCompleteness = fieldCompleteness(reviewNode, REVIEW_AGGREGATE_FIELDS);

  return {
    local_business: {
      present: Boolean(localBusinessNode),
      type_found: localBusinessNode ? typesOf(localBusinessNode)[0] ?? null : null,
      fields_present: localBusinessCompleteness.fields_present,
      fields_missing: localBusinessCompleteness.fields_missing,
    },
    service: {
      present: Boolean(serviceNode),
      fields_present: serviceCompleteness.fields_present,
      fields_missing: serviceCompleteness.fields_missing,
    },
    faq_page: {
      present: Boolean(faqNode),
      question_count,
    },
    review_aggregate: {
      present: Boolean(reviewNode),
      fields_present: reviewCompleteness.fields_present,
      fields_missing: reviewCompleteness.fields_missing,
    },
  };
}
