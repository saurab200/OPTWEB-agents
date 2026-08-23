"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/cn";

export interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

export function DashboardShell({
  surface,
  navItems,
  children,
}: {
  surface: "Client Portal" | "Internal Ops";
  navItems: NavItem[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { orgName, role, signOut } = useAuth();

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-[13px] font-bold text-canvas">
              O
            </span>
            <span className="text-[15px] font-semibold tracking-tight">OPTWEB</span>
          </Link>
        </div>

        <div className="px-6 pt-5 pb-2">
          <p className="text-[11px] font-medium uppercase tracking-wider text-structure-faint">
            {surface}
          </p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-white/[0.06] text-structure"
                    : "text-structure-muted hover:bg-white/[0.04] hover:text-structure"
                )}
              >
                <span className={cn("h-4 w-4 shrink-0", active ? "text-accent" : "text-structure-faint")}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <div className="flex items-center justify-between rounded-xl glass px-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-structure">{orgName}</p>
              <p className="truncate text-[11px] text-structure-faint capitalize">{role}</p>
            </div>
            <button
              onClick={signOut}
              className="shrink-0 rounded-lg px-2 py-1 text-[11px] text-structure-muted hover:bg-white/[0.06] hover:text-structure"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-canvas/80 px-6 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-2 md:hidden">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-[13px] font-bold text-canvas">
              O
            </span>
          </div>
          <div className="hidden md:block" />
          <StatusPill tone="success">All systems normal</StatusPill>
        </header>
        <main className="flex-1 px-6 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
