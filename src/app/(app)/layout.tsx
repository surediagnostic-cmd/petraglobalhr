import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { isHrOrMd, roleLabel } from "@/lib/auth/roles";
import { NavLink } from "@/components/nav-link";
import { SignOutButton } from "@/components/sign-out-button";
import { Badge } from "@/components/ui/badge";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/invite");

  return (
    <div className="flex flex-1">
      <aside className="w-56 shrink-0 border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6">
          <p className="text-sm font-semibold dark:text-slate-100">{profile.company_name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{profile.full_name}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {profile.designation_title ?? roleLabel(profile.role)}
          </p>
          {profile.is_super_admin && (
            <Badge tone="warning" className="mt-2">
              Super Admin
            </Badge>
          )}
        </div>
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
