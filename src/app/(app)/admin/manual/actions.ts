"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireHrOrMd } from "@/lib/auth/session";
import type { ManualDocStatus, ManualDocType } from "@/lib/types";

export async function createDocumentAction(formData: FormData): Promise<{ error?: string }> {
  const profile = await requireHrOrMd();
  const docType = String(formData.get("doc_type") ?? "") as ManualDocType;
  const title = String(formData.get("title") ?? "").trim();
  const version = String(formData.get("version") ?? "").trim();
  const effectiveDate = String(formData.get("effective_date") ?? "") || null;

  if (!docType) return { error: "Document type is required." };
  if (!title) return { error: "Title is required." };
  if (!version) return { error: "Version is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("hrm_manual_documents").insert({
    company_id: profile.company_id,
    doc_type: docType,
    title,
    version,
    effective_date: effectiveDate,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/manual");
  return {};
}

export async function setDocumentStatusAction(documentId: string, status: ManualDocStatus): Promise<void> {
  await requireHrOrMd();
  const supabase = await createClient();
  await supabase.from("hrm_manual_documents").update({ status }).eq("id", documentId);
  revalidatePath("/admin/manual");
}

export async function deleteDocumentAction(documentId: string): Promise<void> {
  await requireHrOrMd();
  const supabase = await createClient();
  await supabase.from("hrm_manual_documents").delete().eq("id", documentId);
  revalidatePath("/admin/manual");
}
