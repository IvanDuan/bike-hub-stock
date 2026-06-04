import type { SupabaseClient } from "@supabase/supabase-js";

/** Keep auth user_metadata and profiles.display_name in sync. */
export async function syncDisplayName(
  supabase: SupabaseClient,
  name: string
): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name cannot be empty.");

  const { error: authErr } = await supabase.auth.updateUser({
    data: { display_name: trimmed },
  });
  if (authErr) throw new Error(authErr.message);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { error: profileErr } = await supabase
    .from("profiles")
    .update({ display_name: trimmed })
    .eq("id", user.id);
  if (profileErr) throw new Error(profileErr.message);
}
