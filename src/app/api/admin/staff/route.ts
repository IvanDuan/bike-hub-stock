import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { StaffProfile } from "@/lib/types";

type BranchRow = { id: string; name: string };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,branch_id")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile?.role as string | undefined) ?? "staff";
  const normalizedRole = role === "manager" ? "branch_manager" : role;
  if (normalizedRole !== "superadmin" && normalizedRole !== "branch_manager") {
    return { supabase, user, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return {
    supabase,
    user,
    userId: user.id,
    role: normalizedRole as "superadmin" | "branch_manager",
    branch_id: (profile?.branch_id as string | null | undefined) ?? null,
    error: null,
  };
}

export async function GET() {
  const { supabase, error, role, branch_id, userId } = await requireAdmin();
  if (error) return error;

  const { data: branches } = await supabase.from("branches").select("id,name").order("name");
  let q = supabase.from("profiles").select("id,display_name,role,branch_id").order("display_name");
  if (role === "branch_manager" && branch_id) {
    // Branch managers only manage staff in their branch (not themselves or other managers).
    q = q.eq("branch_id", branch_id).eq("role", "staff").neq("id", userId);
  }
  const { data: profiles, error: profilesError } = await q;

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  return NextResponse.json({
    branches: (branches ?? []) as BranchRow[],
    profiles: (profiles ?? []) as StaffProfile[],
  });
}

export async function PATCH(req: Request) {
  const { supabase, error, role, branch_id } = await requireAdmin();
  if (error) return error;

  const body = (await req.json().catch(() => null)) as
    | {
        id?: string;
        role?: "superadmin" | "branch_manager" | "staff";
        branch_id?: string | null;
        display_name?: string;
      }
    | null;

  if (!body?.id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  // Branch managers can only edit staff within their branch, and cannot set superadmin.
  if (role === "branch_manager") {
    if (!branch_id) {
      return NextResponse.json({ error: "Your account has no branch assigned yet." }, { status: 400 });
    }
    const { data: target } = await supabase
      .from("profiles")
      .select("branch_id,role")
      .eq("id", body.id)
      .maybeSingle();
    if ((target?.branch_id as string | null | undefined) !== branch_id) {
      return NextResponse.json({ error: "Cannot edit staff outside your branch." }, { status: 403 });
    }
    const targetRole = (target?.role as string | undefined) ?? "staff";
    if (targetRole !== "staff") {
      return NextResponse.json({ error: "Branch managers can only manage staff." }, { status: 403 });
    }
    if (body.role === "superadmin" || body.role === "branch_manager") {
      return NextResponse.json({ error: "Branch managers cannot change staff roles." }, { status: 403 });
    }
    if (body.branch_id !== undefined && body.branch_id !== branch_id) {
      return NextResponse.json({ error: "Only SuperAdmin can change branches." }, { status: 403 });
    }
  }

  const patch: Record<string, unknown> = {};
  if (body.role) patch.role = body.role;
  if (body.branch_id !== undefined) patch.branch_id = body.branch_id;
  if (typeof body.display_name === "string") patch.display_name = body.display_name;

  const { error: updateError } = await supabase.from("profiles").update(patch).eq("id", body.id);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

