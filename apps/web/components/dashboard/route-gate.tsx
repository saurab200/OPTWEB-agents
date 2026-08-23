"use client";

import { type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth, type Role } from "@/lib/auth-context";
import { SignInPanel } from "@/components/dashboard/sign-in-panel";

/**
 * Client-side RBAC gate for the demo auth stub. A real deployment would do
 * this in middleware against a verified session, not in a client component.
 */
export function RouteGate({
  allow,
  children,
}: {
  allow: Exclude<Role, null>;
  children: ReactNode;
}) {
  const { role, isReady } = useAuth();
  const router = useRouter();

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-border-strong border-t-accent" />
      </div>
    );
  }

  if (role !== allow) {
    return <SignInPanel requiredRole={allow} onSignedIn={() => router.refresh()} />;
  }

  return <>{children}</>;
}
