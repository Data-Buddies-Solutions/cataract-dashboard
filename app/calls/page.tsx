import { prisma } from "@/lib/db";
import { columns, type CallRow } from "@/app/components/calls-table/columns";
import { DataTable } from "@/app/components/calls-table/data-table";
import type { EventData, DataCollectionEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

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

export default async function CallsListPage() {
  const events = await prisma.webhookEvent.findMany({
    where: { type: "post_call_transcription" },
    orderBy: { createdAt: "desc" },
    take: 100,
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
