"use client";

export function LocalTime({ date }: { date: string }) {
  return <>{new Date(date).toLocaleString()}</>;
}
