"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { branchMismatchMessage } from "@/lib/branch-auth";
import { branchLocation, SUPERADMIN_LOCATION_LABEL, type BranchId } from "@/lib/constants";
import { useAuth } from "./AuthProvider";

const BRANCH_STORAGE_KEY = "bike-hub-stock-branch";
import { BottomNav } from "./BottomNav";
import { BrandHeaderBar } from "./BrandLogo";
import { HeaderMenu } from "./HeaderMenu";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { session, loading, demoMode, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login");
    }
  }, [loading, session, router]);

  useEffect(() => {
    if (loading || !session?.branchId || typeof window === "undefined") return;
    if (session.role === "superadmin") return;
    const saved = window.localStorage.getItem(BRANCH_STORAGE_KEY) as BranchId | null;
    if (saved && session.branchId !== saved) {
      const msg = branchMismatchMessage(saved, session.branchId);
      window.sessionStorage.setItem("bike-hub-login-error", msg);
      logout().then(() => router.replace("/login?error=branch"));
    }
  }, [loading, session, logout, router]);

  useEffect(() => {
    if (!session?.branchName) return;
    document.title = `${session.branchName} — Stock`;
  }, [session?.branchName]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-zinc-500">Loading…</p>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 shadow-sm">
        <BrandHeaderBar
          location={
            session.role === "superadmin" && !session.branchId
              ? SUPERADMIN_LOCATION_LABEL
              : branchLocation(session.branchId)
          }
          subtitle={`Hi, ${session.name}`}
          trailing={
            <HeaderMenu
              onSignOut={() => logout().then(() => router.replace("/login"))}
            />
          }
        />
        {demoMode && (
          <div className="bg-brand-yellow/20 px-4 py-2 text-center text-xs text-brand-dark">
            Demo mode — data saved in this browser. Connect Supabase for team access.
          </div>
        )}
      </header>
      <main id="app-main-scroll" className="mx-auto max-w-lg px-4 py-4">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
