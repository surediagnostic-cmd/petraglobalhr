"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

function CredentialRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-emerald-300 bg-white px-3 py-2 dark:border-emerald-700 dark:bg-slate-900">
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="font-mono text-sm dark:text-slate-100">{value}</p>
      </div>
      <Button
        type="button"
        variant="secondary"
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

export function CredentialDisplay({
  email,
  password,
  onReset,
  note,
}: {
  email: string;
  password: string;
  onReset: () => void;
  note?: string;
}) {
  return (
    <div className="space-y-3 rounded-md border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950">
      <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
        {note ?? "Account created. Share these credentials directly — this password won't be shown again."}
      </p>
      <CredentialRow label="Email" value={email} />
      <CredentialRow label="Password" value={password} />
      <Button type="button" variant="secondary" onClick={onReset}>
        Create another
      </Button>
    </div>
  );
}
