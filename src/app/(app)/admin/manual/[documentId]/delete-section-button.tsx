"use client";

import { useState } from "react";
import { deleteSectionAction } from "./actions";
import { Button } from "@/components/ui/button";

export function DeleteSectionButton({ documentId, sectionId }: { documentId: string; sectionId: string }) {
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      variant="danger"
      disabled={pending}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm("Delete this section?")) return;
        setPending(true);
        await deleteSectionAction(documentId, sectionId);
        setPending(false);
      }}
    >
      Delete
    </Button>
  );
}
