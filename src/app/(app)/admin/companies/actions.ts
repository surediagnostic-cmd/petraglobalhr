"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth/session";
import { generatePassword } from "@/lib/generate-password";

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export type CreateCompanyResult = {
  error?: string;
  credentials?: { email: string; password: string };
};

// Email invites depend on Supabase's shared email service, which isn't
// reliable enough for real onboarding — this creates the first MD's
// account directly with a generated password instead, for the super
// admin to hand off through whatever channel actually reaches them.
export async function createCompanyAction(formData: FormData): Promise<CreateCompanyResult> {
  await requireSuperAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const mdEmail = String(formData.get("md_email") ?? "").trim().toLowerCase();
  const mdFullName = String(formData.get("md_full_name") ?? "").trim();

  if (!name) return { error: "Company name is required." };
  if (!mdEmail) return { error: "The first MD's email is required." };
  if (!mdFullName) return { error: "The first MD's full name is required." };

  const slug = slugify(name);
  const supabase = await createClient();
  // Service-role: requireSuperAdmin() already gated this whole action, so
  // it's safe to bypass RLS here — needed because provisioning the FIRST MD
  // of a brand-new company means writing a profile for a company that
  // isn't the caller's own.
  const admin = createAdminClient();

  // Retrying after a partial failure (company created, account creation
  // failed) shouldn't hit a duplicate-slug error — reuse the existing row
  // instead of trying to insert it again.
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

  const password = generatePassword();
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: mdEmail,
    password,
    email_confirm: true,
  });

  if (createErr) {
    if (createErr.code === "email_exists") {
      return { error: "This email already has an account. Use a different email for the first MD." };
    }
    return { error: createErr.message };
  }

  const { error: profileError } = await admin.from("hrm_profiles").insert({
    id: created.user.id,
    company_id: companyId,
    role: "md",
    full_name: mdFullName,
    date_joined: new Date().toISOString().slice(0, 10),
  });

  if (profileError) {
    // Roll back the auth user so retrying doesn't hit "already registered".
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: profileError.message };
  }

  await admin.from("hrm_invites").insert({
    company_id: companyId,
    email: mdEmail,
    role: "md",
    status: "accepted",
    accepted_at: new Date().toISOString(),
  });

  revalidatePath("/admin/companies");
  return { credentials: { email: mdEmail, password } };
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

  // The sidebar (company name, role, nav) lives in the shared (app) layout,
  // which Next.js otherwise reuses across a Server Action redirect instead
  // of re-rendering — so switching companies silently left the old
  // company's name showing. Revalidating the whole tree forces every page,
  // including that layout, to refetch the now-changed profile.
  revalidatePath("/", "layout");

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
