"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";

export async function acknowledgeDocumentAction(
  documentId: string,
  version: string,
): Promise<{ error?: string }> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase.from("hrm_manual_acknowledgements").upsert(
    {
      profile_id: profile.id,
      document_id: documentId,
      version,
      signature_data: profile.full_name,
    },
    { onConflict: "profile_id,document_id,version" },
  );

  if (error) return { error: error.message };

  revalidatePath(`/manual/${documentId}`);
  revalidatePath("/manual");
  return {};
}
