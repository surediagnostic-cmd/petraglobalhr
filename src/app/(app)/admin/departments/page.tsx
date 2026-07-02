import { requireHrOrMd } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createDepartmentAction } from "./actions";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";

export default async function DepartmentsPage() {
  await requireHrOrMd();
  const supabase = await createClient();
  const { data: departments } = await supabase
    .from("hrm_departments")
    .select("id, name")
    .order("name");

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-xl font-semibold dark:text-slate-100">Departments</h1>

      <Card className="mb-6">
        <CardTitle>Add department</CardTitle>
        <ActionForm action={createDepartmentAction} className="mt-3 flex items-end gap-3">
          <div className="flex-1">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required placeholder="e.g. Laboratory" />
          </div>
          <SubmitButton pendingText="Adding...">Add</SubmitButton>
        </ActionForm>
      </Card>

      <div className="space-y-2">
        {(departments ?? []).map((d) => (
          <Card key={d.id} className="py-3 dark:text-slate-200">
            {d.name}
          </Card>
        ))}
        {departments?.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">No departments yet.</p>
        )}
      </div>
    </div>
  );
}
