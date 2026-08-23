import { Gauge, KeyRound, LayoutGrid, Plug, Table2 } from "lucide-react";
import { RouteGate } from "@/components/dashboard/route-gate";
import { DashboardShell, type NavItem } from "@/components/dashboard/dashboard-shell";

const navItems: NavItem[] = [
  { href: "/portal", label: "Overview", icon: <LayoutGrid className="h-4 w-4" /> },
  { href: "/portal/data", label: "Schema Explorer", icon: <Table2 className="h-4 w-4" /> },
  { href: "/portal/api-keys", label: "API Keys & Webhooks", icon: <KeyRound className="h-4 w-4" /> },
  { href: "/portal/usage", label: "Usage & Billing", icon: <Gauge className="h-4 w-4" /> },
  { href: "/portal/integrations", label: "Integrations", icon: <Plug className="h-4 w-4" /> },
];

export default function PortalLayout({ children }: LayoutProps<"/portal">) {
  return (
    <RouteGate allow="customer">
      <DashboardShell surface="Client Portal" navItems={navItems}>
        {children}
      </DashboardShell>
    </RouteGate>
  );
}
