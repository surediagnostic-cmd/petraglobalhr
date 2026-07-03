"use client";

import { useRef, useState } from "react";
import { updateCandidateStageAction } from "../actions";
import { Select } from "@/components/ui/select";
import type { CandidateStage } from "@/lib/types";

const STAGES: CandidateStage[] = ["applied", "screening", "interview", "offer", "hired", "rejected"];

export function CandidateStageSelect({
  postingId,
  candidateId,
  stage,
}: {
  postingId: string;
  candidateId: string;
  stage: CandidateStage;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      ref={formRef}
      onSubmit={(e) => e.preventDefault()}
      className="inline-block"
    >
      <Select
        name="stage"
        defaultValue={stage}
        disabled={pending}
        onChange={async (e) => {
          setPending(true);
          await updateCandidateStageAction(postingId, candidateId, new FormData(formRef.current!));
          setPending(false);
        }}
      >
        {STAGES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>
    </form>
  );
}
