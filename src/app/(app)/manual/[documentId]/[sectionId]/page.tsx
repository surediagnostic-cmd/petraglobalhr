import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Markdown } from "@/components/markdown";

export default async function ManualSectionPage({
  params,
}: {
  params: Promise<{ documentId: string; sectionId: string }>;
}) {
  const { documentId, sectionId } = await params;
  await requireProfile();
  const supabase = await createClient();

  // If this profile isn't allowed to see the section, RLS returns zero rows
  // here rather than an error — notFound() is the correct response either way.
  const { data: section } = await supabase
    .from("hrm_manual_sections")
    .select("id, section_number, title, subtitle, body, who_is_responsible, escalation_chain")
    .eq("id", sectionId)
    .eq("document_id", documentId)
    .single();

  if (!section) notFound();

  return (
    <div className="max-w-3xl">
      <Link href={`/manual/${documentId}`} className="mb-4 inline-block text-sm text-slate-500 hover:underline">
        ← Back
      </Link>
      <h1 className="mb-1 text-xl font-semibold dark:text-slate-100">
        §{section.section_number} {section.title}
      </h1>
      {section.subtitle && (
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">{section.subtitle}</p>
      )}

      <Card className="mb-4">
        <Markdown>{section.body}</Markdown>
      </Card>

      {(section.who_is_responsible || section.escalation_chain) && (
        <Card className="space-y-2 text-sm dark:text-slate-300">
          {section.who_is_responsible && (
            <p>
              <span className="font-medium dark:text-slate-100">Who is responsible: </span>
              {section.who_is_responsible}
            </p>
          )}
          {section.escalation_chain && (
            <p>
              <span className="font-medium dark:text-slate-100">Escalation: </span>
              {section.escalation_chain}
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
