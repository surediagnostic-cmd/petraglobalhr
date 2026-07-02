"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireHrOrMd } from "@/lib/auth/session";

export async function createSectionAction(
  documentId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  await requireHrOrMd();
  const sectionNumber = String(formData.get("section_number") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();

  if (!sectionNumber) return { error: "Section number is required." };
  if (!title) return { error: "Title is required." };

  const supabase = await createClient();
  const { count } = await supabase
    .from("hrm_manual_sections")
    .select("id", { count: "exact", head: true })
    .eq("document_id", documentId);

  const { data, error } = await supabase
    .from("hrm_manual_sections")
    .insert({
      document_id: documentId,
      section_number: sectionNumber,
      title,
      order_index: count ?? 0,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/admin/manual/${documentId}`);
  redirect(`/admin/manual/${documentId}/${data.id}`);
}

export async function updateSectionAction(
  documentId: string,
  sectionId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  await requireHrOrMd();
  const sectionNumber = String(formData.get("section_number") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim() || null;
  const body = String(formData.get("body") ?? "");
  const whoIsResponsible = String(formData.get("who_is_responsible") ?? "").trim() || null;
  const escalationChain = String(formData.get("escalation_chain") ?? "").trim() || null;
  const mdOnly = formData.get("md_only") === "on";
  const departmentIds = formData.getAll("department_ids").map(String);

  if (!sectionNumber) return { error: "Section number is required." };
  if (!title) return { error: "Title is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("hrm_manual_sections")
    .update({
      section_number: sectionNumber,
      title,
      subtitle,
      body,
      who_is_responsible: whoIsResponsible,
      escalation_chain: escalationChain,
      md_only: mdOnly,
    })
    .eq("id", sectionId);

  if (error) return { error: error.message };

  // Replace visibility rows wholesale — simplest correct way to reconcile
  // "which departments were checked" without diffing old vs new state.
  await supabase.from("hrm_manual_section_visibility").delete().eq("section_id", sectionId);

  if (!mdOnly) {
    if (departmentIds.length === 0) {
      // No departments checked = company-wide, matching the seed script's
      // convention: a row with a null department_id means "everyone".
      const { error: visError } = await supabase
        .from("hrm_manual_section_visibility")
        .insert({ section_id: sectionId, department_id: null });
      if (visError) return { error: visError.message };
    } else {
      const { error: visError } = await supabase.from("hrm_manual_section_visibility").insert(
        departmentIds.map((departmentId) => ({ section_id: sectionId, department_id: departmentId })),
      );
      if (visError) return { error: visError.message };
    }
  }

  revalidatePath(`/admin/manual/${documentId}`);
  revalidatePath(`/admin/manual/${documentId}/${sectionId}`);
  return {};
}

export async function deleteSectionAction(documentId: string, sectionId: string): Promise<void> {
  await requireHrOrMd();
  const supabase = await createClient();
  await supabase.from("hrm_manual_sections").delete().eq("id", sectionId);
  revalidatePath(`/admin/manual/${documentId}`);
}

export async function addKpiAction(
  sectionId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const profile = await requireHrOrMd();
  const name = String(formData.get("name") ?? "").trim();
  const targetValue = String(formData.get("target_value") ?? "").trim() || null;
  const targetUnit = String(formData.get("target_unit") ?? "").trim() || null;
  const reviewFrequency = String(formData.get("review_frequency") ?? "monthly");

  if (!name) return { error: "KPI name is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("hrm_kpi_definitions").insert({
    company_id: profile.company_id,
    section_id: sectionId,
    name,
    target_value: targetValue ? Number(targetValue) : null,
    target_unit: targetUnit,
    review_frequency: reviewFrequency,
  });

  if (error) return { error: error.message };

  revalidatePath(`/admin/manual/[documentId]/[sectionId]`, "page");
  return {};
}

export async function deleteKpiAction(kpiId: string): Promise<void> {
  await requireHrOrMd();
  const supabase = await createClient();
  await supabase.from("hrm_kpi_definitions").delete().eq("id", kpiId);
  revalidatePath(`/admin/manual/[documentId]/[sectionId]`, "page");
}
