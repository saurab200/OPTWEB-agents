"use client";

import { useState } from "react";
import { Copy, Plus, RefreshCw, Trash2, Webhook } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusPill } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/table";
import { apiKeys as initialKeys, webhooks } from "@/lib/mock-data";

export default function ApiKeysPage() {
  const [keys, setKeys] = useState(initialKeys);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copy = async (id: string, prefix: string) => {
    try {
      await navigator.clipboard.writeText(`${prefix}_${"•".repeat(24)}`);
    } catch {
      // clipboard permissions can be denied silently in some browsers
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1500);
  };

  const revoke = (id: string) => {
    setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, status: "revoked" as const } : k)));
  };

  return (
    <div>
      <PageHeader
        title="API Keys & Webhooks"
        description="Generate, rotate, and monitor programmatic access to your data."
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4" />
            New API key
          </Button>
        }
      />

      <GlassCard className="mb-8 overflow-hidden p-0">
        <Table>
          <Thead>
            <Th>Name</Th>
            <Th>Key</Th>
            <Th>Scopes</Th>
            <Th>Last used</Th>
            <Th>Status</Th>
            <Th className="text-right">Actions</Th>
          </Thead>
          <tbody>
            {keys.map((k) => (
              <Tr key={k.id}>
                <Td className="font-medium">{k.name}</Td>
                <Td>
                  <button
                    onClick={() => copy(k.id, k.prefix)}
                    className="flex items-center gap-1.5 font-mono text-xs text-structure-muted hover:text-structure"
                  >
                    {k.prefix}_••••••••
                    <Copy className="h-3 w-3" />
                    {copiedId === k.id && <span className="text-accent">Copied</span>}
                  </button>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {k.scopes.map((s) => (
                      <StatusPill key={s} dot={false} className="normal-case">
                        {s}
                      </StatusPill>
                    ))}
                  </div>
                </Td>
                <Td className="text-structure-muted">{k.lastUsed}</Td>
                <Td>
                  <StatusPill tone={k.status === "active" ? "success" : "neutral"}>
                    {k.status}
                  </StatusPill>
                </Td>
                <Td>
                  <div className="flex justify-end gap-1">
                    <button
                      title="Rotate"
                      className="rounded-lg p-2 text-structure-faint hover:bg-white/[0.06] hover:text-structure"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      title="Revoke"
                      disabled={k.status === "revoked"}
                      onClick={() => revoke(k.id)}
                      className="rounded-lg p-2 text-structure-faint hover:bg-danger/10 hover:text-danger disabled:opacity-30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </GlassCard>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Webhook endpoints</h2>
        <Button variant="secondary" size="sm">
          <Webhook className="h-3.5 w-3.5" />
          Add endpoint
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {webhooks.map((w) => (
          <GlassCard key={w.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-mono text-xs text-structure-muted">{w.url}</p>
                <p className="mt-1.5 text-sm font-medium">{w.event}</p>
              </div>
              <StatusPill tone={w.status === "healthy" ? "success" : "warning"}>
                {w.status}
              </StatusPill>
            </div>
            <p className="mt-3 text-xs text-structure-faint">{w.lastDelivery}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
