import Link from "next/link";
import { notFound } from "next/navigation";
import { requireHrOrMd } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { saveAppraisalAction } from "../actions";
import { CHECKLIST_ITEMS } from "../checklist";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";

export default async function AppraisalDetailPage({
  params,
}: {
  params: Promise<{ appraisalId: string }>;
}) {
  const { appraisalId } = await params;
  await requireHrOrMd();
  const supabase = await createClient();

  const { data: appraisal } = await supabase
    .from("hrm_appraisals")
    .select("id, cycle, period_label, score, status, pre_checklist_json, profiles:profile_id(full_name)")
    .eq("id", appraisalId)
    .single<{
      id: string;
      cycle: string;
      period_label: string;
      score: number | null;
      status: string;
      pre_checklist_json: Record<string, boolean>;
      profiles: { full_name: string } | null;
    }>();

  if (!appraisal) notFound();

  const checklist = appraisal.pre_checklist_json ?? {};
  const isCompleted = appraisal.status === "completed";
  const action = saveAppraisalAction.bind(null, appraisalId);

  return (
    <div className="max-w-2xl">
      <Link href="/admin/appraisals" className="mb-4 inline-block text-sm text-slate-500 hover:underline dark:text-slate-400">
        ← Back to Appraisals
      </Link>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold dark:text-slate-100">
            {appraisal.profiles?.full_name} — {appraisal.period_label}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">{appraisal.cycle} appraisal</p>
        </div>
        <Badge tone={isCompleted ? "success" : "warning"}>{appraisal.status}</Badge>
      </div>

      <ActionForm action={action} className="space-y-6">
        <Card>
          <CardTitle>Pre-appraisal checklist</CardTitle>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            All items must be checked before this appraisal can be marked complete (Op Manual 12.4).
          </p>
          <div className="mt-3 space-y-2">
            {CHECKLIST_ITEMS.map((item) => (
              <label key={item.key} className="flex items-center gap-2 text-sm dark:text-slate-300">
                <input
                  type="checkbox"
                  name={item.key}
                  defaultChecked={Boolean(checklist[item.key])}
                  disabled={item.auto || isCompleted}
                />
                {item.label}
                {item.auto && (
                  <span className="text-xs text-slate-400 dark:text-slate-500">(auto-tracked)</span>
                )}
              </label>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle>Score</CardTitle>
          <div className="mt-3 max-w-xs">
            <Label htmlFor="score">Appraisal score (%)</Label>
            <Input
              id="score"
              name="score"
              type="number"
              min="0"
              max="100"
              step="0.1"
              defaultValue={appraisal.score ?? ""}
              disabled={isCompleted}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Staff scoring above 69.9% are recognised at the Staff General Meeting.
            </p>
          </div>
        </Card>

        {!isCompleted && (
          <div className="flex gap-2">
            <SubmitButton name="intent" value="save" variant="secondary" pendingText="Saving...">
              Save
            </SubmitButton>
            <SubmitButton name="intent" value="complete" pendingText="Completing...">
              Mark complete
            </SubmitButton>
          </div>
        )}
      </ActionForm>
    </div>
  );
}
