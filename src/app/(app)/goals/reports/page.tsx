import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { isHrOrMd } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { PerformanceTabs } from "../performance-tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const REVIEW_TONE = { pending: "warning", approved: "success", changes_requested: "danger" } as const;

export default async function ReportsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  // Every report the current user has ever submitted, across all of their
  // goals — the per-goal detail page only shows one goal's reports at a
  // time, this is the "all of mine, in one place" view.
  const { data: reports } = await supabase
    .from("hrm_goal_reports")
    .select("id, goal_id, period_label, actual_value, narrative, review_status, reviewer_comment, submitted_at, goals:hrm_goals(title)")
    .eq("profile_id", profile.id)
    .order("submitted_at", { ascending: false })
    .returns<
      {
        id: string;
        goal_id: string;
        period_label: string;
        actual_value: number | null;
        narrative: string | null;
        review_status: string;
        reviewer_comment: string | null;
        submitted_at: string;
        goals: { title: string } | null;
      }[]
    >();

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-semibold dark:text-slate-100">Performance</h1>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        Set goals, submit progress reports, and track appraisals.
      </p>
      <PerformanceTabs showReview={isHrOrMd(profile.role)} />

      <div className="space-y-3">
        {(reports ?? []).map((r) => (
          <Card key={r.id}>
            <div className="flex items-center justify-between">
              <div>
                <Link href={`/goals/${r.goal_id}`} className="text-sm font-medium hover:underline dark:text-slate-200">
                  {r.goals?.title ?? "Goal"}
                </Link>
                <p className="text-xs text-slate-500 dark:text-slate-400">{r.period_label}</p>
              </div>
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
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No reports submitted yet — open a goal to submit one.
          </p>
        )}
      </div>
    </div>
  );
}
