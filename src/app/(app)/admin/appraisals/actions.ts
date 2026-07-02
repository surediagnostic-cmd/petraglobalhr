"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireHrOrMd } from "@/lib/auth/session";
import type { SupabaseClient } from "@supabase/supabase-js";

// The two "auto" items are derived from manual_acknowledgements against the
// active document of each type — not manually ticked, since we already
// have the real signal for them elsewhere in the app (mirrors Op Manual
// §12.4's pre-appraisal checklist).
async function computeAutoChecklist(
  supabase: SupabaseClient,
  companyId: string,
  profileId: string,
): Promise<{ manual_acknowledged: boolean; handbook_acknowledged: boolean }> {
  const { data: activeDocs } = await supabase
    .from("hrm_manual_documents")
    .select("id, doc_type, version")
    .eq("company_id", companyId)
    .eq("status", "active");

  const result = { manual_acknowledged: false, handbook_acknowledged: false };

  for (const doc of activeDocs ?? []) {
    const { count } = await supabase
      .from("hrm_manual_acknowledgements")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .eq("document_id", doc.id)
      .eq("version", doc.version);

    if ((count ?? 0) > 0) {
      if (doc.doc_type === "operation_manual") result.manual_acknowledged = true;
      if (doc.doc_type === "staff_handbook") result.handbook_acknowledged = true;
    }
  }

  return result;
}

export async function startAppraisalAction(formData: FormData): Promise<{ error?: string }> {
  const profile = await requireHrOrMd();
  const targetProfileId = String(formData.get("profile_id") ?? "");
  const cycle = String(formData.get("cycle") ?? "");
  const periodLabel = String(formData.get("period_label") ?? "").trim();

  if (!targetProfileId || !periodLabel) return { error: "Staff member and period are required." };
  if (cycle !== "quarterly" && cycle !== "annual") return { error: "Invalid cycle." };

  const supabase = await createClient();
  const auto = await computeAutoChecklist(supabase, profile.company_id, targetProfileId);

  const { data: appraisal, error } = await supabase
    .from("hrm_appraisals")
    .insert({
      profile_id: targetProfileId,
      company_id: profile.company_id,
      cycle,
      period_label: periodLabel,
      status: "pending",
      pre_checklist_json: {
        employment_letter_on_file: false,
        job_description_signed: false,
        tools_issued: false,
        id_card_issued: false,
        ...auto,
      },
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin/appraisals");
  redirect(`/admin/appraisals/${appraisal.id}`);
}

export async function saveAppraisalAction(
  appraisalId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const profile = await requireHrOrMd();
  const supabase = await createClient();

  const { data: appraisal, error: fetchError } = await supabase
    .from("hrm_appraisals")
    .select("id, profile_id, company_id")
    .eq("id", appraisalId)
    .single();

  if (fetchError || !appraisal) return { error: "Appraisal not found." };

  const auto = await computeAutoChecklist(supabase, appraisal.company_id, appraisal.profile_id);
  const checklist = {
    employment_letter_on_file: formData.get("employment_letter_on_file") === "on",
    job_description_signed: formData.get("job_description_signed") === "on",
    tools_issued: formData.get("tools_issued") === "on",
    id_card_issued: formData.get("id_card_issued") === "on",
    ...auto,
  };

  const scoreRaw = formData.get("score");
  const score = scoreRaw ? Number(scoreRaw) : null;
  const intent = String(formData.get("intent") ?? "save");

  if (intent === "complete") {
    const allChecked = Object.values(checklist).every(Boolean);
    if (!allChecked) {
      return { error: "All checklist items must be complete before the appraisal can be marked complete." };
    }
  }

  const { error } = await supabase
    .from("hrm_appraisals")
    .update({
      pre_checklist_json: checklist,
      score,
      ...(intent === "complete"
        ? { status: "completed", conducted_by: profile.id, conducted_at: new Date().toISOString() }
        : {}),
    })
    .eq("id", appraisalId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/appraisals/${appraisalId}`);
  revalidatePath("/admin/appraisals");
  return {};
}
