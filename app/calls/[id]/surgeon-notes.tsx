"use client";

import { useState, useRef, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function SurgeonNotes({
  patientId,
  initialNotes,
}: {
  patientId: string;
  initialNotes: string;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [saved, setSaved] = useState(true);
  const [isPending, startTransition] = useTransition();
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  function handleChange(value: string) {
    setNotes(value);
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      const res = await fetch(`/api/patients/${patientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notes || null }),
      });
      if (res.ok) {
        setSaved(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setSaved(true), 2000);
      }
    });
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Surgeon&apos;s Notes
      </h3>
      <Textarea
        value={notes}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Add pre-appointment notes..."
        className="mb-2 min-h-[80px] resize-none text-sm"
      />
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleSave}
          disabled={isPending || saved}
        >
          {isPending ? "Saving..." : saved ? "Saved" : "Save Notes"}
        </Button>
      </div>
    </div>
  );
}
