"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

const links = [
  { href: "#playground", label: "Playground" },
  { href: "#pipeline", label: "Pipeline" },
  { href: "#pricing", label: "Pricing" },
];

export function NavBar() {
  const { role } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-canvas/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-[13px] font-bold text-canvas">
            O
          </span>
          <span className="text-[15px] font-semibold tracking-tight">OPTWEB</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-structure-muted transition-colors hover:text-structure"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {role ? (
            <Button
              href={role === "admin" ? "/admin" : "/portal"}
              variant="secondary"
              size="sm"
            >
              {role === "admin" ? "Ops Console" : "Go to Portal"}
            </Button>
          ) : (
            <>
              <Button href="/portal" variant="ghost" size="sm" className="hidden sm:inline-flex">
                Sign in
              </Button>
              <Button href="/portal" variant="primary" size="sm">
                Start free
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
