import { requireHrOrMd } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { EditStaffRow } from "./edit-staff-row";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { roleLabel } from "@/lib/auth/roles";
import type { RoleTier } from "@/lib/auth/roles";

export default async function StaffPage() {
  await requireHrOrMd();
  const supabase = await createClient();

  const [{ data: staff }, { data: departments }, { data: designations }] = await Promise.all([
    supabase
      .from("hrm_profiles")
      .select(
        "id, full_name, role, department_id, designation_id, reports_to, departments:hrm_departments!department_id(name), designations:hrm_designations!designation_id(title)",
      )
      .order("full_name")
      .returns<
        {
          id: string;
          full_name: string;
          role: string;
          department_id: string | null;
          designation_id: string | null;
          reports_to: string | null;
          departments: { name: string } | null;
          designations: { title: string } | null;
        }[]
      >(),
    supabase.from("hrm_departments").select("id, name").order("name"),
    supabase.from("hrm_designations").select("id, title").order("title"),
  ]);

  const staffOptions = (staff ?? []).map((s) => ({ id: s.id, full_name: s.full_name }));

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-xl font-semibold">Staff</h1>
      <div className="space-y-3">
        {(staff ?? []).map((s) => (
          <Card key={s.id}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{s.full_name}</p>
                <p className="text-xs text-slate-500">
                  {s.designations?.title ?? s.departments?.name ?? "Unassigned"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={s.role === "md" ? "success" : s.role === "hr_manager" ? "warning" : "neutral"}>
                  {roleLabel(s.role as RoleTier)}
                </Badge>
              </div>
            </div>
            <EditStaffRow
              staff={s}
              departments={departments ?? []}
              designations={designations ?? []}
              staffOptions={staffOptions}
            />
          </Card>
        ))}
        {staff?.length === 0 && <p className="text-sm text-slate-500">No staff yet.</p>}
      </div>
    </div>
  );
}
