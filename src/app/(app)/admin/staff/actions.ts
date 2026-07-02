"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireHrOrMd } from "@/lib/auth/session";

export async function updateStaffAction(
  profileId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  await requireHrOrMd();
  const supabase = await createClient();

  const { error } = await supabase
    .from("hrm_profiles")
    .update({
      role: String(formData.get("role") ?? "staff"),
      branch_id: String(formData.get("branch_id") ?? "") || null,
      department_id: String(formData.get("department_id") ?? "") || null,
      designation_id: String(formData.get("designation_id") ?? "") || null,
      reports_to: String(formData.get("reports_to") ?? "") || null,
    })
    .eq("id", profileId);

  if (error) return { error: error.message };

  revalidatePath("/admin/staff");
  return {};
}
