"use client";

import { useState } from "react";
import { setDocumentStatusAction, deleteDocumentAction } from "./actions";
import { Button } from "@/components/ui/button";
import type { ManualDocStatus } from "@/lib/types";

export function DocumentActions({ documentId, status }: { documentId: string; status: ManualDocStatus }) {
  const [pending, setPending] = useState(false);

  async function run(fn: () => Promise<void>) {
    setPending(true);
    await fn();
    setPending(false);
  }

  return (
    <div className="flex gap-2">
      {status !== "active" && (
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={() => run(() => setDocumentStatusAction(documentId, "active"))}
        >
          Publish
        </Button>
      )}
      {status === "active" && (
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={() => run(() => setDocumentStatusAction(documentId, "archived"))}
        >
          Archive
        </Button>
      )}
      <Button
        type="button"
        variant="danger"
        disabled={pending}
        onClick={() => {
          if (confirm("Delete this document and all of its sections? This can't be undone.")) {
            run(() => deleteDocumentAction(documentId));
          }
        }}
      >
        Delete
      </Button>
    </div>
  );
}
