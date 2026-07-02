import { requireSuperAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
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

  const { data: allStaff } = await supabase.from("hrm_profiles").select("company_id");
  const staffCountByCompany = new Map<string, number>();
  for (const s of allStaff ?? []) {
    staffCountByCompany.set(s.company_id, (staffCountByCompany.get(s.company_id) ?? 0) + 1);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-semibold dark:text-slate-100">Companies</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Petra Global Group companies. Visible only to super admins — each company&apos;s own MD/HR
        Manager only ever sees their own staff and data.
      </p>

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
