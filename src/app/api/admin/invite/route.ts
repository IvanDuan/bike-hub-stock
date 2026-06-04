import { NextResponse } from "next/server";
import { getAppUrl } from "@/lib/app-url";
import { createClient as createAuthedClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

async function requireAdmin() {
  const supabase = await createAuthedClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), role: null as any, branch_id: null as any };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,branch_id")
    .eq("id", user.id)
    .maybeSingle();

  const rawRole = (profile?.role as string | undefined) ?? "staff";
  const role = rawRole === "manager" ? "branch_manager" : rawRole;
  if (role !== "superadmin" && role !== "branch_manager") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), role: null as any, branch_id: null as any };
  }

  return { error: null, role: role as "superadmin" | "branch_manager", branch_id: (profile?.branch_id as string | null | undefined) ?? null };
}

export async function POST(req: Request) {
  const { error, role, branch_id } = await requireAdmin();
  if (error) return error;

  const body = (await req.json().catch(() => null)) as
    | { email?: string; role?: "staff" | "branch_manager"; branch_id?: string | null }
    | null;

  const email = body?.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  const desiredRole = body?.role ?? "staff";
  const desiredBranch = body?.branch_id ?? null;

  // Branch managers can only invite staff for their branch.
  if (role === "branch_manager") {
    if (!branch_id) return NextResponse.json({ error: "Your account has no branch assigned yet." }, { status: 400 });
    if (desiredRole !== "staff") return NextResponse.json({ error: "Only SuperAdmin can invite managers." }, { status: 403 });
    if (desiredBranch !== branch_id) return NextResponse.json({ error: "You can only invite staff to your branch." }, { status: 403 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json(
      {
        error:
          "Staff invites are not configured on this server. Add SUPABASE_SERVICE_ROLE_KEY to .env.local (Supabase → Settings → API → service_role), then restart the app.",
      },
      { status: 500 }
    );
  }

  const admin = createServiceClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const appUrl = getAppUrl(req);
  const redirectTo = `${appUrl}/auth/callback?type=invite`;

  const { data, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { display_name: "", invited_by: "admin" },
    redirectTo,
  });

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 400 });
  }

  // Ensure profile has role/branch set (best-effort; requires RLS allowing superadmin/branch_manager or service role bypass).
  try {
    if (data?.user?.id) {
      await admin
        .from("profiles")
        .upsert({ id: data.user.id, role: desiredRole, branch_id: desiredBranch }, { onConflict: "id" });
    }
  } catch {
    // ignore; admin can still adjust in the UI after user accepts invite
  }

  return NextResponse.json({ ok: true });
}

