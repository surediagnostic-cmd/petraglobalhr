import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { isHrOrMd, roleLabel } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/app-sidebar";
import { SignOutButton } from "@/components/sign-out-button";

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
    <div className="flex flex-1 flex-col">
      <AppSidebar
        companyName={profile.company_name}
        fullName={profile.full_name}
        roleOrDesignation={profile.designation_title ?? roleLabel(profile.role)}
        branchName={profile.branch_name}
        isSuperAdmin={profile.is_super_admin}
        isHrOrMd={isHrOrMd(profile.role)}
        homeCompanyId={profile.home_company_id}
        homeCompanyName={homeCompanyName}
      />
      <header className="flex items-center justify-end border-b border-slate-200 bg-white px-16 py-3 dark:border-slate-800 dark:bg-slate-900">
        <SignOutButton />
      </header>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
    </div>
  );
}
