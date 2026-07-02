// One-time import of the Sure Diagnostics Operation Manual into the schema
// created by supabase/migrations/0001-0005. Run via:
//   npx tsx scripts/seed-sure-diagnostics.ts
//
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the
// environment (or a .env.local — this script loads it manually since it
// runs outside the Next.js runtime that would otherwise do so for you).
// Idempotent: safe to re-run after fixing a data issue — everything is
// upserted by its natural key, never inserted unconditionally.

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { DEPARTMENT_NAMES, SECTIONS, DESIGNATIONS } from "./seed-data/sure-diagnostics";

function loadEnvLocal() {
  const path = resolve(__dirname, "..", ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}
loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set them in .env.local first.",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const COMPANY_SLUG = "sure-diagnostics";
const COMPANY_NAME = "Sure Diagnostics Health Services";
const MANUAL_VERSION = "2.0";

async function main() {
  console.log(`Seeding "${COMPANY_NAME}"...`);

  const company = await upsertCompany();
  const departmentIdByName = await upsertDepartments(company.id);
  const designationIdByTitle = await upsertDesignations(company.id, departmentIdByName);
  const document = await upsertManualDocument(company.id);
  await upsertSections(company.id, document.id, departmentIdByName);
  await upsertHandbookPlaceholder(company.id);

  console.log("Done.");
  console.log(`Company: ${company.id}`);
  console.log(`Departments: ${departmentIdByName.size}`);
  console.log(`Designations: ${designationIdByTitle.size}`);
  console.log(`Manual sections: ${SECTIONS.length}`);
}

async function upsertCompany() {
  const { data: existing } = await supabase
    .from("hrm_companies")
    .select("id")
    .eq("slug", COMPANY_SLUG)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabase
    .from("hrm_companies")
    .insert({ name: COMPANY_NAME, slug: COMPANY_SLUG })
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

async function upsertDepartments(companyId: string): Promise<Map<string, string>> {
  const idByName = new Map<string, string>();

  for (const name of DEPARTMENT_NAMES) {
    const { data: existing } = await supabase
      .from("hrm_departments")
      .select("id")
      .eq("company_id", companyId)
      .eq("name", name)
      .maybeSingle();

    if (existing) {
      idByName.set(name, existing.id);
      continue;
    }

    const { data, error } = await supabase
      .from("hrm_departments")
      .insert({ company_id: companyId, name })
      .select("id")
      .single();

    if (error) throw error;
    idByName.set(name, data.id);
  }

  return idByName;
}

async function upsertDesignations(
  companyId: string,
  departmentIdByName: Map<string, string>,
): Promise<Map<string, string>> {
  const idByTitle = new Map<string, string>();

  for (const d of DESIGNATIONS) {
    const departmentId = departmentIdByName.get(d.departmentName) ?? null;

    const { data: existing } = await supabase
      .from("hrm_designations")
      .select("id")
      .eq("company_id", companyId)
      .eq("title", d.title)
      .maybeSingle();

    const careerLevelData = {
      min_qualification: d.minQualification,
      key_focus: d.keyFocus,
      base_pay: d.basePay ?? null,
    };

    if (existing) {
      await supabase
        .from("hrm_designations")
        .update({ department_id: departmentId, career_track: d.careerTrack, career_level_data: careerLevelData })
        .eq("id", existing.id);
      idByTitle.set(d.title, existing.id);
      continue;
    }

    const { data, error } = await supabase
      .from("hrm_designations")
      .insert({
        company_id: companyId,
        department_id: departmentId,
        title: d.title,
        career_track: d.careerTrack,
        career_level_data: careerLevelData,
      })
      .select("id")
      .single();

    if (error) throw error;
    idByTitle.set(d.title, data.id);
  }

  return idByTitle;
}

async function upsertManualDocument(companyId: string) {
  const { data: existing } = await supabase
    .from("hrm_manual_documents")
    .select("id")
    .eq("company_id", companyId)
    .eq("doc_type", "operation_manual")
    .eq("version", MANUAL_VERSION)
    .maybeSingle();

  if (existing) {
    await supabase.from("hrm_manual_documents").update({ status: "active" }).eq("id", existing.id);
    return existing;
  }

  const { data, error } = await supabase
    .from("hrm_manual_documents")
    .insert({
      company_id: companyId,
      doc_type: "operation_manual",
      title: "Sure Diagnostics Health Services Operation Manual",
      version: MANUAL_VERSION,
      effective_date: "2026-01-01",
      status: "active",
    })
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

async function upsertSections(
  companyId: string,
  documentId: string,
  departmentIdByName: Map<string, string>,
) {
  for (let i = 0; i < SECTIONS.length; i++) {
    const s = SECTIONS[i];

    const { data: existing } = await supabase
      .from("hrm_manual_sections")
      .select("id")
      .eq("document_id", documentId)
      .eq("section_number", s.number)
      .maybeSingle();

    const sectionRow = {
      document_id: documentId,
      section_number: s.number,
      title: s.title,
      subtitle: s.subtitle,
      body: s.body,
      who_is_responsible: s.whoIsResponsible,
      escalation_chain: s.escalation,
      md_only: s.mdOnly ?? false,
      order_index: i,
    };

    let sectionId: string;
    if (existing) {
      await supabase.from("hrm_manual_sections").update(sectionRow).eq("id", existing.id);
      sectionId = existing.id;
      // Clear old visibility rows so re-running after changing a section's
      // department mapping doesn't leave stale allow-list entries behind.
      await supabase.from("hrm_manual_section_visibility").delete().eq("section_id", sectionId);
      await supabase.from("hrm_kpi_definitions").delete().eq("section_id", sectionId);
    } else {
      const { data, error } = await supabase
        .from("hrm_manual_sections")
        .insert(sectionRow)
        .select("id")
        .single();
      if (error) throw error;
      sectionId = data.id;
    }

    if (!s.mdOnly) {
      const departmentId = s.departmentName ? departmentIdByName.get(s.departmentName) : null;
      const { error } = await supabase.from("hrm_manual_section_visibility").insert({
        section_id: sectionId,
        department_id: departmentId ?? null,
        designation_id: null,
      });
      if (error) throw error;
    }

    for (const kpi of s.kpis) {
      const { error } = await supabase.from("hrm_kpi_definitions").insert({
        company_id: companyId,
        section_id: sectionId,
        department_id: s.departmentName ? departmentIdByName.get(s.departmentName) ?? null : null,
        name: kpi.name,
        target_description: kpi.targetDescription,
        target_value: kpi.targetValue,
        target_unit: kpi.targetUnit,
        review_frequency: "monthly",
        owner_role: s.whoIsResponsible,
      });
      if (error) throw error;
    }

    console.log(`  ${s.number} ${s.title} — ${s.kpis.length} KPIs, dept=${s.departmentName ?? (s.mdOnly ? "MD/HR only" : "company-wide")}`);
  }
}

async function upsertHandbookPlaceholder(companyId: string) {
  const { data: existing } = await supabase
    .from("hrm_manual_documents")
    .select("id")
    .eq("company_id", companyId)
    .eq("doc_type", "staff_handbook")
    .maybeSingle();

  if (existing) return;

  // The source Employee Handbook.pdf is scanned/image-heavy and could not be
  // text-extracted in this environment (no OCR tooling available) — seeded
  // as a draft placeholder. HR fills in real sections later via the app's
  // own manual-editing tooling (or a future OCR pass).
  const { error } = await supabase.from("hrm_manual_documents").insert({
    company_id: companyId,
    doc_type: "staff_handbook",
    title: "Sure Diagnostics Staff Handbook",
    version: "1.0-draft",
    status: "draft",
  });

  if (error) throw error;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
