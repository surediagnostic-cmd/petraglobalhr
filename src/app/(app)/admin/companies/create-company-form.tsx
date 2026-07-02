"use client";

import { useRef, useState } from "react";
import { createCompanyAction } from "./actions";
import { CredentialDisplay } from "@/components/credential-display";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function CreateCompanyForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await createCompanyAction(new FormData(e.currentTarget));
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
        note="Company created. Share these credentials with the first MD directly — this password won't be shown again."
      />
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="name">Company name</Label>
        <Input id="name" name="name" required placeholder="e.g. Hopestone Hospital" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="md_full_name">First MD&apos;s full name</Label>
          <Input id="md_full_name" name="md_full_name" required />
        </div>
        <div>
          <Label htmlFor="md_email">First MD&apos;s email</Label>
          <Input id="md_email" name="md_email" type="email" required />
        </div>
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create company & account"}
      </Button>
    </form>
  );
}
