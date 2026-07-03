"use client";

import { useState } from "react";
import { setJobPostingStatusAction } from "./actions";
import { Button } from "@/components/ui/button";

export function JobPostingActions({ postingId, status }: { postingId: string; status: "open" | "closed" }) {
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      variant="ghost"
      disabled={pending}
      onClick={async (e) => {
        e.preventDefault();
        setPending(true);
        await setJobPostingStatusAction(postingId, status === "open" ? "closed" : "open");
        setPending(false);
      }}
    >
      {status === "open" ? "Close" : "Reopen"}
    </Button>
  );
}
