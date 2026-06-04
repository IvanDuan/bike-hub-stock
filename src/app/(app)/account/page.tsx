"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { syncDisplayName } from "@/lib/sync-display-name";
import { useAuth } from "@/components/AuthProvider";

export default function AccountPage() {
  const router = useRouter();
  const { session } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [displayName, setDisplayName] = useState(session?.name ?? "");
  const [email, setEmail] = useState(session?.email ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.name) setDisplayName(session.name);
    if (session?.email) setEmail(session.email);
  }, [session?.name, session?.email]);

  async function saveName() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in.");

      await syncDisplayName(supabase, displayName);
      setMessage("Name updated.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update name.");
    } finally {
      setSaving(false);
    }
  }

  async function saveEmail() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const nextEmail = email.trim().toLowerCase();
      if (!nextEmail.includes("@")) throw new Error("Enter a valid email address.");

      const { error: authErr } = await supabase.auth.updateUser({ email: nextEmail });
      if (authErr) throw new Error(authErr.message);

      setMessage("Email change requested. Check your inbox to confirm the new email.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update email.");
    } finally {
      setSaving(false);
    }
  }

  async function savePassword() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      if (newPassword.length < 8) throw new Error("Password must be at least 8 characters.");

      const { error: authErr } = await supabase.auth.updateUser({ password: newPassword });
      if (authErr) throw new Error(authErr.message);

      setNewPassword("");
      setMessage("Password updated.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Account</h1>
          <p className="text-sm text-zinc-500">Update your details</p>
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700"
        >
          Done
        </button>
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {message && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>}

      <section className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
        <h2 className="text-sm font-semibold text-zinc-700">Name</h2>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full rounded-xl border border-zinc-300 px-3 py-3"
          placeholder="Your name"
          autoComplete="name"
        />
        <button
          type="button"
          disabled={saving}
          onClick={saveName}
          className="w-full rounded-xl bg-brand py-3 font-semibold text-white disabled:opacity-60"
        >
          Save name
        </button>
      </section>

      <section className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
        <h2 className="text-sm font-semibold text-zinc-700">Email</h2>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-zinc-300 px-3 py-3"
          placeholder="Email"
          autoComplete="email"
        />
        <p className="text-xs text-zinc-500">
          Changing email may require confirming a link sent to your inbox.
        </p>
        <button
          type="button"
          disabled={saving}
          onClick={saveEmail}
          className="w-full rounded-xl border border-brand bg-white py-3 font-semibold text-brand-dark disabled:opacity-60"
        >
          Change email
        </button>
      </section>

      <section className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
        <h2 className="text-sm font-semibold text-zinc-700">Password</h2>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full rounded-xl border border-zinc-300 px-3 py-3"
          placeholder="New password (8+ characters)"
          autoComplete="new-password"
        />
        <button
          type="button"
          disabled={saving}
          onClick={savePassword}
          className="w-full rounded-xl bg-zinc-900 py-3 font-semibold text-white disabled:opacity-60"
        >
          Update password
        </button>
      </section>
    </div>
  );
}

