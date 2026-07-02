import Link from "next/link";
import { requireHrOrMd } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { startAppraisalAction } from "./actions";
import { Card, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";

const STATUS_TONE = { pending: "warning", completed: "success" } as const;

export default async function AdminAppraisalsPage() {
  await requireHrOrMd();
  const supabase = await createClient();

  const [{ data: staff }, { data: appraisals }] = await Promise.all([
    supabase.from("hrm_profiles").select("id, full_name").order("full_name"),
    supabase
      .from("hrm_appraisals")
      .select("id, cycle, period_label, score, status, created_at, profiles:profile_id(full_name)")
      .order("created_at", { ascending: false })
      .returns<
        {
          id: string;
          cycle: string;
          period_label: string;
          score: number | null;
          status: string;
          created_at: string;
          profiles: { full_name: string } | null;
        }[]
      >(),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-xl font-semibold dark:text-slate-100">Appraisals</h1>

      <Card className="mb-6">
        <CardTitle>Start an appraisal</CardTitle>
        <ActionForm action={startAppraisalAction} className="mt-3 space-y-3">
          <div>
            <Label htmlFor="profile_id">Staff member</Label>
            <Select id="profile_id" name="profile_id" required>
              <option value="">Select...</option>
              {(staff ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="cycle">Cycle</Label>
              <Select id="cycle" name="cycle" defaultValue="quarterly">
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="period_label">Period</Label>
              <Input id="period_label" name="period_label" required placeholder="e.g. Q3 2026" />
            </div>
          </div>
          <SubmitButton pendingText="Starting...">Start appraisal</SubmitButton>
        </ActionForm>
      </Card>

      <div className="space-y-2">
        {(appraisals ?? []).map((a) => (
          <Link key={a.id} href={`/admin/appraisals/${a.id}`}>
            <Card className="flex items-center justify-between transition-shadow hover:shadow-md">
              <div>
                <p className="text-sm font-medium dark:text-slate-200">
                  {a.profiles?.full_name} — {a.period_label}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {a.cycle}
                  {a.score != null && ` · score ${a.score}`}
                </p>
              </div>
              <Badge tone={STATUS_TONE[a.status as keyof typeof STATUS_TONE]}>{a.status}</Badge>
            </Card>
          </Link>
        ))}
        {appraisals?.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">No appraisals started yet.</p>
        )}
      </div>
    </div>
  );
}
