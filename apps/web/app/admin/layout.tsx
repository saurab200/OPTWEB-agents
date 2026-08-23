import { Building2, ClipboardCheck, LayoutGrid, Server, Workflow } from "lucide-react";
import { RouteGate } from "@/components/dashboard/route-gate";
import { DashboardShell, type NavItem } from "@/components/dashboard/dashboard-shell";

const navItems: NavItem[] = [
  { href: "/admin", label: "Overview", icon: <LayoutGrid className="h-4 w-4" /> },
  { href: "/admin/scrapers", label: "Scraper Fleet", icon: <Server className="h-4 w-4" /> },
  { href: "/admin/pipeline", label: "Pipeline Builder", icon: <Workflow className="h-4 w-4" /> },
  { href: "/admin/qa", label: "QA Queue", icon: <ClipboardCheck className="h-4 w-4" /> },
  { href: "/admin/tenants", label: "Tenant Management", icon: <Building2 className="h-4 w-4" /> },
];

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <RouteGate allow="admin">
      <DashboardShell surface="Internal Ops" navItems={navItems}>
        {children}
      </DashboardShell>
    </RouteGate>
  );
}
