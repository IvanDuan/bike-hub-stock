"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import type { BranchId, StaffProfile } from "@/lib/types";
import { BRANCHES } from "@/lib/constants";

type BranchRow = { id: BranchId; name: string };

export default function AdminPage() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<StaffProfile[]>([]);
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"staff" | "branch_manager">("staff");
  const [inviteBranch, setInviteBranch] = useState<BranchId | "">("");
  const [inviting, setInviting] = useState(false);
  const [createPassword, setCreatePassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const canView =
    session?.role === "superadmin" || session?.role === "branch_manager" || session?.role === "manager";
  const isSuperAdmin = session?.role === "superadmin";
  const isBranchManager =
    session?.role === "branch_manager" || session?.role === "manager";

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch("/api/admin/staff");
      if (!resp.ok) {
        const j = (await resp.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error ?? `Failed to load (${resp.status})`);
      }
      const data = (await resp.json()) as { profiles: StaffProfile[]; branches: BranchRow[] };
      setProfiles(data.profiles ?? []);
      setBranches(data.branches ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!canView) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView]);

  const branchOptions = useMemo(() => {
    // Prefer DB list; fall back to constants if empty (demo/dev).
    const opts = branches.length
      ? branches
      : (BRANCHES.map((b) => ({ id: b.id, name: b.name })) as BranchRow[]);
    return opts;
  }, [branches]);

  async function saveProfile(id: string, patch: Partial<StaffProfile>) {
    setSavingId(id);
    setError(null);
    try {
      const resp = await fetch("/api/admin/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      if (!resp.ok) {
        const j = (await resp.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error ?? `Save failed (${resp.status})`);
      }
      setProfiles((prev) => prev.map((p) => (p.id === id ? ({ ...p, ...patch } as StaffProfile) : p)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingId(null);
    }
  }

  if (!canView) {
    return null;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Admin</h1>
        <p className="text-sm text-zinc-500">
          {isSuperAdmin
            ? "All branches — manage every staff member, manager, and role"
            : isBranchManager
              ? "Your branch only — manage staff in your hub"
              : "Manage staff branches and roles"}
        </p>
      </div>

      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {success && (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{success}</p>
      )}

      <section className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
        <h2 className="text-sm font-semibold text-zinc-900">Invite staff</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Sends an invite email. The user will set their password and name. Supabase limits
          built-in email to about <strong>2 per hour</strong> — use create-with-password if you
          hit the limit.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3">
          <label className="block text-xs font-semibold text-zinc-600">
            Email
            <input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="name@example.com"
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
            />
          </label>

          {isSuperAdmin && (
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-semibold text-zinc-600">
                Role
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "staff" | "branch_manager")}
                  className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="staff">Staff</option>
                  <option value="branch_manager">BranchManager</option>
                </select>
              </label>
              <label className="block text-xs font-semibold text-zinc-600">
                Branch
                <select
                  value={inviteBranch}
                  onChange={(e) => setInviteBranch(e.target.value as BranchId | "")}
                  className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Unassigned</option>
                  {branchOptions.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {!isSuperAdmin && (
            <p className="text-xs text-zinc-500">
              As BranchManager you can only invite <strong>Staff</strong> into your branch.
            </p>
          )}

          <button
            type="button"
            disabled={inviting || !inviteEmail.trim()}
            onClick={async () => {
              setInviting(true);
              setError(null);
              setSuccess(null);
              try {
                const resp = await fetch("/api/admin/invite", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    email: inviteEmail.trim(),
                    role: isSuperAdmin ? inviteRole : "staff",
                    branch_id: isSuperAdmin ? (inviteBranch || null) : session?.branchId ?? null,
                  }),
                });
                if (!resp.ok) {
                  const j = (await resp.json().catch(() => null)) as { error?: string } | null;
                  throw new Error(j?.error ?? `Invite failed (${resp.status})`);
                }
                setInviteEmail("");
                setSuccess("Invite email sent.");
                await load();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Invite failed");
              } finally {
                setInviting(false);
              }
            }}
            className="rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {inviting ? "Sending…" : "Send invite email"}
          </button>

          <div className="border-t border-zinc-200 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              No email (rate limit workaround)
            </h3>
            <p className="mt-1 text-sm text-zinc-600">
              Creates the account immediately. Tell them the password in person or by text.
            </p>
            <label className="mt-3 block text-xs font-semibold text-zinc-600">
              Temporary password (8+ characters)
              <input
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                minLength={8}
                autoComplete="new-password"
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              />
            </label>
            <button
              type="button"
              disabled={creating || !inviteEmail.trim() || createPassword.length < 8}
              onClick={async () => {
                setCreating(true);
                setError(null);
                setSuccess(null);
                try {
                  const resp = await fetch("/api/admin/create-staff", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      email: inviteEmail.trim(),
                      password: createPassword,
                      role: isSuperAdmin ? inviteRole : "staff",
                      branch_id: isSuperAdmin
                        ? inviteBranch || null
                        : session?.branchId ?? null,
                    }),
                  });
                  const j = (await resp.json().catch(() => null)) as {
                    error?: string;
                    message?: string;
                  } | null;
                  if (!resp.ok) throw new Error(j?.error ?? `Create failed (${resp.status})`);
                  setInviteEmail("");
                  setCreatePassword("");
                  setSuccess(j?.message ?? "Account created.");
                  await load();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Create failed");
                } finally {
                  setCreating(false);
                }
              }}
              className="mt-3 w-full rounded-xl border border-brand bg-brand-light px-4 py-3 text-sm font-semibold text-brand-dark disabled:opacity-60"
            >
              {creating ? "Creating…" : "Create account (no email)"}
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading staff…</p>
      ) : (
        <div className="space-y-3">
          {profiles.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-zinc-900">
                    {p.display_name || "Unnamed user"}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">{p.id}</p>
                </div>
                {savingId === p.id && (
                  <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-600">
                    Saving…
                  </span>
                )}
              </div>

              {isBranchManager ? (
                <p className="mt-3 text-sm text-zinc-600">
                  Role: <span className="font-semibold">Staff</span>
                  {p.branch_id && (
                    <>
                      {" "}
                      · Branch:{" "}
                      <span className="font-semibold">
                        {branchOptions.find((b) => b.id === p.branch_id)?.name ?? p.branch_id}
                      </span>
                    </>
                  )}
                </p>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <label className="block text-xs font-semibold text-zinc-600">
                    Role
                    <select
                      value={p.role === "manager" ? "branch_manager" : p.role}
                      onChange={(e) =>
                        saveProfile(p.id, {
                          role: (e.target.value === "branch_manager"
                            ? "manager"
                            : e.target.value) as StaffProfile["role"],
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="staff">Staff</option>
                      <option value="branch_manager">BranchManager</option>
                      {isSuperAdmin && <option value="superadmin">SuperAdmin</option>}
                    </select>
                  </label>
                  <label className="block text-xs font-semibold text-zinc-600">
                    Branch
                    <select
                      value={p.branch_id ?? ""}
                      onChange={(e) =>
                        saveProfile(p.id, {
                          branch_id: (e.target.value
                            ? (e.target.value as BranchId)
                            : null) as BranchId | null,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">Unassigned</option>
                      {branchOptions.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

