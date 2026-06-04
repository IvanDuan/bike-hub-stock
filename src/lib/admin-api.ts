import { NextResponse } from "next/server";
import { createClient as createAuthedClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export type AdminContext = {
  role: "superadmin" | "branch_manager";
  branch_id: string | null;
};

export async function requireAdmin() {
  const supabase = await createAuthedClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      ctx: null as AdminContext | null,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,branch_id")
    .eq("id", user.id)
    .maybeSingle();

  const rawRole = (profile?.role as string | undefined) ?? "staff";
  const role = rawRole === "manager" ? "branch_manager" : rawRole;
  if (role !== "superadmin" && role !== "branch_manager") {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      ctx: null as AdminContext | null,
    };
  }

  return {
    error: null,
    ctx: {
      role: role as "superadmin" | "branch_manager",
      branch_id: (profile?.branch_id as string | null | undefined) ?? null,
    },
  };
}

export function getServiceAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return {
      admin: null,
      error: NextResponse.json(
        {
          error:
            "Staff admin actions are not configured. Add SUPABASE_SERVICE_ROLE_KEY on the server.",
        },
        { status: 500 }
      ),
    };
  }

  return {
    admin: createServiceClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
    error: null,
  };
}

/** Maps app role to profiles.role column value. */
export function profileRoleForDb(
  role: "staff" | "branch_manager" | "superadmin" | "manager"
): string {
  if (role === "branch_manager") return "manager";
  return role;
}

export function validateStaffAssignment(
  ctx: AdminContext,
  desiredRole: "staff" | "branch_manager" | "superadmin",
  desiredBranch: string | null
): NextResponse | null {
  if (ctx.role === "branch_manager") {
    if (!ctx.branch_id) {
      return NextResponse.json(
        { error: "Your account has no branch assigned yet." },
        { status: 400 }
      );
    }
    if (desiredRole !== "staff") {
      return NextResponse.json(
        { error: "Only SuperAdmin can create managers." },
        { status: 403 }
      );
    }
    if (desiredBranch !== ctx.branch_id) {
      return NextResponse.json(
        { error: "You can only add staff to your branch." },
        { status: 403 }
      );
    }
  }
  if (desiredRole === "superadmin" && ctx.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export function authEmailErrorMessage(message: string): { error: string; status: number } {
  const lower = message.toLowerCase();
  if (lower.includes("rate limit") || lower.includes("rate_limit")) {
    return {
      error:
        "Email rate limit exceeded. Supabase’s built-in email allows about 2 messages per hour. Wait ~1 hour, use “Create with password” below (no email), or set up custom SMTP under Supabase → Authentication → SMTP.",
      status: 429,
    };
  }
  return { error: message, status: 400 };
}
