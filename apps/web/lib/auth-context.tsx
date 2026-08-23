"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/**
 * Demo-only RBAC stub. Persists a chosen role to localStorage so the three
 * surfaces (public / portal / admin) can gate routes without a real IdP.
 * Swap for Supabase Auth or Clerk session/claims in production — see
 * apps/web/README.md.
 */
export type Role = "customer" | "admin" | null;

interface AuthState {
  role: Role;
  orgName: string;
  isReady: boolean;
  signIn: (role: Exclude<Role, null>) => void;
  signOut: () => void;
}

const STORAGE_KEY = "optweb.demo-role";

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [{ role, isReady }, setHydrated] = useState<{ role: Role; isReady: boolean }>({
    role: null,
    isReady: false,
  });

  useEffect(() => {
    // localStorage only exists client-side, so the stored role can't be read
    // during the initial render (would mismatch SSR) — this one-time sync on
    // mount is the standard way to hydrate from a browser-only source.
    // One-time hydration from a browser-only source (localStorage); there is
    // no external-system callback to hang this off of, and computing it
    // during render would mismatch the server-rendered markup.
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const role = stored === "customer" || stored === "admin" ? stored : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated({ role, isReady: true });
  }, []);

  const signIn = useCallback((next: Exclude<Role, null>) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    setHydrated({ role: next, isReady: true });
  }, []);

  const signOut = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setHydrated({ role: null, isReady: true });
  }, []);

  const orgName = role === "admin" ? "OPTWEB Ops" : "Northwind Retail Co.";

  return (
    <AuthContext.Provider value={{ role, orgName, isReady, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
