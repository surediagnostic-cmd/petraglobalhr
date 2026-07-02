"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireHrOrMd } from "@/lib/auth/session";

export async function createDepartmentAction(formData: FormData): Promise<{ error?: string }> {
  const profile = await requireHrOrMd();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("hrm_departments")
    .insert({ company_id: profile.company_id, name });

  if (error) return { error: error.message };

  revalidatePath("/admin/departments");
  return {};
}
