"use client";

import { useAuth, type Role } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

export function SignInPanel({
  requiredRole,
  onSignedIn,
}: {
  requiredRole: Exclude<Role, null>;
  onSignedIn?: () => void;
}) {
  const { signIn } = useAuth();

  const copy =
    requiredRole === "admin"
      ? {
          title: "Internal Ops sign-in",
          desc: "This console is restricted to OPTWEB operators. Continue with a demo operator session.",
          cta: "Continue as Operator",
        }
      : {
          title: "Sign in to your workspace",
          desc: "Access your API keys, structured data, and usage. Continue with a demo customer session.",
          cta: "Continue as Customer",
        };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6">
      <div
        className="pointer-events-none fixed inset-0 grid-fade-mask opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,245,247,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(245,245,247,0.06) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <GlassCard raised className="relative w-full max-w-sm p-8 text-center">
        <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-base font-bold text-canvas">
          O
        </div>
        <h1 className="text-lg font-semibold tracking-tight">{copy.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-structure-muted">{copy.desc}</p>
        <Button
          className="mt-6 w-full"
          onClick={() => {
            signIn(requiredRole);
            onSignedIn?.();
          }}
        >
          {copy.cta}
        </Button>
        <p className="mt-4 text-[11px] text-structure-faint">
          Demo auth stub — no credentials required. Swap for Supabase Auth / Clerk in production.
        </p>
      </GlassCard>
    </div>
  );
}
