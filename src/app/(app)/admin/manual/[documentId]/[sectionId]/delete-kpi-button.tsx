"use client";

import { useState } from "react";
import { deleteKpiAction } from "../actions";
import { Button } from "@/components/ui/button";

export function DeleteKpiButton({ kpiId }: { kpiId: string }) {
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      variant="ghost"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await deleteKpiAction(kpiId);
        setPending(false);
      }}
    >
      Remove
    </Button>
  );
}
