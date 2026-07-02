import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { roleLabel } from "@/lib/auth/roles";
import type { RoleTier } from "@/lib/auth/roles";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DirectoryPage() {
  await requireProfile();
  const supabase = await createClient();

  const { data: staff } = await supabase
    .from("hrm_profiles")
    .select("id, full_name, role, phone, departments:hrm_departments(name), designations:hrm_designations(title), manager:reports_to(full_name)")
    .order("full_name")
    .returns<
      {
        id: string;
        full_name: string;
        role: string;
        phone: string | null;
        departments: { name: string } | null;
        designations: { title: string } | null;
        manager: { full_name: string } | null;
      }[]
    >();

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-xl font-semibold">Directory</h1>
      <div className="space-y-2">
        {(staff ?? []).map((s) => (
          <Card key={s.id} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{s.full_name}</p>
              <p className="text-xs text-slate-500">
                {s.designations?.title ?? s.departments?.name ?? "Unassigned"}
                {s.manager?.full_name && ` · reports to ${s.manager.full_name}`}
              </p>
              {s.phone && <p className="text-xs text-slate-400">{s.phone}</p>}
            </div>
            <Badge tone={s.role === "md" ? "success" : s.role === "hr_manager" ? "warning" : "neutral"}>
              {roleLabel(s.role as RoleTier)}
            </Badge>
          </Card>
        ))}
        {staff?.length === 0 && <p className="text-sm text-slate-500">No staff yet.</p>}
      </div>
    </div>
  );
}
