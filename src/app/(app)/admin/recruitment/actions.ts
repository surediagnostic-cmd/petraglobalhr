"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireHrOrMd } from "@/lib/auth/session";

export async function createJobPostingAction(formData: FormData): Promise<{ error?: string }> {
  const profile = await requireHrOrMd();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const branchId = String(formData.get("branch_id") ?? "") || null;
  const departmentId = String(formData.get("department_id") ?? "") || null;
  const designationId = String(formData.get("designation_id") ?? "") || null;

  if (!title) return { error: "Title is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("hrm_job_postings").insert({
    company_id: profile.company_id,
    branch_id: branchId,
    department_id: departmentId,
    designation_id: designationId,
    title,
    description,
    created_by: profile.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/recruitment");
  return {};
}

export async function setJobPostingStatusAction(postingId: string, status: "open" | "closed"): Promise<void> {
  await requireHrOrMd();
  const supabase = await createClient();
  await supabase.from("hrm_job_postings").update({ status }).eq("id", postingId);
  revalidatePath("/admin/recruitment");
}

export async function createCandidateAction(
  postingId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const profile = await requireHrOrMd();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!fullName) return { error: "Full name is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("hrm_candidates").insert({
    company_id: profile.company_id,
    job_posting_id: postingId,
    full_name: fullName,
    email,
    phone,
    notes,
    created_by: profile.id,
  });

  if (error) return { error: error.message };

  revalidatePath(`/admin/recruitment/${postingId}`);
  return {};
}

export async function updateCandidateStageAction(
  postingId: string,
  candidateId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  await requireHrOrMd();
  const stage = String(formData.get("stage") ?? "applied");

  const supabase = await createClient();
  const { error } = await supabase.from("hrm_candidates").update({ stage }).eq("id", candidateId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/recruitment/${postingId}`);
  return {};
}
