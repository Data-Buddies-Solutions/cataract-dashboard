"use client";

import { formatDateTimeET } from "@/lib/time";

export function LocalTime({ date }: { date: string }) {
  return (
    <>
      {formatDateTimeET(date, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZoneName: "short",
      })}
    </>
  );
}
