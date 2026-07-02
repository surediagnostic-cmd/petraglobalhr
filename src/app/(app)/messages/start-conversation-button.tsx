"use client";

import { useState } from "react";
import { startConversationAction } from "./actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function StartConversationButton({
  targetProfileId,
  fullName,
  role,
}: {
  targetProfileId: string;
  fullName: string;
  role: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <Card
        className="cursor-pointer transition-shadow hover:shadow-md"
        onClick={async () => {
          if (pending) return;
          setPending(true);
          setError(null);
          const result = await startConversationAction(targetProfileId);
          if (result?.error) {
            setError(result.error);
            setPending(false);
          }
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{fullName}</span>
          <Badge>{role}</Badge>
        </div>
      </Card>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
