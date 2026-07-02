import { requireSuperAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCompanyAction } from "./actions";
import { VisitCompanyButton } from "./visit-company-button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";

export default async function CompaniesPage() {
  const profile = await requireSuperAdmin();
  const supabase = await createClient();

  // RLS (`hrm_companies_select_super_admin`) is what makes this cross-company
  // read possible at all — an ordinary MD/HR Manager querying this same
  // table only ever gets their own company's row back.
  const { data: companies } = await supabase
    .from("hrm_companies")
    .select("id, name, slug, is_active")
    .order("name");

  // Goals/training/reports have no super-admin RLS policy (unlike
  // companies/profiles) — this whole page is already gated by
  // requireSuperAdmin() above, so the service-role client is used here
  // specifically for the group-wide rollup rather than adding a bespoke
  // cross-company policy to every one of these tables.
  const admin = createAdminClient();
  const [{ data: allStaff }, { data: goalReports }, { data: trainingRecords }] = await Promise.all([
    admin.from("hrm_profiles").select("id, company_id, employment_status"),
    admin.from("hrm_goal_reports").select("id, review_status, goals:hrm_goals(company_id)").returns<
      { id: string; review_status: string; goals: { company_id: string } | null }[]
    >(),
    admin.from("hrm_training_records").select("id, status, profile_id"),
  ]);

  const staffCountByCompany = new Map<string, number>();
  const activeStaffByCompany = new Map<string, number>();
  const companyByProfileId = new Map<string, string>();
  for (const s of allStaff ?? []) {
    staffCountByCompany.set(s.company_id, (staffCountByCompany.get(s.company_id) ?? 0) + 1);
    if (s.employment_status === "active") {
      activeStaffByCompany.set(s.company_id, (activeStaffByCompany.get(s.company_id) ?? 0) + 1);
    }
    companyByProfileId.set(s.id, s.company_id);
  }

  const pendingReviewsByCompany = new Map<string, number>();
  for (const r of goalReports ?? []) {
    if (r.review_status !== "pending" || !r.goals) continue;
    const companyId = r.goals.company_id;
    pendingReviewsByCompany.set(companyId, (pendingReviewsByCompany.get(companyId) ?? 0) + 1);
  }

  const trainingTotalsByCompany = new Map<string, { total: number; completed: number }>();
  for (const t of trainingRecords ?? []) {
    const companyId = companyByProfileId.get(t.profile_id);
    if (!companyId) continue;
    const entry = trainingTotalsByCompany.get(companyId) ?? { total: 0, completed: 0 };
    entry.total += 1;
    if (t.status === "completed") entry.completed += 1;
    trainingTotalsByCompany.set(companyId, entry);
  }

  return (
    <div className="max-w-4xl">
      <h1 className="mb-1 text-xl font-semibold dark:text-slate-100">Companies</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Petra Global Group companies. Visible only to super admins — each company&apos;s own MD/HR
        Manager only ever sees their own staff and data.
      </p>

      <Card className="mb-6 overflow-x-auto">
        <CardTitle>Group-wide overview</CardTitle>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <th className="pb-2 pr-4">Company</th>
              <th className="pb-2 pr-4">Staff</th>
              <th className="pb-2 pr-4">Pending reviews</th>
              <th className="pb-2 pr-4">Training completion</th>
            </tr>
          </thead>
          <tbody>
            {(companies ?? []).map((c) => {
              const total = staffCountByCompany.get(c.id) ?? 0;
              const active = activeStaffByCompany.get(c.id) ?? 0;
              const training = trainingTotalsByCompany.get(c.id);
              const trainingPct = training && training.total > 0 ? Math.round((training.completed / training.total) * 100) : null;
              return (
                <tr key={c.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-2 pr-4 font-medium text-slate-900 dark:text-slate-100">{c.name}</td>
                  <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">
                    {total} <span className="text-slate-400 dark:text-slate-500">({active} active)</span>
                  </td>
                  <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">
                    {pendingReviewsByCompany.get(c.id) ?? 0}
                  </td>
                  <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">
                    {trainingPct === null ? "—" : `${trainingPct}%`}
                  </td>
                </tr>
              );
            })}
            {companies?.length === 0 && (
              <tr>
                <td colSpan={4} className="py-2 text-slate-500 dark:text-slate-400">
                  No companies yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Card className="mb-6">
        <CardTitle>Add a company</CardTitle>
        <ActionForm action={createCompanyAction} className="mt-3 space-y-3">
          <div>
            <Label htmlFor="name">Company name</Label>
            <Input id="name" name="name" required placeholder="e.g. Hopestone Hospital" />
          </div>
          <div>
            <Label htmlFor="md_email">First MD&apos;s email</Label>
            <Input id="md_email" name="md_email" type="email" required />
          </div>
          <SubmitButton pendingText="Creating...">Create company & invite MD</SubmitButton>
        </ActionForm>
      </Card>

      <div className="space-y-2">
        {(companies ?? []).map((c) => {
          const isCurrent = c.id === profile.company_id;
          return (
            <Card key={c.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium dark:text-slate-100">{c.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {staffCountByCompany.get(c.id) ?? 0} staff · {c.slug}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={c.is_active ? "success" : "neutral"}>{c.is_active ? "active" : "inactive"}</Badge>
                {isCurrent ? (
                  <Badge tone="warning">Current</Badge>
                ) : (
                  <VisitCompanyButton companyId={c.id} label="Manage this company" />
                )}
              </div>
            </Card>
          );
        })}
        {companies?.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">No companies yet.</p>
        )}
      </div>
    </div>
  );
}
