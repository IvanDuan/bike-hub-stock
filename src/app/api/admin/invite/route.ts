import { NextResponse } from "next/server";
import { getAppUrl } from "@/lib/app-url";
import {
  authEmailErrorMessage,
  getServiceAdmin,
  profileRoleForDb,
  requireAdmin,
  validateStaffAssignment,
} from "@/lib/admin-api";

export async function POST(req: Request) {
  const { error, ctx } = await requireAdmin();
  if (error) return error;
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => null)) as
    | { email?: string; role?: "staff" | "branch_manager"; branch_id?: string | null }
    | null;

  const email = body?.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  const desiredRole = body?.role ?? "staff";
  const desiredBranch = body?.branch_id ?? null;

  const forbidden = validateStaffAssignment(ctx, desiredRole, desiredBranch);
  if (forbidden) return forbidden;

  const { admin, error: serviceError } = getServiceAdmin();
  if (!admin) return serviceError ?? NextResponse.json({ error: "Server not configured." }, { status: 500 });

  const appUrl = getAppUrl(req);
  const redirectTo = `${appUrl}/auth/callback?type=invite`;

  const { data, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { invited_by: "admin" },
    redirectTo,
  });

  if (inviteError) {
    const mapped = authEmailErrorMessage(inviteError.message);
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
  }

  try {
    if (data?.user?.id) {
      await admin.from("profiles").upsert(
        {
          id: data.user.id,
          role: profileRoleForDb(desiredRole),
          branch_id: desiredBranch,
        },
        { onConflict: "id" }
      );
    }
  } catch {
    // non-blocking
  }

  return NextResponse.json({ ok: true });
}
