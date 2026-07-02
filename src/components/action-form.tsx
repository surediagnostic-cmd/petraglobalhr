"use client";

import { useActionState } from "react";

type ActionResult = { error?: string };

// children must be static ReactNode, never a function — a Server Component
// caller can't pass a function as a prop to this Client Component (only
// Server Action references cross that boundary). Use <SubmitButton> inside
// children to read pending state instead of threading it down manually.
export function ActionForm({
  action,
  children,
  className,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => action(formData),
    {},
  );

  return (
    <form action={formAction} className={className}>
      {children}
      {state?.error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{state.error}</p>}
    </form>
  );
}
