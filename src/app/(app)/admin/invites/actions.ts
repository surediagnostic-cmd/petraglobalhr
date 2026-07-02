"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireHrOrMd } from "@/lib/auth/session";

export async function createInviteAction(formData: FormData): Promise<{ error?: string }> {
  const profile = await requireHrOrMd();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const branchId = String(formData.get("branch_id") ?? "") || null;
  const departmentId = String(formData.get("department_id") ?? "") || null;
  const designationId = String(formData.get("designation_id") ?? "") || null;
  const role = String(formData.get("role") ?? "staff");

  if (!email) return { error: "Email is required." };

  const supabase = await createClient();
  const { data: invite, error } = await supabase
    .from("hrm_invites")
    .insert({
      company_id: profile.company_id,
      email,
      branch_id: branchId,
      department_id: departmentId,
      designation_id: designationId,
      role,
      invited_by: profile.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const admin = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/invite`,
  });

  if (inviteError) {
    // Roll back the invite row so retrying doesn't collide with the unique
    // (company_id, email, status) constraint on a half-completed invite.
    await supabase.from("hrm_invites").delete().eq("id", invite.id);
    return { error: inviteError.message };
  }

  revalidatePath("/admin/invites");
  return {};
}

export async function revokeInviteAction(inviteId: string): Promise<{ error?: string }> {
  await requireHrOrMd();
  const supabase = await createClient();
  const { error } = await supabase
    .from("hrm_invites")
    .update({ status: "revoked" })
    .eq("id", inviteId);

  if (error) return { error: error.message };
  revalidatePath("/admin/invites");
  return {};
}
