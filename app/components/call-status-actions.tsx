"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CALL_STATUS_LABELS, type CallStatus } from "@/lib/types";

const statusTransitions: Record<CallStatus, CallStatus[]> = {
  pending: ["queued"],
  queued: ["called", "pending"],
  called: ["completed", "queued"],
  completed: ["pending"],
};

export function CallStatusActions({
  patientId,
  currentStatus,
}: {
  patientId: string;
  currentStatus: CallStatus;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const nextStatuses = statusTransitions[currentStatus] ?? [];

  async function updateStatus(newStatus: CallStatus) {
    setSaving(true);
    try {
      await fetch(`/api/patients/${patientId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callStatus: newStatus }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (nextStatuses.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {nextStatuses.map((status) => (
        <Button
          key={status}
          variant={status === "queued" ? "default" : "outline"}
          size="sm"
          disabled={saving}
          onClick={() => updateStatus(status)}
        >
          {saving ? "..." : `Mark as ${CALL_STATUS_LABELS[status]}`}
        </Button>
      ))}
    </div>
  );
}
