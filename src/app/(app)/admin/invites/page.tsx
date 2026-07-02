import { requireHrOrMd } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createInviteAction } from "./actions";
import { RevokeInviteButton } from "./revoke-invite-button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";

export default async function InvitesPage() {
  await requireHrOrMd();
  const supabase = await createClient();
  const [{ data: invites }, { data: branches }, { data: departments }, { data: designations }] = await Promise.all([
    supabase
      .from("hrm_invites")
      .select(
        "id, email, role, status, created_at, branches:hrm_branches(name), departments:hrm_departments(name), designations:hrm_designations(title)",
      )
      .order("created_at", { ascending: false })
      .returns<
        {
          id: string;
          email: string;
          role: string;
          status: string;
          created_at: string;
          branches: { name: string } | null;
          departments: { name: string } | null;
          designations: { title: string } | null;
        }[]
      >(),
    supabase.from("hrm_branches").select("id, name").order("name"),
    supabase.from("hrm_departments").select("id, name").order("name"),
    supabase.from("hrm_designations").select("id, title").order("title"),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-xl font-semibold dark:text-slate-100">Invites</h1>

      <Card className="mb-6">
        <CardTitle>Invite a new staff member</CardTitle>
        <ActionForm action={createInviteAction} className="mt-3 space-y-3">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <Label htmlFor="branch_id">Branch</Label>
              <Select id="branch_id" name="branch_id">
                <option value="">None</option>
                {(branches ?? []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="department_id">Department</Label>
              <Select id="department_id" name="department_id">
                <option value="">None</option>
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
                <option value="">None</option>
                {(designations ?? []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select id="role" name="role" defaultValue="staff">
                <option value="staff">Staff</option>
                <option value="hr_manager">HR Manager</option>
                <option value="md">MD</option>
              </Select>
            </div>
          </div>
          <SubmitButton pendingText="Sending...">Send invite</SubmitButton>
        </ActionForm>
      </Card>

      <div className="space-y-2">
        {(invites ?? []).map((i) => (
          <Card key={i.id} className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium dark:text-slate-200">{i.email}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {i.designations?.title ?? i.departments?.name ?? "—"}
                {i.branches?.name ? ` · ${i.branches.name}` : ""} · {i.role}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={i.status === "pending" ? "warning" : i.status === "accepted" ? "success" : "neutral"}>
                {i.status}
              </Badge>
              {i.status === "pending" && <RevokeInviteButton inviteId={i.id} />}
            </div>
          </Card>
        ))}
        {invites?.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">No invites sent yet.</p>
        )}
      </div>
    </div>
  );
}
