import Link from "next/link";
import { prisma } from "@/lib/db";
import { columns, type CallRow } from "@/app/components/calls-table/columns";
import { DataTable } from "@/app/components/calls-table/data-table";
import type { EventData, DataCollectionEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

type RangeFilter = "7d" | "30d" | "90d" | "all";
type OutcomeFilter = "all" | "success" | "failure" | "unknown";

function findDataCollectionEntry(
  dcr: Record<string, DataCollectionEntry>,
  ...keywords: string[]
): DataCollectionEntry | undefined {
  for (const [key, entry] of Object.entries(dcr)) {
    const lowerKey = key.toLowerCase();
    if (keywords.some((kw) => lowerKey.includes(kw))) {
      return entry;
    }
  }
  return undefined;
}

function parseRange(value: string | undefined): RangeFilter {
  return value === "7d" || value === "30d" || value === "90d" || value === "all"
    ? value
    : "30d";
}

function parseOutcome(value: string | undefined): OutcomeFilter {
  return value === "success" ||
    value === "failure" ||
    value === "unknown" ||
    value === "all"
    ? value
    : "all";
}

function getRangeStart(range: RangeFilter): Date | null {
  if (range === "all") return null;
  const now = new Date();
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function buttonClass(active: boolean): string {
  return active
    ? "rounded border border-foreground px-2 py-1 text-xs font-medium text-foreground"
    : "rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground";
}

export default async function CallsListPage({
  searchParams,
}: {
  searchParams: Promise<{
    range?: string;
    outcome?: string;
  }>;
}) {
  const params = await searchParams;
  const range = parseRange(params.range);
  const outcome = parseOutcome(params.outcome);
  const rangeStart = getRangeStart(range);

  const where: {
    type: string;
    createdAt?: { gte: Date };
    callSuccessful?: boolean | null;
  } = {
    type: "post_call_transcription",
  };

  if (rangeStart) {
    where.createdAt = { gte: rangeStart };
  }

  if (outcome === "success") where.callSuccessful = true;
  if (outcome === "failure") where.callSuccessful = false;
  if (outcome === "unknown") where.callSuccessful = null;

  const buildHref = (overrides: Partial<Record<"range" | "outcome", string>>) => {
    const next = new URLSearchParams();
    next.set("range", overrides.range ?? range);
    next.set("outcome", overrides.outcome ?? outcome);
    return `/calls?${next.toString()}`;
  };

  const events = await prisma.webhookEvent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { patient: { select: { id: true, name: true } } },
  });

  const rows: CallRow[] = events.map((event) => {
    const d = event.data as EventData;
    const dcr = d.analysis?.data_collection_results ?? {};
    const nameEntry = findDataCollectionEntry(dcr, "patient name", "name");
    const sentimentEntry = findDataCollectionEntry(
      dcr,
      "sentiment",
      "mood",
      "tone"
    );
    return {
      id: event.id,
      searchName: nameEntry?.value || event.patient?.name || "Unknown",
      collectedName: nameEntry?.value || null,
      patientName: event.patient?.name || null,
      eventTimestamp: event.eventTimestamp,
      callSuccessful: event.callSuccessful,
      sentiment: sentimentEntry?.value || null,
      callDurationSecs: event.callDurationSecs,
      visionScale: event.visionScale,
    };
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Call History</h1>
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Range
          </span>
          <Link href={buildHref({ range: "7d" })} className={buttonClass(range === "7d")}>
            7d
          </Link>
          <Link href={buildHref({ range: "30d" })} className={buttonClass(range === "30d")}>
            30d
          </Link>
          <Link href={buildHref({ range: "90d" })} className={buttonClass(range === "90d")}>
            90d
          </Link>
          <Link href={buildHref({ range: "all" })} className={buttonClass(range === "all")}>
            All
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Outcome
          </span>
          <Link href={buildHref({ outcome: "all" })} className={buttonClass(outcome === "all")}>
            All
          </Link>
          <Link
            href={buildHref({ outcome: "success" })}
            className={buttonClass(outcome === "success")}
          >
            Successful
          </Link>
          <Link
            href={buildHref({ outcome: "failure" })}
            className={buttonClass(outcome === "failure")}
          >
            Failed
          </Link>
          <Link
            href={buildHref({ outcome: "unknown" })}
            className={buttonClass(outcome === "unknown")}
          >
            Unknown
          </Link>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-muted-foreground">
          No calls received yet. Send a webhook to{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            /api/webhook/elevenlabs
          </code>{" "}
          to get started.
        </p>
      ) : (
        <DataTable columns={columns} data={rows} />
      )}
    </main>
  );
}
