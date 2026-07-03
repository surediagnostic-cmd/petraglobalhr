import Link from "next/link";
import { requireHrOrMd } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createJobPostingAction } from "./actions";
import { JobPostingActions } from "./job-posting-actions";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";

export default async function RecruitmentPage() {
  await requireHrOrMd();
  const supabase = await createClient();

  const [{ data: postings }, { data: branches }, { data: departments }, { data: designations }, { data: candidates }] =
    await Promise.all([
      supabase
        .from("hrm_job_postings")
        .select("id, title, status, branches:hrm_branches(name), departments:hrm_departments(name)")
        .order("created_at", { ascending: false })
        .returns<
          { id: string; title: string; status: string; branches: { name: string } | null; departments: { name: string } | null }[]
        >(),
      supabase.from("hrm_branches").select("id, name").order("name"),
      supabase.from("hrm_departments").select("id, name").order("name"),
      supabase.from("hrm_designations").select("id, title").order("title"),
      supabase.from("hrm_candidates").select("id, job_posting_id, stage"),
    ]);

  const candidateCountByPosting = new Map<string, number>();
  for (const c of candidates ?? []) {
    candidateCountByPosting.set(c.job_posting_id, (candidateCountByPosting.get(c.job_posting_id) ?? 0) + 1);
  }
  const hiredCountByPosting = new Map<string, number>();
  for (const c of candidates ?? []) {
    if (c.stage === "hired") {
      hiredCountByPosting.set(c.job_posting_id, (hiredCountByPosting.get(c.job_posting_id) ?? 0) + 1);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-semibold dark:text-slate-100">Recruitment</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Internal tracker — post an opening, then add candidates you've sourced (referrals,
        LinkedIn, email) and move them through the pipeline. No public application form.
      </p>

      <Card className="mb-6">
        <CardTitle>Post an opening</CardTitle>
        <ActionForm action={createJobPostingAction} className="mt-3 space-y-3">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required placeholder="e.g. Lab Scientist" />
          </div>
          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Input id="description" name="description" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="branch_id">Branch</Label>
              <Select id="branch_id" name="branch_id">
                <option value="">Any</option>
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
                <option value="">Any</option>
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
                <option value="">Any</option>
                {(designations ?? []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <SubmitButton pendingText="Posting...">Post opening</SubmitButton>
        </ActionForm>
      </Card>

      <div className="space-y-2">
        {(postings ?? []).map((p) => (
          <Card key={p.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link href={`/admin/recruitment/${p.id}`} className="min-w-0 hover:underline">
                <CardTitle>{p.title}</CardTitle>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {p.departments?.name ?? "Any department"}
                  {p.branches?.name ? ` · ${p.branches.name}` : ""} ·{" "}
                  {candidateCountByPosting.get(p.id) ?? 0} candidate(s)
                  {(hiredCountByPosting.get(p.id) ?? 0) > 0 ? ` · ${hiredCountByPosting.get(p.id)} hired` : ""}
                </p>
              </Link>
              <div className="flex shrink-0 items-center gap-2">
                <Badge tone={p.status === "open" ? "success" : "neutral"}>{p.status}</Badge>
                <JobPostingActions postingId={p.id} status={p.status as "open" | "closed"} />
              </div>
            </div>
          </Card>
        ))}
        {postings?.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">No openings posted yet.</p>
        )}
      </div>
    </div>
  );
}
