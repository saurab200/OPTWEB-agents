"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/table";
import { tenants as initial } from "@/lib/mock-data";

export default function TenantManagementPage() {
  const [tenants, setTenants] = useState(initial);

  const updateRateLimit = (id: string, value: number) => {
    setTenants((prev) => prev.map((t) => (t.id === id ? { ...t, rateLimit: value } : t)));
  };

  return (
    <div>
      <PageHeader
        title="Client Tenant Management"
        description="Adjust rate limits, grant dataset access, and audit API usage per tenant."
      />

      <GlassCard className="overflow-hidden p-0">
        <Table>
          <Thead>
            <Th>Tenant</Th>
            <Th>Plan</Th>
            <Th>Status</Th>
            <Th>Rate limit (req/min)</Th>
            <Th>Usage</Th>
            <Th>Seats</Th>
            <Th className="text-right">Actions</Th>
          </Thead>
          <tbody>
            {tenants.map((t) => (
              <Tr key={t.id}>
                <Td className="font-medium">{t.name}</Td>
                <Td className="text-structure-muted">{t.plan}</Td>
                <Td>
                  <StatusPill
                    tone={t.status === "active" ? "success" : t.status === "trial" ? "accent" : "danger"}
                  >
                    {t.status.replace("_", " ")}
                  </StatusPill>
                </Td>
                <Td>
                  <input
                    type="number"
                    value={t.rateLimit}
                    onChange={(e) => updateRateLimit(t.id, Number(e.target.value))}
                    className="h-8 w-24 rounded-lg border border-border bg-white/[0.03] px-2 font-mono text-xs outline-none focus:border-accent/50"
                  />
                </Td>
                <Td>
                  <span className={t.usagePct > 100 ? "font-mono text-xs text-danger" : "font-mono text-xs text-structure-muted"}>
                    {t.usagePct}%
                  </span>
                </Td>
                <Td className="font-mono text-xs">{t.seats}</Td>
                <Td>
                  <div className="flex justify-end gap-1">
                    <button
                      title="Grant dataset access"
                      className="rounded-lg p-2 text-structure-faint hover:bg-white/[0.06] hover:text-structure"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                    </button>
                    <Button variant="ghost" size="sm">
                      Audit log
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </GlassCard>
    </div>
  );
}
