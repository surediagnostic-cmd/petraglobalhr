"use client";

import { addKpiAction } from "../actions";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const FREQUENCIES = ["daily", "weekly", "monthly", "quarterly", "annual"];

export function KpiForm({ sectionId }: { sectionId: string }) {
  const action = addKpiAction.bind(null, sectionId);

  return (
    <ActionForm action={action} className="grid grid-cols-[1fr_100px_100px_120px_auto] items-end gap-2">
      <div>
        <Label htmlFor="name">KPI name</Label>
        <Input id="name" name="name" required placeholder="e.g. TAT compliance" />
      </div>
      <div>
        <Label htmlFor="target_value">Target</Label>
        <Input id="target_value" name="target_value" type="number" step="any" />
      </div>
      <div>
        <Label htmlFor="target_unit">Unit</Label>
        <Input id="target_unit" name="target_unit" placeholder="%, hrs..." />
      </div>
      <div>
        <Label htmlFor="review_frequency">Frequency</Label>
        <Select id="review_frequency" name="review_frequency" defaultValue="monthly">
          {FREQUENCIES.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </Select>
      </div>
      <SubmitButton pendingText="Adding...">Add</SubmitButton>
    </ActionForm>
  );
}
