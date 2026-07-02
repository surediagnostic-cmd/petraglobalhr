"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireHrOrMd } from "@/lib/auth/session";

export async function createDesignationAction(formData: FormData): Promise<{ error?: string }> {
  const profile = await requireHrOrMd();
  const title = String(formData.get("title") ?? "").trim();
  const departmentId = String(formData.get("department_id") ?? "") || null;
  const careerTrack = String(formData.get("career_track") ?? "") || null;

  if (!title) return { error: "Title is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("hrm_designations").insert({
    company_id: profile.company_id,
    title,
    department_id: departmentId,
    career_track: careerTrack,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/designations");
  return {};
}
