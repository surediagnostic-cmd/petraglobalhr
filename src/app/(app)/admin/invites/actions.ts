"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireHrOrMd } from "@/lib/auth/session";
import { generatePassword } from "@/lib/generate-password";

export type CreateStaffResult = {
  error?: string;
  credentials?: { email: string; password: string };
};

// Email invites depend on Supabase's shared email service, which isn't
// reliable enough for onboarding real staff — this creates the account
// directly with a generated password instead, so HR can hand it to the
// new hire through whatever channel actually reaches them.
export async function createStaffAccountAction(formData: FormData): Promise<CreateStaffResult> {
  const profile = await requireHrOrMd();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const branchId = String(formData.get("branch_id") ?? "") || null;
  const departmentId = String(formData.get("department_id") ?? "") || null;
  const designationId = String(formData.get("designation_id") ?? "") || null;
  const role = String(formData.get("role") ?? "staff");

  if (!email) return { error: "Email is required." };
  if (!fullName) return { error: "Full name is required." };

  const admin = createAdminClient();
  const password = generatePassword();

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createErr) {
    if (createErr.code === "email_exists") {
      return { error: "This email already has an account. Use a different email." };
    }
    return { error: createErr.message };
  }

  const { error: profileError } = await admin.from("hrm_profiles").insert({
    id: created.user.id,
    company_id: profile.company_id,
    branch_id: branchId,
    department_id: departmentId,
    designation_id: designationId,
    role,
    full_name: fullName,
    date_joined: new Date().toISOString().slice(0, 10),
  });

  if (profileError) {
    // Roll back the auth user so retrying with the same email doesn't hit
    // "already registered" on a half-completed account.
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: profileError.message };
  }

  // Record for the history list below — status is "accepted" immediately
  // since there's no separate email-acceptance step in this flow anymore.
  await admin.from("hrm_invites").insert({
    company_id: profile.company_id,
    email,
    branch_id: branchId,
    department_id: departmentId,
    designation_id: designationId,
    role,
    invited_by: profile.id,
    status: "accepted",
    accepted_at: new Date().toISOString(),
  });

  revalidatePath("/admin/invites");
  return { credentials: { email, password } };
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
