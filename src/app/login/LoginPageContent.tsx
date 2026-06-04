"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { useAuth } from "@/components/AuthProvider";
import { BikeHubCard, BikeHubNetworkBadge, BikeHubPageHero } from "@/components/BikeHubTheme";
import { BrandLogo } from "@/components/BrandLogo";
import { BRANCHES, type BranchId } from "@/lib/constants";
import { BRAND_ASSETS } from "@/lib/brand";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "signin" | "set-password";

const BRANCH_STORAGE_KEY = "bike-hub-stock-branch";

function hashParams(): URLSearchParams {
  if (typeof window === "undefined") return new URLSearchParams();
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  return new URLSearchParams(hash);
}

function clearAuthHash() {
  const { pathname, search } = window.location;
  window.history.replaceState(null, "", `${pathname}${search}`);
}

function hashAuthError(): string | null {
  const hash = hashParams();
  const errorCode = hash.get("error_code");
  const errorDescription = hash.get("error_description")?.replace(/\+/g, " ");

  if (hash.get("error") === "access_denied" && errorCode === "otp_expired") {
    return "This invite link has expired. Ask your admin to send a new invite, then open the new email link within about an hour.";
  }

  if (hash.get("error")) {
    return (
      errorDescription ??
      "This sign-in link is invalid or has expired. Ask your admin to send a new invite."
    );
  }

  return null;
}

function initialMode(searchParams: URLSearchParams): AuthMode {
  if (searchParams.get("setup") === "password") return "set-password";
  if (typeof window === "undefined") return "signin";

  const hash = hashParams();
  const hashType = hash.get("type");
  if (hashType === "invite" || hashType === "signup" || hash.get("access_token")) {
    return "set-password";
  }

  return "signin";
}

