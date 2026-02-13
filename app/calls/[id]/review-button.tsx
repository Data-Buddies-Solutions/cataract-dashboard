"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export function ReviewButton({
  callId,
  initialReviewedAt,
}: {
  callId: string;
  initialReviewedAt: string | null;
}) {
  const [reviewedAt, setReviewedAt] = useState(initialReviewedAt);
  const [isPending, startTransition] = useTransition();

  const isReviewed = !!reviewedAt;

  function handleToggle() {
    startTransition(async () => {
      const res = await fetch(`/api/calls/${callId}/review`, { method: "PATCH" });
      if (res.ok) {
        const data = await res.json();
        setReviewedAt(data.reviewedAt);
      }
    });
  }

  return (
    <Button
      variant={isReviewed ? "secondary" : "default"}
      size="sm"
      onClick={handleToggle}
      disabled={isPending}
      className="gap-1.5"
    >
      <CheckCircle2 className="h-3.5 w-3.5" />
      {isReviewed ? "Reviewed" : "Mark as Reviewed"}
    </Button>
  );
}
