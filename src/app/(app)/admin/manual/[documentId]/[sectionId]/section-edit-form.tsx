"use client";

import { updateSectionAction } from "../actions";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function SectionEditForm({
  documentId,
  sectionId,
  section,
  departments,
  visibleDepartmentIds,
}: {
  documentId: string;
  sectionId: string;
  section: {
    section_number: string;
    title: string;
    subtitle: string | null;
    body: string;
    who_is_responsible: string | null;
    escalation_chain: string | null;
    md_only: boolean;
  };
  departments: { id: string; name: string }[];
  visibleDepartmentIds: string[];
}) {
  const action = updateSectionAction.bind(null, documentId, sectionId);

  return (
    <ActionForm action={action} className="space-y-4">
      <div className="grid grid-cols-[100px_1fr] gap-3">
        <div>
          <Label htmlFor="section_number">Number</Label>
          <Input id="section_number" name="section_number" defaultValue={section.section_number} required />
        </div>
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" defaultValue={section.title} required />
        </div>
      </div>
      <div>
        <Label htmlFor="subtitle">Subtitle (optional)</Label>
        <Input id="subtitle" name="subtitle" defaultValue={section.subtitle ?? ""} />
      </div>
      <div>
        <Label htmlFor="body">Body (Markdown supported — headings, bold, lists, tables)</Label>
        <Textarea id="body" name="body" rows={16} defaultValue={section.body} className="font-mono" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="who_is_responsible">Who is responsible (optional)</Label>
          <Input id="who_is_responsible" name="who_is_responsible" defaultValue={section.who_is_responsible ?? ""} />
        </div>
        <div>
          <Label htmlFor="escalation_chain">Escalation chain (optional)</Label>
          <Input id="escalation_chain" name="escalation_chain" defaultValue={section.escalation_chain ?? ""} />
        </div>
      </div>

      <fieldset className="rounded-md border border-slate-200 p-3 dark:border-slate-700">
        <legend className="px-1 text-sm font-medium dark:text-slate-200">Visibility</legend>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input type="checkbox" name="md_only" defaultChecked={section.md_only} />
          MD/HR only (e.g. CEO Command Centre — hidden from all other staff)
        </label>
        {departments.length > 0 && (
          <div className="mt-3">
            <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
              Or restrict to specific departments (leave all unchecked for company-wide):
            </p>
            <div className="grid grid-cols-2 gap-1">
              {departments.map((d) => (
                <label key={d.id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    name="department_ids"
                    value={d.id}
                    defaultChecked={visibleDepartmentIds.includes(d.id)}
                  />
                  {d.name}
                </label>
              ))}
            </div>
          </div>
        )}
      </fieldset>

      <SubmitButton pendingText="Saving...">Save section</SubmitButton>
    </ActionForm>
  );
}
