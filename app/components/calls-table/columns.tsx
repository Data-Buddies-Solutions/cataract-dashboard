"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocalTime } from "@/app/components/local-time";

export type CallRow = {
  id: string;
  collectedName: string | null;
  patientName: string | null;
  eventTimestamp: number;
  callSuccessful: boolean | null;
  sentiment: string | null;
  callDurationSecs: number | null;
  visionScale: number | null;
};

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export const columns: ColumnDef<CallRow>[] = [
  {
    accessorKey: "collectedName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Patient
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const name =
        row.original.collectedName ||
        row.original.patientName ||
        "Unknown";
      return (
        <Link
          href={`/calls/${row.original.id}`}
          className="font-medium hover:text-foreground hover:underline"
        >
          {name}
        </Link>
      );
    },
  },
  {
    accessorKey: "eventTimestamp",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Date & Time
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <LocalTime
        date={new Date(row.original.eventTimestamp * 1000).toISOString()}
      />
    ),
  },
  {
    accessorKey: "sentiment",
    header: "Sentiment",
    cell: ({ row }) => {
      const sentiment = row.original.sentiment;
      if (!sentiment) return <span className="text-muted-foreground">—</span>;
      return <span className="text-sm">{sentiment}</span>;
    },
  },
  {
    accessorKey: "callDurationSecs",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Duration
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const secs = row.original.callDurationSecs;
      return secs != null ? formatDuration(secs) : "—";
    },
  },
  {
    accessorKey: "visionScale",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Vision Scale
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const scale = row.original.visionScale;
      if (scale === null) return <span className="text-muted-foreground">—</span>;
      return <span className="text-sm">{scale}</span>;
    },
  },
];
