"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireHrOrMd } from "@/lib/auth/session";

export async function createBranchAction(formData: FormData): Promise<{ error?: string }> {
  const profile = await requireHrOrMd();
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim() || null;
  if (!name) return { error: "Name is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("hrm_branches")
    .insert({ company_id: profile.company_id, name, address });

  if (error) return { error: error.message };

  revalidatePath("/admin/branches");
  return {};
}
