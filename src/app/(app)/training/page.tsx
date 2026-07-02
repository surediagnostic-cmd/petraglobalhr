import { requireProfile } from "@/lib/auth/session";
import { isHrOrMd } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { createTrainingModuleAction } from "./actions";
import { LogTrainingForm } from "./log-training-form";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";

export default async function TrainingPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  // RLS (`can_view_training_module`) already limits this to modules scoped
  // to the caller's department/designation, or company-wide ones.
  const [{ data: modules }, { data: records }, { data: departments }, { data: designations }] =
    await Promise.all([
      supabase
        .from("hrm_training_modules")
        .select("id, title, description, duration_minutes, is_mandatory")
        .order("title"),
      supabase
        .from("hrm_training_records")
        .select("module_id, status, hours_logged, completed_at")
        .eq("profile_id", profile.id),
      isHrOrMd(profile.role)
        ? supabase.from("hrm_departments").select("id, name").order("name")
        : Promise.resolve({ data: [] }),
      isHrOrMd(profile.role)
        ? supabase.from("hrm_designations").select("id, title").order("title")
        : Promise.resolve({ data: [] }),
    ]);

  const recordByModule = new Map((records ?? []).map((r) => [r.module_id, r]));

  const now = new Date();
  const monthHours = (records ?? [])
    .filter((r) => r.completed_at && new Date(r.completed_at).getMonth() === now.getMonth())
    .reduce((sum, r) => sum + Number(r.hours_logged ?? 0), 0);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-semibold dark:text-slate-100">Training</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        {monthHours} hours logged this month (target: 5–8 hrs/month).
      </p>

      {isHrOrMd(profile.role) && (
        <Card className="mb-6">
          <CardTitle>Add training module</CardTitle>
          <ActionForm action={createTrainingModuleAction} className="mt-3 space-y-3">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <Label htmlFor="duration_minutes">Duration (min)</Label>
                <Input id="duration_minutes" name="duration_minutes" type="number" />
              </div>
              <div>
                <Label htmlFor="department_id">Department</Label>
                <Select id="department_id" name="department_id">
                  <option value="">Company-wide</option>
                  {(departments ?? []).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="designation_id">Designation</Label>
                <Select id="designation_id" name="designation_id">
                  <option value="">Any</option>
                  {(designations ?? []).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input type="checkbox" name="is_mandatory" /> Mandatory
            </label>
            <SubmitButton pendingText="Adding...">Add module</SubmitButton>
          </ActionForm>
        </Card>
      )}

      <div className="space-y-3">
        {(modules ?? []).map((m) => {
          const record = recordByModule.get(m.id);
          return (
            <Card key={m.id}>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{m.title}</CardTitle>
                  {m.description && (
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{m.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {m.is_mandatory && <Badge tone="warning">Mandatory</Badge>}
                  <Badge tone={record?.status === "completed" ? "success" : "neutral"}>
                    {record?.status ?? "not started"}
                  </Badge>
                </div>
              </div>
              <LogTrainingForm
                moduleId={m.id}
                currentStatus={record?.status ?? "assigned"}
                currentHours={record?.hours_logged ?? 0}
              />
            </Card>
          );
        })}
        {modules?.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">No training modules assigned yet.</p>
        )}
      </div>
    </div>
  );
}
