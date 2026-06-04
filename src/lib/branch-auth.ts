import { BRANCHES, type BranchId } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

export function branchMismatchMessage(selectedBranchId: BranchId, assignedBranchId: BranchId | null) {
  const selectedName = BRANCHES.find((b) => b.id === selectedBranchId)?.name ?? "this branch";
  const assignedName = assignedBranchId
    ? BRANCHES.find((b) => b.id === assignedBranchId)?.name
    : null;
  if (assignedName) {
    return `This account belongs to ${assignedName}, not ${selectedName}. Select the correct branch above and try again.`;
  }
  return `You don't have access to ${selectedName}. Select the correct branch and try again.`;
}

/** Returns null if OK, otherwise a user-facing error message. */
export async function validateBranchForUser(
  userId: string,
  selectedBranchId: BranchId
): Promise<string | null> {
  const supabase = createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("branch_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return `Could not verify your branch (${error.message}). Try again.`;
  }

  const assigned = (profile?.branch_id as BranchId | null | undefined) ?? null;
  if (!assigned) {
    return "Your account has no branch assigned yet. Ask a manager to assign your branch.";
  }
  if (assigned !== selectedBranchId) {
    return branchMismatchMessage(selectedBranchId, assigned);
  }
  return null;
}
