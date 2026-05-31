"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { BottomNav } from "./BottomNav";
import { BrandHeaderBar } from "./BrandLogo";
import { ShareBrowseLink } from "./ShareBrowseLink";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { session, loading, demoMode, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login");
    }
  }, [loading, session, router]);

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
          subtitle={`Hi, ${session.name}`}
          onSignOut={() => logout().then(() => router.replace("/login"))}
          trailing={<ShareBrowseLink />}
        />
        {demoMode && (
          <div className="bg-brand-yellow/20 px-4 py-2 text-center text-xs text-brand-dark">
            Demo mode — data saved in this browser. Connect Supabase for team access.
          </div>
        )}
      </header>
      <main className="mx-auto max-w-lg px-4 py-4">{children}</main>
      <BottomNav />
    </div>
  );
}
