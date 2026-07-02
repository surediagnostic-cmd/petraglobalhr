import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { submitReportAction } from "../actions";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";

const REVIEW_TONE = { pending: "warning", approved: "success", changes_requested: "danger" } as const;

export default async function GoalDetailPage({ params }: { params: Promise<{ goalId: string }> }) {
  const { goalId } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: goal } = await supabase
    .from("hrm_goals")
    .select("id, title, description, target_value, target_unit, period_start, period_end, status, profile_id")
    .eq("id", goalId)
    .single();

  if (!goal) notFound();

  const { data: reports } = await supabase
    .from("hrm_goal_reports")
    .select("id, period_label, actual_value, narrative, review_status, reviewer_comment, submitted_at")
    .eq("goal_id", goalId)
    .order("submitted_at", { ascending: false });

  const isOwner = goal.profile_id === profile.id;
  const submitAction = submitReportAction.bind(null, goalId);

  return (
    <div className="max-w-2xl">
      <Link href="/goals" className="mb-4 inline-block text-sm text-slate-500 hover:underline dark:text-slate-400">
        ← Back to Goals
      </Link>
      <h1 className="mb-1 text-xl font-semibold dark:text-slate-100">{goal.title}</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        {goal.period_start} → {goal.period_end}
        {goal.target_value != null && ` · target ${goal.target_value}${goal.target_unit ?? ""}`}
      </p>

      {isOwner && (
        <Card className="mb-6">
          <CardTitle>Submit a report</CardTitle>
          <ActionForm action={submitAction} className="mt-3 space-y-3">
            <div>
              <Label htmlFor="period_label">Period</Label>
              <Input id="period_label" name="period_label" required placeholder="e.g. June 2026" />
            </div>
            <div>
              <Label htmlFor="actual_value">Actual value</Label>
              <Input id="actual_value" name="actual_value" type="number" step="any" />
            </div>
            <div>
              <Label htmlFor="narrative">Notes</Label>
              <Textarea id="narrative" name="narrative" rows={3} />
            </div>
            <SubmitButton pendingText="Submitting...">Submit report</SubmitButton>
          </ActionForm>
        </Card>
      )}

      <div className="space-y-3">
        {(reports ?? []).map((r) => (
          <Card key={r.id}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium dark:text-slate-200">{r.period_label}</p>
              <Badge tone={REVIEW_TONE[r.review_status as keyof typeof REVIEW_TONE]}>
                {r.review_status}
              </Badge>
            </div>
            {r.actual_value != null && (
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Actual: {r.actual_value}</p>
            )}
            {r.narrative && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{r.narrative}</p>}
            {r.reviewer_comment && (
              <p className="mt-2 text-sm italic text-slate-500 dark:text-slate-400">
                Reviewer: {r.reviewer_comment}
              </p>
            )}
          </Card>
        ))}
        {reports?.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">No reports submitted yet.</p>
        )}
      </div>
    </div>
  );
}
