import Link from "next/link";
import { prisma } from "@/lib/db";
import { LocalTime } from "@/app/components/local-time";
import { CallOutcomeBadge } from "@/app/components/call-outcome-badge";
import { VisionScaleBadge } from "@/app/components/vision-scale-badge";

export const dynamic = "force-dynamic";

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default async function CallsListPage() {
  const events = await prisma.webhookEvent.findMany({
    where: { type: "post_call_transcription" },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { patient: { select: { id: true, name: true } } },
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Calls</h1>

      {events.length === 0 ? (
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
                  Date &amp; Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Outcome
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Duration
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Vision Scale
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Vision Preference
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Patient
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
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
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {event.callDurationSecs != null
                      ? formatDuration(event.callDurationSecs)
                      : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <VisionScaleBadge scale={event.visionScale} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {event.visionPreference ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    {event.patient ? (
                      <Link
                        href={`/patients/${event.patient.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {event.patient.name}
                      </Link>
                    ) : (
                      <span className="text-gray-400">Untagged</span>
                    )}
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
