import Link from "next/link";
import { prisma } from "@/lib/db";
import { LocalTime } from "@/app/components/local-time";
import { CallOutcomeBadge } from "@/app/components/call-outcome-badge";
import { VisionScaleBadge } from "@/app/components/vision-scale-badge";
import type { EventData, DataCollectionEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

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

function sentimentBadgeClass(sentiment: string): string {
  const s = sentiment.toLowerCase();
  if (s.includes("positive") || s.includes("happy") || s.includes("satisfied"))
    return "border-green-200 bg-green-50 text-green-700";
  if (s.includes("negative") || s.includes("unhappy") || s.includes("frustrated"))
    return "border-red-200 bg-red-50 text-red-700";
  if (s.includes("neutral") || s.includes("mixed"))
    return "border-gray-200 bg-gray-50 text-gray-700";
  return "border-blue-200 bg-blue-50 text-blue-700";
}

export default async function CallsListPage() {
  const events = await prisma.webhookEvent.findMany({
    where: { type: "post_call_transcription" },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { patient: { select: { id: true, name: true } } },
  });

  // Extract patient name and sentiment from data_collection_results for each event
  const eventsWithExtras = events.map((event) => {
    const d = event.data as EventData;
    const dcr = d.analysis?.data_collection_results ?? {};
    const nameEntry = findDataCollectionEntry(dcr, "patient name", "name");
    const sentimentEntry = findDataCollectionEntry(dcr, "sentiment", "mood", "tone");
    return {
      ...event,
      collectedName: nameEntry?.value || null,
      sentiment: sentimentEntry?.value || null,
    };
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Calls</h1>

      {eventsWithExtras.length === 0 ? (
        <p className="text-gray-500">
          No calls received yet. Send a webhook to{" "}
          <code className="rounded bg-gray-200 px-1 py-0.5 text-sm">
            /api/webhook/elevenlabs
          </code>{" "}
          to get started.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Patient
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date &amp; Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Outcome
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Sentiment
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Duration
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Vision Scale
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {eventsWithExtras.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                    <Link
                      href={`/calls/${event.id}`}
                      className="hover:text-blue-600 hover:underline"
                    >
                      {event.collectedName ||
                        event.patient?.name ||
                        "Unknown"}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    <Link
                      href={`/calls/${event.id}`}
                      className="hover:text-blue-600 hover:underline"
                    >
                      <LocalTime
                        date={new Date(
                          event.eventTimestamp * 1000
                        ).toISOString()}
                      />
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <CallOutcomeBadge successful={event.callSuccessful} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    {event.sentiment ? (
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${sentimentBadgeClass(event.sentiment)}`}
                      >
                        {event.sentiment}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {event.callDurationSecs != null
                      ? formatDuration(event.callDurationSecs)
                      : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <VisionScaleBadge scale={event.visionScale} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
