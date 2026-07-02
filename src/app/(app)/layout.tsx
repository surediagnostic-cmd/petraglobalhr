import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { isHrOrMd, roleLabel } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { NavLink } from "@/components/nav-link";
import { SignOutButton } from "@/components/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { VisitCompanyButton } from "./admin/companies/visit-company-button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/invite");

  let homeCompanyName: string | null = null;
  if (profile.home_company_id) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("hrm_companies")
      .select("name")
      .eq("id", profile.home_company_id)
      .single();
    homeCompanyName = data?.name ?? null;
  }

  return (
    <div className="flex flex-1">
      <aside className="w-56 shrink-0 border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6">
          <p className="text-sm font-semibold dark:text-slate-100">{profile.company_name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{profile.full_name}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {profile.designation_title ?? roleLabel(profile.role)}
            {profile.branch_name ? ` · ${profile.branch_name}` : ""}
          </p>
          {profile.is_super_admin && (
            <Badge tone="warning" className="mt-2">
              Super Admin
            </Badge>
          )}
        </div>
        {profile.home_company_id && (
          <div className="mb-6 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs dark:border-amber-800 dark:bg-amber-950">
            <p className="mb-2 text-amber-800 dark:text-amber-300">
              Visiting as MD{homeCompanyName ? ` — home company is ${homeCompanyName}` : ""}
            </p>
            <VisitCompanyButton companyId={profile.home_company_id} label="Return to my company" />
          </div>
        )}
        <nav className="space-y-1">
          <NavLink href="/manual">Manual & Handbook</NavLink>
          <NavLink href="/goals">Performance</NavLink>
          <NavLink href="/training">Training</NavLink>
          <NavLink href="/messages">Messages</NavLink>
          <NavLink href="/directory">Directory</NavLink>
          {isHrOrMd(profile.role) && <NavLink href="/admin">Admin</NavLink>}
          {profile.is_super_admin && <NavLink href="/admin/companies">Companies</NavLink>}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-end border-b border-slate-200 bg-white px-6 py-3 dark:border-slate-800 dark:bg-slate-900">
          <SignOutButton />
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
