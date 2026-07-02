"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";

export async function createGoalAction(formData: FormData): Promise<{ error?: string }> {
  const profile = await requireProfile();
  const title = String(formData.get("title") ?? "").trim();
  const kpiDefinitionId = String(formData.get("kpi_definition_id") ?? "") || null;
  const targetValue = formData.get("target_value");
  const targetUnit = String(formData.get("target_unit") ?? "") || null;
  const periodStart = String(formData.get("period_start") ?? "");
  const periodEnd = String(formData.get("period_end") ?? "");

  if (!title || !periodStart || !periodEnd) {
    return { error: "Title and period dates are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("hrm_goals").insert({
    profile_id: profile.id,
    company_id: profile.company_id,
    kpi_definition_id: kpiDefinitionId,
    title,
    target_value: targetValue ? Number(targetValue) : null,
    target_unit: targetUnit,
    period_start: periodStart,
    period_end: periodEnd,
    status: "active",
    created_by: profile.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/goals");
  return {};
}

export async function submitReportAction(
  goalId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const profile = await requireProfile();
  const actualValue = formData.get("actual_value");
  const periodLabel = String(formData.get("period_label") ?? "").trim();
  const narrative = String(formData.get("narrative") ?? "");

  if (!periodLabel) return { error: "Period label is required (e.g. \"June 2026\")." };

  const supabase = await createClient();
  const { error } = await supabase.from("hrm_goal_reports").insert({
    goal_id: goalId,
    profile_id: profile.id,
    period_label: periodLabel,
    actual_value: actualValue ? Number(actualValue) : null,
    narrative,
  });

  if (error) return { error: error.message };

  revalidatePath(`/goals/${goalId}`);
  return {};
}

export async function reviewReportAction(
  reportId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  await requireProfile();
  const decision = String(formData.get("decision") ?? "");
  const comment = String(formData.get("reviewer_comment") ?? "");

  if (decision !== "approved" && decision !== "changes_requested") {
    return { error: "Invalid decision." };
  }

  const supabase = await createClient();
  const { data: authUser } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("hrm_goal_reports")
    .update({
      review_status: decision,
      reviewer_comment: comment,
      reviewer_id: authUser.user?.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (error) return { error: error.message };

  revalidatePath("/goals/review");
  return {};
}
