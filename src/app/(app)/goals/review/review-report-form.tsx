"use client";

import { reviewReportAction } from "../actions";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { Textarea } from "@/components/ui/textarea";

export function ReviewReportForm({ reportId }: { reportId: string }) {
  const action = reviewReportAction.bind(null, reportId);

  return (
    <ActionForm action={action} className="mt-3 space-y-2">
      <Textarea name="reviewer_comment" rows={2} placeholder="Comment (optional)" />
      <div className="flex gap-2">
        <SubmitButton name="decision" value="approved">
          Approve
        </SubmitButton>
        <SubmitButton name="decision" value="changes_requested" variant="secondary">
          Request changes
        </SubmitButton>
      </div>
    </ActionForm>
  );
}
