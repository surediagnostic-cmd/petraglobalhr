import { requireHrOrMd } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createDesignationAction } from "./actions";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";

const CAREER_TRACKS = ["lab", "radiology", "finance", "marketing", "operations", "other"];

export default async function DesignationsPage() {
  await requireHrOrMd();
  const supabase = await createClient();
  const [{ data: designations }, { data: departments }] = await Promise.all([
    supabase
      .from("hrm_designations")
      .select("id, title, career_track, departments:hrm_departments(name)")
      .order("title")
      .returns<{ id: string; title: string; career_track: string | null; departments: { name: string } | null }[]>(),
    supabase.from("hrm_departments").select("id, name").order("name"),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-xl font-semibold dark:text-slate-100">Designations</h1>

      <Card className="mb-6">
        <CardTitle>Add designation</CardTitle>
        <ActionForm action={createDesignationAction} className="mt-3 space-y-3">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required placeholder="e.g. Lab Scientist" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="department_id">Department</Label>
              <Select id="department_id" name="department_id">
                <option value="">None / company-wide</option>
                {(departments ?? []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="career_track">Career track</Label>
              <Select id="career_track" name="career_track">
                <option value="">None</option>
                {CAREER_TRACKS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <SubmitButton pendingText="Adding...">Add designation</SubmitButton>
        </ActionForm>
      </Card>

      <div className="space-y-2">
        {(designations ?? []).map((d) => (
          <Card key={d.id} className="flex items-center justify-between py-3">
            <span className="dark:text-slate-200">{d.title}</span>
            <div className="flex gap-2">
              {d.departments?.name && <Badge>{d.departments.name}</Badge>}
              {d.career_track && <Badge tone="success">{d.career_track}</Badge>}
            </div>
          </Card>
        ))}
        {designations?.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">No designations yet.</p>
        )}
      </div>
    </div>
  );
}
