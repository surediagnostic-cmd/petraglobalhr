"use client";

import { createSectionAction } from "./actions";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateSectionForm({ documentId }: { documentId: string }) {
  const action = createSectionAction.bind(null, documentId);

  return (
    <ActionForm action={action} className="grid grid-cols-[100px_1fr_auto] items-end gap-3">
      <div>
        <Label htmlFor="section_number">Number</Label>
        <Input id="section_number" name="section_number" required placeholder="e.g. 16" />
      </div>
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required placeholder="e.g. Data Protection" />
      </div>
      <SubmitButton pendingText="Adding...">Add section</SubmitButton>
    </ActionForm>
  );
}
