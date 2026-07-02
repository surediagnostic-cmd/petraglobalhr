import { requireProfile } from "@/lib/auth/session";
import { isHrOrMd } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { PerformanceTabs } from "../performance-tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_TONE = { pending: "warning", completed: "success" } as const;

export default async function MyAppraisalsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: appraisals } = await supabase
    .from("hrm_appraisals")
    .select("id, cycle, period_label, score, status, conducted_at")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-semibold dark:text-slate-100">Performance</h1>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        Set goals, submit progress reports, and track appraisals.
      </p>
      <PerformanceTabs showReview={isHrOrMd(profile.role)} />

      <div className="space-y-3">
        {(appraisals ?? []).map((a) => (
          <Card key={a.id}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium capitalize dark:text-slate-200">
                  {a.cycle} — {a.period_label}
                </p>
                {a.conducted_at && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Conducted {new Date(a.conducted_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {a.score != null && (
                  <Badge tone={a.score >= 69.9 ? "success" : "neutral"}>{a.score}%</Badge>
                )}
                <Badge tone={STATUS_TONE[a.status as keyof typeof STATUS_TONE]}>{a.status}</Badge>
              </div>
            </div>
          </Card>
        ))}
        {appraisals?.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">No appraisals recorded yet.</p>
        )}
      </div>
    </div>
  );
}