export default function LoginPageContent() {
  const { login, demoMode, session, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(() => initialMode(searchParams));
  const [branchId, setBranchId] = useState<BranchId>(() => {
    if (typeof window === "undefined") return "mt-roskill";
    const saved = window.localStorage.getItem(BRANCH_STORAGE_KEY) as BranchId | null;
    return saved && BRANCHES.some((b) => b.id === saved) ? saved : "mt-roskill";
  });
  const [email, setEmail] = useState(demoMode ? "demo@bikehub.local" : "");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState(demoMode ? "demo" : "");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(() => {
    if (searchParams.get("error") === "auth") {
      return "Sign-in link expired or invalid. Ask your admin to send a new invite.";
    }
    if (searchParams.get("error") === "branch" && typeof window !== "undefined") {
      return sessionStorage.getItem("bike-hub-login-error");
    }
    return null;
  });
  const [submitting, setSubmitting] = useState(false);
  const [checkingInvite, setCheckingInvite] = useState(() => {
    if (demoMode) return false;
    if (typeof window === "undefined") return true;
    const hash = hashParams();
    return Boolean(
      searchParams.get("token_hash") ||
        searchParams.get("setup") === "password" ||
        hash.get("access_token") ||
        hash.get("type") === "invite" ||
        hash.get("type") === "signup"
    );
  });

  useEffect(() => {
    if (searchParams.get("error") === "branch") {
      const stored = sessionStorage.getItem("bike-hub-login-error");
      if (stored) setError(stored);
      sessionStorage.removeItem("bike-hub-login-error");
      router.replace("/login");
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (demoMode || authLoading) return;

    async function handleAuthRedirect() {
      const hash = hashParams();
      const hashType = hash.get("type");
      const hashError = hashAuthError();

      if (hashError) {
        setError(hashError);
        clearAuthHash();
        setCheckingInvite(false);
        return;
      }

      const tokenHash = searchParams.get("token_hash");
      const queryType = searchParams.get("type") as EmailOtpType | null;
      const supabase = createClient();

      if (tokenHash && queryType) {
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: queryType,
        });

        window.history.replaceState(null, "", "/login?setup=password");

        if (verifyError) {
          setError(verifyError.message);
          setCheckingInvite(false);
          return;
        }

        if (data.user?.email) setEmail(data.user.email);
        setMode("set-password");
        setCheckingInvite(false);
        return;
      }

      if (searchParams.get("setup") === "password") {
        const {
          data: { session: activeSession },
        } = await supabase.auth.getSession();
        if (activeSession?.user?.email) setEmail(activeSession.user.email);
        if (activeSession?.user?.user_metadata?.display_name) {
          setDisplayName(activeSession.user.user_metadata.display_name as string);
        } else if (activeSession?.user?.email) {
          setDisplayName(activeSession.user.email.split("@")[0] ?? "");
        }
        setMode("set-password");
        setCheckingInvite(false);
        return;
      }

      if (hash.get("access_token") || hashType === "invite" || hashType === "signup") {
        const {
          data: { session: hashSession },
        } = await supabase.auth.getSession();

        if (hashSession?.user) {
          setEmail(hashSession.user.email ?? "");
          if (hashSession.user.user_metadata?.display_name) {
            setDisplayName(hashSession.user.user_metadata.display_name as string);
          } else if (hashSession.user.email) {
            setDisplayName(hashSession.user.email.split("@")[0] ?? "");
          }
          setMode("set-password");
          clearAuthHash();
          setCheckingInvite(false);
          return;
        }
      }

      if (session && mode !== "set-password" && searchParams.get("setup") !== "password") {
        const saved = window.localStorage.getItem(BRANCH_STORAGE_KEY) as BranchId | null;
        // Only auto-redirect when profile branch matches the branch they selected last time.
        if (session.branchId && saved && session.branchId === saved) {
          router.replace(searchParams.get("next") ?? "/");
        }
        setCheckingInvite(false);
        return;
      }

      setCheckingInvite(false);
    }

    handleAuthRedirect();
  }, [demoMode, authLoading, session, router, searchParams, mode]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const err = await login(email, password, branchId);
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(BRANCH_STORAGE_KEY, branchId);
      sessionStorage.removeItem("bike-hub-login-error");
    }
    router.replace(searchParams.get("next") ?? "/");
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: { display_name: displayName.trim() },
    });
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    // Keep profiles.display_name in sync for permissions + UI
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ display_name: displayName.trim() }).eq("id", user.id);
      }
    } catch {
      // non-blocking
    }

    router.replace(searchParams.get("next") ?? "/");
  }

  if (checkingInvite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-zinc-500">Completing invitation…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <BikeHubPageHero tall>
        <div className="mx-auto w-full max-w-sm text-center">
          <BrandLogo variant="lockup" hideLocation className="inline-block" />
          <div className="mx-auto mt-3 max-w-[14rem] overflow-hidden rounded-xl shadow-md ring-2 ring-white/25 sm:max-w-[16rem]">
            <Image
              src={BRAND_ASSETS.communityMap}
              alt="Auckland community bike hubs map"
              width={1024}
              height={512}
              className="h-auto w-full"
              priority
            />
          </div>
          <p className="mt-3 text-sm font-medium tracking-wide text-white/90">
            bike stock tracker
          </p>
          <BikeHubNetworkBadge />
        </div>
      </BikeHubPageHero>

      <div className="mx-auto w-full max-w-sm flex-1 px-4 pb-8 pt-2">
        {mode === "set-password" ? (
          <BikeHubCard>
          <form onSubmit={handleSetPassword}>
            <h2 className="text-lg font-semibold text-zinc-900">Set your password</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Welcome! Choose a password for{" "}
              <strong>{email || "your account"}</strong>, then you can sign in anytime.
            </p>

            <label className="mt-4 block text-sm font-medium text-zinc-700">
              Your name
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-3 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
                autoComplete="name"
                placeholder="e.g. Sam"
              />
            </label>

            <label className="mt-4 block text-sm font-medium text-zinc-700">
              New password
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-3 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
                autoComplete="new-password"
              />
            </label>

            <label className="mt-4 block text-sm font-medium text-zinc-700">
              Confirm password
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-3 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
                autoComplete="new-password"
              />
            </label>

            {error && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full rounded-xl bg-brand py-3.5 text-base font-bold text-white transition hover:bg-brand-dark disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Save password & continue"}
            </button>
          </form>
          </BikeHubCard>
        ) : (
          <BikeHubCard>
          <form onSubmit={handleSignIn}>
            <label className="block text-sm font-medium text-zinc-700">
              Branch
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value as BranchId)}
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              >
                {BRANCHES.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-zinc-700">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-3 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
                autoComplete="email"
              />
            </label>

            <label className="mt-4 block text-sm font-medium text-zinc-700">
              Password
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-3 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
                autoComplete="current-password"
              />
            </label>

            {error && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full rounded-xl bg-brand py-3.5 text-base font-bold text-white transition hover:bg-brand-dark disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>

            {demoMode && (
              <p className="mt-4 text-center text-xs leading-relaxed text-zinc-500">
                Demo mode: use any email with @ and any password.
                <br />
                Sample: <strong>demo@bikehub.local</strong>
              </p>
            )}
          </form>
          </BikeHubCard>
        )}
      </div>
    </div>
  );
}
