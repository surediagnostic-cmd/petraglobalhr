import Link from "next/link";
import { notFound } from "next/navigation";
import { requireHrOrMd } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { SectionEditForm } from "./section-edit-form";
import { KpiForm } from "./kpi-form";
import { DeleteKpiButton } from "./delete-kpi-button";
import { Card, CardTitle } from "@/components/ui/card";

export default async function AdminManualSectionPage({
  params,
}: {
  params: Promise<{ documentId: string; sectionId: string }>;
}) {
  await requireHrOrMd();
  const { documentId, sectionId } = await params;
  const supabase = await createClient();

  const [{ data: section }, { data: visibility }, { data: departments }, { data: kpis }] = await Promise.all([
    supabase
      .from("hrm_manual_sections")
      .select("section_number, title, subtitle, body, who_is_responsible, escalation_chain, md_only")
      .eq("id", sectionId)
      .single(),
    supabase.from("hrm_manual_section_visibility").select("department_id").eq("section_id", sectionId),
    supabase.from("hrm_departments").select("id, name").order("name"),
    supabase
      .from("hrm_kpi_definitions")
      .select("id, name, target_value, target_unit, review_frequency")
      .eq("section_id", sectionId)
      .order("name"),
  ]);

  if (!section) notFound();

  const visibleDepartmentIds = (visibility ?? []).map((v) => v.department_id).filter((id): id is string => !!id);

  return (
    <div className="max-w-2xl">
      <Link
        href={`/admin/manual/${documentId}`}
        className="mb-4 inline-block text-sm text-slate-500 hover:underline dark:text-slate-400"
      >
        ← Back to sections
      </Link>
      <h1 className="mb-6 text-xl font-semibold dark:text-slate-100">
        §{section.section_number} {section.title}
      </h1>

      <Card className="mb-6">
        <SectionEditForm
          documentId={documentId}
          sectionId={sectionId}
          section={section}
          departments={departments ?? []}
          visibleDepartmentIds={visibleDepartmentIds}
        />
      </Card>

      <Card>
        <CardTitle>KPIs for this section</CardTitle>
        <p className="mt-1 mb-3 text-sm text-slate-500 dark:text-slate-400">
          Staff and managers pull these into their own goals from the Performance tab.
        </p>
        <div className="mb-4">
          <KpiForm sectionId={sectionId} />
        </div>
        <div className="space-y-2">
          {(kpis ?? []).map((k) => (
            <div
              key={k.id}
              className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
            >
              <span className="dark:text-slate-200">
                {k.name}
                {k.target_value != null && (
                  <span className="text-slate-500 dark:text-slate-400">
                    {" "}
                    — target {k.target_value}
                    {k.target_unit ?? ""} ({k.review_frequency})
                  </span>
                )}
              </span>
              <DeleteKpiButton kpiId={k.id} />
            </div>
          ))}
          {kpis?.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">No KPIs attached yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
