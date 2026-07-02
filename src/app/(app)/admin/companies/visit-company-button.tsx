"use client";

import { useState } from "react";
import { visitCompanyAction } from "./actions";
import { Button } from "@/components/ui/button";

export function VisitCompanyButton({ companyId, label }: { companyId: string; label: string }) {
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      variant="secondary"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await visitCompanyAction(companyId);
      }}
    >
      {pending ? "Switching..." : label}
    </Button>
  );
}
