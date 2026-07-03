"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireHrOrMd } from "@/lib/auth/session";

// hrm_companies has no RLS policy letting HR/MD update their own row at
// all (only super-admin select/insert exist — see 0001/0007) — adding a
// broad UPDATE policy would also open the door to changing name/slug via
// a direct API call. Using the service-role client instead keeps this
// scoped to exactly the one column this action ever touches.
export async function updateCompanyProfileAction(formData: FormData): Promise<{ error?: string }> {
  const profile = await requireHrOrMd();
  const websiteUrl = String(formData.get("website_url") ?? "").trim() || null;

  if (websiteUrl) {
    try {
      new URL(websiteUrl);
    } catch {
      return { error: "Enter a valid URL, including https://" };
    }
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("hrm_companies")
    .update({ website_url: websiteUrl })
    .eq("id", profile.company_id);

  if (error) return { error: error.message };

  revalidatePath("/admin/company-profile");
  return {};
}
