"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth/session";

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function createCompanyAction(formData: FormData): Promise<{ error?: string }> {
  await requireSuperAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const mdEmail = String(formData.get("md_email") ?? "").trim().toLowerCase();

  if (!name) return { error: "Company name is required." };
  if (!mdEmail) return { error: "The first MD's email is required." };

  const slug = slugify(name);
  const supabase = await createClient();
  // Service-role: requireSuperAdmin() already gated this whole action, so
  // it's safe to bypass RLS here — needed because inviting the FIRST MD of
  // a brand-new company means writing an hrm_invites row for a company
  // that isn't the caller's own, which the normal "manage invites for your
  // own company" policy correctly refuses to allow via the session client.
  const admin = createAdminClient();

  // Retrying after a partial failure (company created, invite failed)
  // shouldn't hit a duplicate-slug error — reuse the existing row instead
  // of trying to insert it again.
  const { data: existingCompany } = await supabase
    .from("hrm_companies")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  let companyId = existingCompany?.id;

  if (!companyId) {
    // RLS (`hrm_companies_insert_super_admin`) allows this because the
    // caller is a super admin.
    const { data: company, error: companyError } = await supabase
      .from("hrm_companies")
      .insert({ name, slug })
      .select("id")
      .single();

    if (companyError) return { error: companyError.message };
    companyId = company.id;
  }

  const { data: existingInvite } = await admin
    .from("hrm_invites")
    .select("id")
    .eq("company_id", companyId)
    .eq("email", mdEmail)
    .maybeSingle();

  if (!existingInvite) {
    const { error: inviteError } = await admin.from("hrm_invites").insert({
      company_id: companyId,
      email: mdEmail,
      role: "md",
    });

    if (inviteError) return { error: inviteError.message };
  }

  // auth.admin is Supabase Auth's own admin API, not governed by our RLS —
  // it always requires the service-role key regardless of who's calling.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error: authError } = await admin.auth.admin.inviteUserByEmail(mdEmail, {
    redirectTo: `${siteUrl}/auth/callback?next=/invite`,
  });

  if (authError && authError.message !== "A user with this email address has already been registered") {
    return { error: authError.message };
  }

  revalidatePath("/admin/companies");
  return {};
}

// Full admin access to another company, same as that company's own MD —
// done by switching the super admin's own profile row rather than adding a
// second membership, so every existing page/policy that reads "the caller's
// company" just works unchanged. Trade-off: while visiting, this profile
// shows up in that company's own staff views, and its home company's data
// is temporarily out of reach (RLS scopes by the row's current company_id)
// until switching back. Written via the service-role client because the
// self-update RLS guard (0009) blocks a plain authenticated write from
// changing role/company_id/department_id/designation_id on your own row.
export async function visitCompanyAction(targetCompanyId: string): Promise<void> {
  const profile = await requireSuperAdmin();
  const admin = createAdminClient();

  const { data: me } = await admin
    .from("hrm_profiles")
    .select("company_id, role, department_id, designation_id, home_company_id, home_role, home_department_id, home_designation_id")
    .eq("id", profile.id)
    .single();

  if (!me || targetCompanyId === me.company_id) {
    redirect("/admin");
  }

  if (me.home_company_id && targetCompanyId === me.home_company_id) {
    // Returning home — restore the original assignment and clear the marker.
    await admin
      .from("hrm_profiles")
      .update({
        company_id: me.home_company_id,
        role: me.home_role,
        department_id: me.home_department_id,
        designation_id: me.home_designation_id,
        home_company_id: null,
        home_role: null,
        home_department_id: null,
        home_designation_id: null,
      })
      .eq("id", profile.id);
  } else {
    await admin
      .from("hrm_profiles")
      .update({
        company_id: targetCompanyId,
        role: "md",
        department_id: null,
        designation_id: null,
        // Only snapshot on the FIRST hop away from home — hopping to a
        // second, third, etc. company must not overwrite the original home.
        ...(me.home_company_id
          ? {}
          : {
              home_company_id: me.company_id,
              home_role: me.role,
              home_department_id: me.department_id,
              home_designation_id: me.designation_id,
            }),
      })
      .eq("id", profile.id);
  }

  redirect("/admin");
}
