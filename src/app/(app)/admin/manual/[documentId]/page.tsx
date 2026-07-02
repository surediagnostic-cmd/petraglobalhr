import Link from "next/link";
import { notFound } from "next/navigation";
import { requireHrOrMd } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { CreateSectionForm } from "./create-section-form";
import { DeleteSectionButton } from "./delete-section-button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminManualDocumentPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  await requireHrOrMd();
  const { documentId } = await params;
  const supabase = await createClient();

  const { data: document } = await supabase
    .from("hrm_manual_documents")
    .select("id, title, version, status")
    .eq("id", documentId)
    .single();

  if (!document) notFound();

  const { data: sections } = await supabase
    .from("hrm_manual_sections")
    .select("id, section_number, title, subtitle, md_only")
    .eq("document_id", documentId)
    .order("order_index");

  return (
    <div className="max-w-2xl">
      <Link href="/admin/manual" className="mb-4 inline-block text-sm text-slate-500 hover:underline dark:text-slate-400">
        ← Back to Manual & Handbook
      </Link>
      <h1 className="mb-1 text-xl font-semibold dark:text-slate-100">{document.title}</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">Version {document.version}</p>

      <Card className="mb-6">
        <CardTitle>Add a section</CardTitle>
        <div className="mt-3">
          <CreateSectionForm documentId={document.id} />
        </div>
      </Card>

      <div className="space-y-2">
        {(sections ?? []).map((s) => (
          <Card key={s.id}>
            <div className="flex items-center justify-between gap-3">
              <Link href={`/admin/manual/${document.id}/${s.id}`} className="min-w-0 flex-1 hover:underline">
                <CardTitle>
                  §{s.section_number} {s.title}
                </CardTitle>
                {s.subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{s.subtitle}</p>}
              </Link>
              <div className="flex shrink-0 items-center gap-2">
                {s.md_only && <Badge tone="warning">MD/HR only</Badge>}
                <DeleteSectionButton documentId={document.id} sectionId={s.id} />
              </div>
            </div>
          </Card>
        ))}
        {sections?.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">No sections yet — add one above.</p>
        )}
      </div>
    </div>
  );
}
