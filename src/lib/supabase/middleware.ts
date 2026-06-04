import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic =
    path.startsWith("/api/") ||
    path.startsWith("/login") ||
    path.startsWith("/browse") ||
    path.startsWith("/brand") ||
    path.startsWith("/auth");

  if (!user && !isPublic && path !== "/") {
    // staff routes under (app) except we allow / to redirect via client
  }

  if (
    !user &&
    !isPublic &&
    !path.startsWith("/_next") &&
    !path.includes(".")
  ) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  // Admin/stats routes
  const managerOnly =
    path.startsWith("/stats") ||
    path.startsWith("/sold") ||
    path.startsWith("/admin") ||
    path.startsWith("/api/admin") ||
    path.startsWith("/api/export");

  if (user && managerOnly) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role = (profile?.role as string | undefined) ?? "staff";
    const isPrivileged = role === "superadmin" || role === "branch_manager" || role === "manager";
    if (!isPrivileged) {
      const home = request.nextUrl.clone();
      home.pathname = "/";
      return NextResponse.redirect(home);
    }
  }

  if (user && path === "/login" && request.nextUrl.searchParams.get("setup") !== "password") {
    const home = request.nextUrl.clone();
    home.pathname = "/";
    return NextResponse.redirect(home);
  }

  return supabaseResponse;
}
