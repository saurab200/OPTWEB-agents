"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Columns3, Download, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/table";
import { dataRecords, type DataRecord } from "@/lib/mock-data";

type ColumnKey = keyof DataRecord;

const columns: { key: ColumnKey; label: string; numeric?: boolean }[] = [
  { key: "business_name", label: "Business" },
  { key: "category", label: "Category" },
  { key: "city", label: "City" },
  { key: "region", label: "Region" },
  { key: "rating", label: "Rating", numeric: true },
  { key: "review_count", label: "Reviews", numeric: true },
  { key: "extraction_confidence", label: "Confidence", numeric: true },
  { key: "ai_mention_rate", label: "AI mention rate", numeric: true },
  { key: "last_refreshed", label: "Refreshed" },
];

function toCsv(rows: DataRecord[], visible: ColumnKey[]) {
  const header = visible.join(",");
  const body = rows
    .map((r) => visible.map((c) => JSON.stringify(r[c] ?? "")).join(","))
    .join("\n");
  return `${header}\n${body}`;
}

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SchemaExplorerPage() {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<ColumnKey>("review_count");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [visibleCols, setVisibleCols] = useState<Set<ColumnKey>>(
    new Set(columns.map((c) => c.key))
  );
  const [showColMenu, setShowColMenu] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = q
      ? dataRecords.filter((r) =>
          [r.business_name, r.category, r.city, r.region].some((v) =>
            v.toLowerCase().includes(q)
          )
        )
      : dataRecords;

    return [...rows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [query, sortKey, sortDir]);

  const toggleSort = (key: ColumnKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const toggleCol = (key: ColumnKey) => {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      if (next.has(key) && next.size > 1) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const visibleColumns = columns.filter((c) => visibleCols.has(c.key));

  return (
    <div>
      <PageHeader
        title="Schema Explorer"
        description="Query structured records with filtering, sorting, and column control, then export."
      />

      <GlassCard className="mb-4 flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-structure-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by business, category, city..."
            className="h-9 w-full rounded-lg border border-border bg-white/[0.03] pl-9 pr-3 text-sm text-structure placeholder:text-structure-faint outline-none focus:border-accent/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Button variant="secondary" size="sm" onClick={() => setShowColMenu((v) => !v)}>
              <Columns3 className="h-3.5 w-3.5" />
              Columns
            </Button>
            {showColMenu && (
              <div className="absolute right-0 z-10 mt-2 w-56 rounded-xl border border-border-strong bg-canvas-overlay p-2 shadow-2xl">
                {columns.map((c) => (
                  <label
                    key={c.key}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-structure-muted hover:bg-white/[0.05]"
                  >
                    <input
                      type="checkbox"
                      checked={visibleCols.has(c.key)}
                      onChange={() => toggleCol(c.key)}
                      className="accent-[#e2b774]"
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            )}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => download("optweb-export.csv", toCsv(filtered, visibleColumns.map((c) => c.key)), "text/csv")}
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              download("optweb-export.json", JSON.stringify(filtered, null, 2), "application/json")
            }
          >
            <Download className="h-3.5 w-3.5" />
            JSON
          </Button>
          <Button variant="ghost" size="sm" title="Parquet export streams via a warehouse integration — see Integration Hub">
            Parquet
          </Button>
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden p-0">
        <Table>
          <Thead>
            {visibleColumns.map((c) => (
              <Th key={c.key}>
                <button
                  onClick={() => toggleSort(c.key)}
                  className="flex items-center gap-1 hover:text-structure-muted"
                >
                  {c.label}
                  {sortKey === c.key ? (
                    sortDir === "asc" ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-40" />
                  )}
                </button>
              </Th>
            ))}
          </Thead>
          <tbody>
            {filtered.map((r) => (
              <Tr key={r.id}>
                {visibleColumns.map((c) => (
                  <Td key={c.key} className={c.numeric ? "font-mono text-xs" : undefined}>
                    {c.key === "extraction_confidence" || c.key === "ai_mention_rate"
                      ? `${Math.round((r[c.key] as number) * 100)}%`
                      : String(r[c.key])}
                  </Td>
                ))}
              </Tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={visibleColumns.length} className="px-4 py-10 text-center text-sm text-structure-faint">
                  No records match “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </GlassCard>

      <p className="mt-3 text-xs text-structure-faint">
        {filtered.length} of {dataRecords.length} records
      </p>
    </div>
  );
}
