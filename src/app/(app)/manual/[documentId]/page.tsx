import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { AcknowledgeButton } from "./acknowledge-button";
import { Card, CardTitle } from "@/components/ui/card";

export default async function ManualDocumentPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: document } = await supabase
    .from("hrm_manual_documents")
    .select("id, title, version, status")
    .eq("id", documentId)
    .single();

  if (!document) notFound();

  // RLS (`manual_sections_select` + `can_view_section`) already filters this
  // to only the sections this profile is allowed to see.
  const { data: sections } = await supabase
    .from("hrm_manual_sections")
    .select("id, section_number, title, subtitle")
    .eq("document_id", documentId)
    .order("order_index");

  const { data: ack } = await supabase
    .from("hrm_manual_acknowledgements")
    .select("version")
    .eq("document_id", documentId)
    .eq("profile_id", profile.id)
    .maybeSingle();

  const isAcknowledged = ack?.version === document.version;

  return (
    <div className="max-w-2xl">
      <Link href="/manual" className="mb-4 inline-block text-sm text-slate-500 hover:underline">
        ← Back to Manual & Handbook
      </Link>
      <h1 className="mb-1 text-xl font-semibold">{document.title}</h1>
      <p className="mb-6 text-sm text-slate-500">Version {document.version}</p>

      {!isAcknowledged && (
        <Card className="mb-6 border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <p className="mb-3 text-sm text-amber-800 dark:text-amber-300">
            You have not yet acknowledged this version. Please read the sections below, then
            confirm.
          </p>
          <AcknowledgeButton documentId={document.id} version={document.version} />
        </Card>
      )}

      <div className="space-y-2">
        {(sections ?? []).map((s) => (
          <Link key={s.id} href={`/manual/${document.id}/${s.id}`}>
            <Card className="transition-shadow hover:shadow-md">
              <CardTitle>
                §{s.section_number} {s.title}
              </CardTitle>
              {s.subtitle && <p className="mt-1 text-sm text-slate-500">{s.subtitle}</p>}
            </Card>
          </Link>
        ))}
        {sections?.length === 0 && (
          <p className="text-sm text-slate-500">
            No sections visible to your role/department yet.
          </p>
        )}
      </div>
    </div>
  );
}
