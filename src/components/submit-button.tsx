"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";

// Reads pending state from the enclosing <form> via useFormStatus — the
// idiomatic way to react to submission state without a parent Server
// Component needing to pass a render-prop function down to a Client
// Component (which isn't serializable across that boundary).
export function SubmitButton({
  children,
  pendingText,
  ...props
}: ComponentProps<typeof Button> & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? pendingText ?? "Saving..." : children}
    </Button>
  );
}
