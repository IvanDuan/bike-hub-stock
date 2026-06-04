"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { isDemoMode } from "@/lib/constants";
import { demoStore } from "@/lib/demo-store";
import { createClient } from "@/lib/supabase/client";
import { validateBranchForUser } from "@/lib/branch-auth";
import { BRANCHES, type BranchId } from "@/lib/constants";
import type { StaffRole, StaffSession } from "@/lib/types";

interface AuthContextValue {
  session: StaffSession | null;
  loading: boolean;
  demoMode: boolean;
  login: (email: string, password: string, selectedBranchId?: BranchId) => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loginPageHandlesAuth(): boolean {
  if (typeof window === "undefined") return false;
  if (!window.location.pathname.startsWith("/login")) return false;

  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  if (hash.get("access_token") || hash.get("type") === "invite" || hash.get("error")) {
    return true;
  }

  const query = new URLSearchParams(window.location.search);
  return (
    query.get("setup") === "password" ||
    Boolean(query.get("token_hash")) ||
    query.get("error") === "auth"
  );
}

function sessionFromUser(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): StaffSession {
  return {
    email: user.email ?? "",
    name:
      (user.user_metadata?.display_name as string) ??
      user.email?.split("@")[0] ??
      "Staff",
  };
}

async function enrichSession(session: StaffSession): Promise<StaffSession> {
  if (!session.email) return session;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return session;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, branch_id, display_name")
    .eq("id", user.id)
    .maybeSingle();

  const rawRole = (profile?.role as StaffRole | undefined) ?? undefined;
  const role: StaffRole | undefined = rawRole === "manager" ? "branch_manager" : rawRole;
  const branchId = (profile?.branch_id as BranchId | null | undefined) ?? undefined;
  const displayName = (profile?.display_name as string | undefined) ?? undefined;
  const branchName = branchId
    ? BRANCHES.find((b) => b.id === branchId)?.name
    : undefined;

  return {
    ...session,
    name: displayName ?? session.name,
    role,
    branchId: branchId ?? session.branchId,
    branchName,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const demoMode = isDemoMode();
  const [session, setSession] = useState<StaffSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (demoMode) {
          if (!cancelled) {
            setSession(demoStore.session());
            setLoading(false);
          }
          return;
        }

        if (loginPageHandlesAuth()) {
          if (!cancelled) setLoading(false);
        } else {
          const supabase = createClient();
          const {
            data: { session: initialSession },
          } = await supabase.auth.getSession();

          if (!cancelled && initialSession?.user) {
            setSession(await enrichSession(sessionFromUser(initialSession.user)));
          } else {
            const { data } = await supabase.auth.getUser();
            if (!cancelled && data.user) {
              setSession(await enrichSession(sessionFromUser(data.user)));
            }
          }
          if (!cancelled) setLoading(false);
        }

        const supabase = createClient();
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, authSession) => {
          if (authSession?.user) {
            enrichSession(sessionFromUser(authSession.user)).then((s) => setSession(s));
          } else if (!loginPageHandlesAuth()) {
            setSession(null);
          }
        });

        return () => subscription.unsubscribe();
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [demoMode]);

  const login = useCallback(
    async (email: string, password: string, selectedBranchId?: BranchId) => {
      if (demoMode) {
        const staff = demoStore.login(email, password);
        if (!staff) return "Use any email with @ (e.g. demo@bikehub.local)";
        const branch = selectedBranchId
          ? BRANCHES.find((b) => b.id === selectedBranchId)
          : undefined;
        setSession({
          ...staff,
          branchId: selectedBranchId ?? staff.branchId,
          branchName: branch?.name ?? staff.branchName,
        });
        return null;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return error.message;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return "Sign-in failed. Try again.";

      if (selectedBranchId) {
        const branchError = await validateBranchForUser(user.id, selectedBranchId);
        if (branchError) {
          await supabase.auth.signOut();
          setSession(null);
          return branchError;
        }
      }

      setSession(await enrichSession(sessionFromUser(user)));
      return null;
    },
    [demoMode]
  );

  const logout = useCallback(async () => {
    if (demoMode) {
      demoStore.logout();
      setSession(null);
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    setSession(null);
  }, [demoMode]);

  const value = useMemo(
    () => ({ session, loading, demoMode, login, logout }),
    [session, loading, demoMode, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
