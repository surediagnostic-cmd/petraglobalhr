import { requireHrOrMd } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { updateCompanyProfileAction } from "./actions";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";

export default async function CompanyProfilePage() {
  const profile = await requireHrOrMd();
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("hrm_companies")
    .select("name, website_url")
    .eq("id", profile.company_id)
    .single();

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-semibold dark:text-slate-100">Company profile</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        A public &quot;more info&quot; link for {company?.name} — shown wherever the platform links
        out to your company (e.g. a Linktree, website, or social hub).
      </p>

      <Card>
        <CardTitle>Details</CardTitle>
        <ActionForm action={updateCompanyProfileAction} className="mt-3 space-y-3">
          <div>
            <Label htmlFor="company_name">Company name</Label>
            <Input id="company_name" value={company?.name ?? ""} disabled />
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Contact your Petra Global Group super admin to change this.
            </p>
          </div>
          <div>
            <Label htmlFor="website_url">More info URL (optional)</Label>
            <Input
              id="website_url"
              name="website_url"
              type="url"
              defaultValue={company?.website_url ?? ""}
              placeholder="https://linktr.ee/yourcompany"
            />
          </div>
          <SubmitButton pendingText="Saving...">Save</SubmitButton>
        </ActionForm>
      </Card>
    </div>
  );
}
