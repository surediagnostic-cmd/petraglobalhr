"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, requireHrOrMd } from "@/lib/auth/session";

export async function createTrainingModuleAction(formData: FormData): Promise<{ error?: string }> {
  const profile = await requireHrOrMd();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "") || null;
  const durationMinutes = formData.get("duration_minutes");
  const departmentId = String(formData.get("department_id") ?? "") || null;
  const designationId = String(formData.get("designation_id") ?? "") || null;
  const isMandatory = formData.get("is_mandatory") === "on";

  if (!title) return { error: "Title is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("hrm_training_modules").insert({
    company_id: profile.company_id,
    title,
    description,
    duration_minutes: durationMinutes ? Number(durationMinutes) : null,
    department_id: departmentId,
    designation_id: designationId,
    is_mandatory: isMandatory,
    created_by: profile.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/training");
  return {};
}

export async function logTrainingAction(
  moduleId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const profile = await requireProfile();
  const hoursLogged = Number(formData.get("hours_logged") ?? 0);
  const status = String(formData.get("status") ?? "in_progress");

  const supabase = await createClient();
  const { error } = await supabase.from("hrm_training_records").upsert(
    {
      module_id: moduleId,
      profile_id: profile.id,
      hours_logged: hoursLogged,
      status,
      completed_at: status === "completed" ? new Date().toISOString() : null,
    },
    { onConflict: "module_id,profile_id" },
  );

  if (error) return { error: error.message };

  revalidatePath("/training");
  return {};
}
