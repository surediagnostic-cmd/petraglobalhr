"use client";

import { useState } from "react";
import { revokeInviteAction } from "./actions";
import { Button } from "@/components/ui/button";

export function RevokeInviteButton({ inviteId }: { inviteId: string }) {
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      variant="ghost"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await revokeInviteAction(inviteId);
        setPending(false);
      }}
    >
      Revoke
    </Button>
  );
}
