"use client";

import { useRef, useState } from "react";
import { createStaffAccountAction } from "./actions";
import { CredentialDisplay } from "@/components/credential-display";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Branch, Department, Designation } from "@/lib/types";

export function CreateStaffForm({
  branches,
  departments,
  designations,
}: {
  branches: Pick<Branch, "id" | "name">[];
  departments: Pick<Department, "id" | "name">[];
  designations: Pick<Designation, "id" | "title">[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await createStaffAccountAction(new FormData(e.currentTarget));
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.credentials) {
      setCredentials(result.credentials);
      formRef.current?.reset();
    }
  }

  if (credentials) {
    return (
      <CredentialDisplay
        email={credentials.email}
        password={credentials.password}
        onReset={() => setCredentials(null)}
      />
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" name="full_name" required />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <Label htmlFor="branch_id">Branch</Label>
          <Select id="branch_id" name="branch_id">
            <option value="">None</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="department_id">Department</Label>
          <Select id="department_id" name="department_id">
            <option value="">None</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="designation_id">Designation</Label>
          <Select id="designation_id" name="designation_id">
            <option value="">None</option>
            {designations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="role">Role</Label>
          <Select id="role" name="role" defaultValue="staff">
            <option value="staff">Staff</option>
            <option value="hr_manager">HR Manager</option>
            <option value="md">MD</option>
          </Select>
        </div>
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create account"}
      </Button>
    </form>
  );
}
