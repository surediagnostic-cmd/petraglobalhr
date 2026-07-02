"use client";

import { useState } from "react";
import { updateStaffAction } from "./actions";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Department, Designation } from "@/lib/types";

interface StaffRow {
  id: string;
  full_name: string;
  role: string;
  department_id: string | null;
  designation_id: string | null;
  reports_to: string | null;
}

export function EditStaffRow({
  staff,
  departments,
  designations,
  staffOptions,
}: {
  staff: StaffRow;
  departments: Pick<Department, "id" | "name">[];
  designations: Pick<Designation, "id" | "title">[];
  staffOptions: { id: string; full_name: string }[];
}) {
  const [editing, setEditing] = useState(false);
  const action = updateStaffAction.bind(null, staff.id);

  if (!editing) {
    return (
      <Button type="button" variant="ghost" onClick={() => setEditing(true)}>
        Edit
      </Button>
    );
  }

  return (
    <ActionForm action={action} className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Select name="role" defaultValue={staff.role}>
        <option value="staff">Staff</option>
        <option value="hr_manager">HR Manager</option>
        <option value="md">MD</option>
      </Select>
      <Select name="department_id" defaultValue={staff.department_id ?? ""}>
        <option value="">No department</option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </Select>
      <Select name="designation_id" defaultValue={staff.designation_id ?? ""}>
        <option value="">No designation</option>
        {designations.map((d) => (
          <option key={d.id} value={d.id}>
            {d.title}
          </option>
        ))}
      </Select>
      <Select name="reports_to" defaultValue={staff.reports_to ?? ""}>
        <option value="">No manager</option>
        {staffOptions
          .filter((s) => s.id !== staff.id)
          .map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
            </option>
          ))}
      </Select>
      <SubmitButton pendingText="Saving..." className="col-span-2">
        Save
      </SubmitButton>
      <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
        Cancel
      </Button>
    </ActionForm>
  );
}
