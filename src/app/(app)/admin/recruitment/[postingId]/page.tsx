import Link from "next/link";
import { notFound } from "next/navigation";
import { requireHrOrMd } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { CreateCandidateForm } from "./create-candidate-form";
import { CandidateStageSelect } from "./candidate-stage-select";
import { Card, CardTitle } from "@/components/ui/card";
import type { CandidateStage } from "@/lib/types";

export default async function JobPostingPage({
  params,
}: {
  params: Promise<{ postingId: string }>;
}) {
  await requireHrOrMd();
  const { postingId } = await params;
  const supabase = await createClient();

  const [{ data: posting }, { data: candidates }] = await Promise.all([
    supabase.from("hrm_job_postings").select("id, title, description, status").eq("id", postingId).single(),
    supabase
      .from("hrm_candidates")
      .select("id, full_name, email, phone, stage, notes, created_at")
      .eq("job_posting_id", postingId)
      .order("created_at", { ascending: false })
      .returns<
        {
          id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          stage: CandidateStage;
          notes: string | null;
          created_at: string;
        }[]
      >(),
  ]);

  if (!posting) notFound();

  return (
    <div className="max-w-3xl">
      <Link href="/admin/recruitment" className="mb-4 inline-block text-sm text-slate-500 hover:underline dark:text-slate-400">
        ← Back to Recruitment
      </Link>
      <h1 className="mb-1 text-xl font-semibold dark:text-slate-100">{posting.title}</h1>
      {posting.description && (
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">{posting.description}</p>
      )}

      <Card className="mb-6">
        <CardTitle>Add a candidate</CardTitle>
        <div className="mt-3">
          <CreateCandidateForm postingId={postingId} />
        </div>
      </Card>

      <div className="space-y-2">
        {(candidates ?? []).map((c) => (
          <Card key={c.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium dark:text-slate-200">{c.full_name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {[c.email, c.phone].filter(Boolean).join(" · ") || "No contact details"}
                </p>
                {c.notes && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{c.notes}</p>}
              </div>
              <CandidateStageSelect postingId={postingId} candidateId={c.id} stage={c.stage} />
            </div>
          </Card>
        ))}
        {candidates?.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">No candidates added yet.</p>
        )}
      </div>
    </div>
  );
}
