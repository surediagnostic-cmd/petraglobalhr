import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { isHrOrMd } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { createGoalAction } from "./actions";
import { PerformanceTabs } from "./performance-tabs";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";

const STATUS_TONE = {
  draft: "neutral",
  active: "warning",
  completed: "success",
  missed: "danger",
} as const;

export default async function GoalsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: goals }, { data: kpis }] = await Promise.all([
    supabase
      .from("hrm_goals")
      .select("id, title, status, period_start, period_end, target_value, target_unit")
      .eq("profile_id", profile.id)
      .order("period_start", { ascending: false }),
    supabase
      .from("hrm_kpi_definitions")
      .select("id, name, target_value, target_unit")
      .order("name"),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-semibold dark:text-slate-100">Performance</h1>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        Set goals, submit progress reports, and track appraisals.
      </p>
      <PerformanceTabs showReview={isHrOrMd(profile.role)} />

      <Card className="mb-6">
        <CardTitle>Set a new goal</CardTitle>
        <ActionForm action={createGoalAction} className="mt-3 space-y-3">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required placeholder="e.g. Complete monthly training hours" />
          </div>
          <div>
            <Label htmlFor="kpi_definition_id">Based on KPI (optional)</Label>
            <Select id="kpi_definition_id" name="kpi_definition_id">
              <option value="">None</option>
              {(kpis ?? []).map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="target_value">Target value</Label>
              <Input id="target_value" name="target_value" type="number" step="any" />
            </div>
            <div>
              <Label htmlFor="target_unit">Unit</Label>
              <Input id="target_unit" name="target_unit" placeholder="e.g. %, hours, score/5" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="period_start">Period start</Label>
              <Input id="period_start" name="period_start" type="date" required />
            </div>
            <div>
              <Label htmlFor="period_end">Period end</Label>
              <Input id="period_end" name="period_end" type="date" required />
            </div>
          </div>
          <SubmitButton pendingText="Saving...">Set goal</SubmitButton>
        </ActionForm>
      </Card>

      <div className="space-y-2">
        {(goals ?? []).map((g) => (
          <Link key={g.id} href={`/goals/${g.id}`}>
            <Card className="transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium dark:text-slate-200">{g.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {g.period_start} → {g.period_end}
                    {g.target_value != null && ` · target ${g.target_value}${g.target_unit ?? ""}`}
                  </p>
                </div>
                <Badge tone={STATUS_TONE[g.status as keyof typeof STATUS_TONE]}>{g.status}</Badge>
              </div>
            </Card>
          </Link>
        ))}
        {goals?.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">No goals set yet.</p>
        )}
      </div>
    </div>
  );
}
