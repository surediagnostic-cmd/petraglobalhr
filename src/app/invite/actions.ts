"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function acceptInviteAction(fullName: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user?.email) {
    return { error: "No active invite session. Ask HR to resend your invite link." };
  }

  const admin = createAdminClient();

  const { data: invite, error: inviteError } = await admin
    .from("hrm_invites")
    .select("*")
    .eq("email", user.email)
    .eq("status", "pending")
    .maybeSingle();

  if (inviteError || !invite) {
    return { error: "No pending invite found for this email. Ask HR to send you a new one." };
  }

  // Service role bypasses RLS — required here since the user has no
  // `profiles` row yet, and every RLS policy on `profiles` needs one to
  // resolve current_company()/current_role().
  const { error: profileError } = await admin.from("hrm_profiles").insert({
    id: user.id,
    company_id: invite.company_id,
    department_id: invite.department_id,
    designation_id: invite.designation_id,
    role: invite.role,
    full_name: fullName,
    date_joined: new Date().toISOString().slice(0, 10),
  });

  if (profileError) {
    return { error: profileError.message };
  }

  await admin
    .from("hrm_invites")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  return {};
}
