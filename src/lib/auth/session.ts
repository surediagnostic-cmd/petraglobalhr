import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isHrOrMd } from "@/lib/auth/roles";
import type { Profile } from "@/lib/types";

export interface SessionProfile extends Profile {
  company_name: string;
  branch_name: string | null;
  department_name: string | null;
  designation_title: string | null;
}

// Fetches the signed-in user's profile row. Returns null if there's no
// session or no profile yet (e.g. an auth user who hasn't accepted an invite).
// RLS (`profiles_select_self`) already scopes this to the caller's own row,
// so no extra filtering is needed here.
export async function getCurrentProfile(): Promise<SessionProfile | null> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return null;

  const { data, error } = await supabase
    .from("hrm_profiles")
    .select(
      "*, companies:hrm_companies!company_id!inner(name), branches:hrm_branches!branch_id(name), departments:hrm_departments!department_id(name), designations:hrm_designations!designation_id(title)",
    )
    .eq("id", authData.user.id)
    .single();

  if (error || !data) return null;

  const { companies, branches, departments, designations, ...profile } = data as Profile & {
    companies: { name: string } | null;
    branches: { name: string } | null;
    departments: { name: string } | null;
    designations: { title: string } | null;
  };

  return {
    ...profile,
    company_name: companies?.name ?? "",
    branch_name: branches?.name ?? null,
    department_name: departments?.name ?? null,
    designation_title: designations?.title ?? null,
  };
}

// Every page under (app) sits below a layout that already redirects to
// /invite when there's no profile — this repeats that check so each page
// still fails safe if ever rendered outside that layout. Redirecting here
// too (rather than throwing) means a page whose render happens to be
// evaluated before the layout's own redirect resolves doesn't log a spurious
// unhandled error for what is actually normal "not onboarded yet" traffic.
export async function requireProfile(): Promise<SessionProfile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/invite");
  return profile;
}

// Defense in depth: the sidebar already hides /admin from staff, but the
// route itself must not trust that — anyone can type the URL directly.
export async function requireHrOrMd(): Promise<SessionProfile> {
  const profile = await requireProfile();
  if (!isHrOrMd(profile.role)) redirect("/manual");
  return profile;
}

// is_super_admin is orthogonal to role — a super admin still belongs to one
// company for their day-to-day work, but additionally sees/manages the
// cross-company list. Ordinary MDs/HR Managers never reach this.
export async function requireSuperAdmin(): Promise<SessionProfile> {
  const profile = await requireProfile();
  if (!profile.is_super_admin) redirect("/manual");
  return profile;
}
