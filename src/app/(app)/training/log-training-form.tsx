"use client";

import { logTrainingAction } from "./actions";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function LogTrainingForm({
  moduleId,
  currentStatus,
  currentHours,
}: {
  moduleId: string;
  currentStatus: string;
  currentHours: number;
}) {
  const action = logTrainingAction.bind(null, moduleId);

  return (
    <ActionForm action={action} className="mt-3 flex flex-wrap items-end gap-2">
      <Select name="status" defaultValue={currentStatus} className="w-40">
        <option value="assigned">Assigned</option>
        <option value="in_progress">In progress</option>
        <option value="completed">Completed</option>
      </Select>
      <Input
        name="hours_logged"
        type="number"
        step="0.5"
        min="0"
        defaultValue={currentHours}
        className="w-24"
      />
      <SubmitButton pendingText="Saving...">Save</SubmitButton>
    </ActionForm>
  );
}
