import { requireHrOrMd } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createBranchAction } from "./actions";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";

export default async function BranchesPage() {
  await requireHrOrMd();
  const supabase = await createClient();
  const { data: branches } = await supabase
    .from("hrm_branches")
    .select("id, name, address")
    .order("name");

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-semibold dark:text-slate-100">Branches</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Physical locations this company operates from — independent of department.
      </p>

      <Card className="mb-6">
        <CardTitle>Add branch</CardTitle>
        <ActionForm action={createBranchAction} className="mt-3 space-y-3">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required placeholder="e.g. Lekki" />
          </div>
          <div>
            <Label htmlFor="address">Address (optional)</Label>
            <Input id="address" name="address" placeholder="e.g. 12 Admiralty Way, Lekki Phase 1" />
          </div>
          <SubmitButton pendingText="Adding...">Add branch</SubmitButton>
        </ActionForm>
      </Card>

      <div className="space-y-2">
        {(branches ?? []).map((b) => (
          <Card key={b.id} className="py-3">
            <p className="dark:text-slate-200">{b.name}</p>
            {b.address && <p className="text-sm text-slate-500 dark:text-slate-400">{b.address}</p>}
          </Card>
        ))}
        {branches?.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">No branches yet.</p>
        )}
      </div>
    </div>
  );
}
