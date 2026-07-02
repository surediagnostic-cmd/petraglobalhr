"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acknowledgeDocumentAction } from "./actions";
import { Button } from "@/components/ui/button";

export function AcknowledgeButton({ documentId, version }: { documentId: string; version: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await acknowledgeDocumentAction(documentId, version);
        setPending(false);
        router.refresh();
      }}
    >
      {pending ? "Saving..." : "I acknowledge this document"}
    </Button>
  );
}
