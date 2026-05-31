"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { useAuth } from "@/components/AuthProvider";
import { BrandLogo } from "@/components/BrandLogo";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "signin" | "set-password";

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
  const [email, setEmail] = useState(demoMode ? "demo@bikehub.local" : "");
  const [password, setPassword] = useState(demoMode ? "demo" : "");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "auth"
      ? "Sign-in link expired or invalid. Ask your admin to send a new invite."
      : null
  );
  const [submitting, setSubmitting] = useState(false);
  const [checkingInvite, setCheckingInvite] = useState(!demoMode);

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
          setMode("set-password");
          clearAuthHash();
          setCheckingInvite(false);
          return;
        }
      }

      if (session && mode !== "set-password" && searchParams.get("setup") !== "password") {
        router.replace(searchParams.get("next") ?? "/");
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
    const err = await login(email, password);
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    router.replace(searchParams.get("next") ?? "/");
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
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
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
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
      <div className="bg-brand px-4 pb-8 pt-10">
        <div className="mx-auto w-full max-w-sm">
          <BrandLogo variant="banner" />
          <p className="mt-4 text-center text-sm text-white/85">Staff stock tracker</p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-sm flex-1 px-4 pb-8 pt-6">
        {mode === "set-password" ? (
          <form
            onSubmit={handleSetPassword}
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-zinc-900">Set your password</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Welcome! Choose a password for{" "}
              <strong>{email || "your account"}</strong>, then you can sign in anytime.
            </p>

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
        ) : (
          <form
            onSubmit={handleSignIn}
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
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
        )}
      </div>
    </div>
  );
}
