import { requireHrOrMd } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
    </Card>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
      <div
        className="h-full rounded-full bg-slate-900 dark:bg-slate-100"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export default async function AnalyticsPage() {
  const profile = await requireHrOrMd();
  const supabase = await createClient();

  const [
    { data: staff },
    { data: departments },
    { data: goals },
    { data: goalReports },
    { data: trainingRecords },
    { data: trainingModules },
    { data: appraisals },
    { data: activeManuals },
  ] = await Promise.all([
    supabase.from("hrm_profiles").select("id, role, department_id, employment_status"),
    supabase.from("hrm_departments").select("id, name"),
    supabase.from("hrm_goals").select("id, status"),
    supabase.from("hrm_goal_reports").select("id, review_status"),
    supabase.from("hrm_training_records").select("id, status, hours_logged, completed_at"),
    supabase.from("hrm_training_modules").select("id"),
    supabase.from("hrm_appraisals").select("id, status"),
    supabase
      .from("hrm_manual_documents")
      .select("id, doc_type, version")
      .eq("status", "active"),
  ]);

  const totalStaff = staff?.length ?? 0;
  const activeStaff = (staff ?? []).filter((s) => s.employment_status === "active").length;

  const departmentNameById = new Map((departments ?? []).map((d) => [d.id, d.name]));
  const staffByDepartment = new Map<string, number>();
  for (const s of staff ?? []) {
    const label = s.department_id ? departmentNameById.get(s.department_id) ?? "Unknown" : "Unassigned";
    staffByDepartment.set(label, (staffByDepartment.get(label) ?? 0) + 1);
  }

  const staffByRole = { staff: 0, hr_manager: 0, md: 0 } as Record<string, number>;
  for (const s of staff ?? []) staffByRole[s.role] = (staffByRole[s.role] ?? 0) + 1;

  const goalsByStatus = { draft: 0, active: 0, completed: 0, missed: 0 } as Record<string, number>;
  for (const g of goals ?? []) goalsByStatus[g.status] = (goalsByStatus[g.status] ?? 0) + 1;

  const pendingReports = (goalReports ?? []).filter((r) => r.review_status === "pending").length;

  const completedTraining = (trainingRecords ?? []).filter((r) => r.status === "completed").length;
  const trainingCompletionRate =
    trainingRecords && trainingRecords.length > 0
      ? Math.round((completedTraining / trainingRecords.length) * 100)
      : 0;

  const now = new Date();
  const monthHours = (trainingRecords ?? [])
    .filter((r) => r.completed_at && new Date(r.completed_at).getMonth() === now.getMonth())
    .reduce((sum, r) => sum + Number(r.hours_logged ?? 0), 0);

  const appraisalsByStatus = new Map<string, number>();
  for (const a of appraisals ?? []) {
    appraisalsByStatus.set(a.status, (appraisalsByStatus.get(a.status) ?? 0) + 1);
  }

  // Acknowledgement completion, per active document (operation manual /
  // staff handbook), against total staff — a direct read on the §12.4
  // pre-appraisal gate's compliance state across the whole company.
  const ackByDocument: { title: string; version: string; acknowledgedCount: number }[] = [];
  for (const doc of activeManuals ?? []) {
    const { count } = await supabase
      .from("hrm_manual_acknowledgements")
      .select("id", { count: "exact", head: true })
      .eq("document_id", doc.id)
      .eq("version", doc.version);
    ackByDocument.push({
      title: doc.doc_type === "operation_manual" ? "Operation Manual" : "Staff Handbook",
      version: doc.version,
      acknowledgedCount: count ?? 0,
    });
  }

  return (
    <div className="max-w-4xl">
      <h1 className="mb-1 text-xl font-semibold dark:text-slate-100">Analytics</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        {profile.company_name} — company-wide numbers.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total staff" value={totalStaff} sub={`${activeStaff} active`} />
        <StatCard label="Pending reviews" value={pendingReports} sub="goal reports awaiting review" />
        <StatCard label="Training completion" value={`${trainingCompletionRate}%`} sub={`${monthHours}h logged this month`} />
        <StatCard
          label="HR / MD"
          value={staffByRole.hr_manager + staffByRole.md}
          sub={`${staffByRole.hr_manager} HR · ${staffByRole.md} MD`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardTitle>Staff by department</CardTitle>
          <div className="mt-3 space-y-2">
            {[...staffByDepartment.entries()].map(([name, count]) => (
              <div key={name} className="flex items-center justify-between text-sm">
                <span className="text-slate-700 dark:text-slate-300">{name}</span>
                <Badge>{count}</Badge>
              </div>
            ))}
            {staffByDepartment.size === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">No staff yet.</p>
            )}
          </div>
        </Card>

        <Card>
          <CardTitle>Goals</CardTitle>
          <div className="mt-3 space-y-2">
            {Object.entries(goalsByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span className="capitalize text-slate-700 dark:text-slate-300">{status}</span>
                <Badge
                  tone={status === "completed" ? "success" : status === "missed" ? "danger" : "neutral"}
                >
                  {count}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle>Manual & handbook acknowledgement</CardTitle>
          <div className="mt-3 space-y-3">
            {ackByDocument.map((d) => {
              const pct = totalStaff > 0 ? Math.round((d.acknowledgedCount / totalStaff) * 100) : 0;
              return (
                <div key={d.title}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-700 dark:text-slate-300">
                      {d.title} <span className="text-slate-400 dark:text-slate-500">v{d.version}</span>
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {d.acknowledgedCount}/{totalStaff} ({pct}%)
                    </span>
                  </div>
                  <ProgressBar value={pct} />
                </div>
              );
            })}
            {ackByDocument.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">No active documents yet.</p>
            )}
          </div>
        </Card>

        <Card>
          <CardTitle>Appraisals & training modules</CardTitle>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-700 dark:text-slate-300">Training modules</span>
              <Badge>{trainingModules?.length ?? 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-700 dark:text-slate-300">Training records completed</span>
              <Badge tone="success">{completedTraining}</Badge>
            </div>
            {[...appraisalsByStatus.entries()].map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="capitalize text-slate-700 dark:text-slate-300">Appraisals — {status}</span>
                <Badge>{count}</Badge>
              </div>
            ))}
            {appraisalsByStatus.size === 0 && (
              <p className="text-slate-500 dark:text-slate-400">No appraisals recorded yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
