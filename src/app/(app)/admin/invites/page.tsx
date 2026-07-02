import { requireHrOrMd } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { CreateStaffForm } from "./create-staff-form";
import { RevokeInviteButton } from "./revoke-invite-button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
      <h1 className="mb-1 text-xl font-semibold dark:text-slate-100">Staff accounts</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Creates the login directly with a generated password — share it with the new staff member
        yourself. No email is sent.
      </p>

      <Card className="mb-6">
        <CardTitle>Create a staff account</CardTitle>
        <div className="mt-3">
          <CreateStaffForm branches={branches ?? []} departments={departments ?? []} designations={designations ?? []} />
        </div>
      </Card>

      <div className="space-y-2">
        {(invites ?? []).map((i) => (
          <Card key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium dark:text-slate-200 break-words">{i.email}</p>
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
          <p className="text-sm text-slate-500 dark:text-slate-400">No staff accounts created yet.</p>
        )}
      </div>
    </div>
  );
}
