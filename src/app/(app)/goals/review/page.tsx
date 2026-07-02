import { requireProfile } from "@/lib/auth/session";
import { isHrOrMd } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReviewReportForm } from "./review-report-form";
import { PerformanceTabs } from "../performance-tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function GoalsReviewPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  // RLS already scopes goal_reports to: the report owner, HR/MD in-company,
  // or a manager whose direct report owns the goal — so a manager who isn't
  // HR/MD still sees their team's pending reports here, not just HR/MD.
  const { data: reports } = await supabase
    .from("hrm_goal_reports")
    .select(
      "id, period_label, actual_value, narrative, review_status, submitted_at, goals:hrm_goals(title, profile_id, profiles:profile_id(full_name))",
    )
    .eq("review_status", "pending")
    .order("submitted_at", { ascending: true })
    .returns<
      {
        id: string;
        period_label: string;
        actual_value: number | null;
        narrative: string | null;
        review_status: string;
        submitted_at: string;
        goals: { title: string; profile_id: string; profiles: { full_name: string } | null } | null;
      }[]
    >();

  if (!reports && !isHrOrMd(profile.role)) redirect("/goals");

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-semibold dark:text-slate-100">Performance</h1>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        Set goals, submit progress reports, and track appraisals.
      </p>
      <PerformanceTabs showReview={isHrOrMd(profile.role)} />

      <div className="space-y-4">
        {(reports ?? []).map((r) => (
          <Card key={r.id}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium dark:text-slate-200">
                  {r.goals?.profiles?.full_name} — {r.goals?.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{r.period_label}</p>
              </div>
              <Badge tone="warning">pending</Badge>
            </div>
            {r.actual_value != null && (
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Actual: {r.actual_value}</p>
            )}
            {r.narrative && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{r.narrative}</p>}
            <ReviewReportForm reportId={r.id} />
          </Card>
        ))}
        {reports?.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">Nothing pending review.</p>
        )}
      </div>
    </div>
  );
}
