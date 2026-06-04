import { NextResponse } from "next/server";
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
    | {
        email?: string;
        password?: string;
        role?: "staff" | "branch_manager" | "superadmin";
        branch_id?: string | null;
      }
    | null;

  const email = body?.email?.trim().toLowerCase();
  const password = body?.password ?? "";
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const desiredRole = body?.role ?? "staff";
  const desiredBranch = body?.branch_id ?? null;

  const forbidden = validateStaffAssignment(ctx, desiredRole, desiredBranch);
  if (forbidden) return forbidden;

  const { admin, error: serviceError } = getServiceAdmin();
  if (!admin) return serviceError ?? NextResponse.json({ error: "Server not configured." }, { status: 500 });

  const { data, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: "" },
  });

  if (createError) {
    const mapped = authEmailErrorMessage(createError.message);
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
  }

  try {
    if (data.user?.id) {
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

  return NextResponse.json({
    ok: true,
    message:
      "Account created. Tell them to sign in at the app with this email and the password you set.",
  });
}
