import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { LocalTime } from "@/app/components/local-time";
import { StatCard } from "@/app/components/stat-card";
import { CallOutcomeBadge } from "@/app/components/call-outcome-badge";
import { VisionScaleBadge } from "@/app/components/vision-scale-badge";
import { VisionScaleOverTimeChart } from "./vision-scale-over-time-chart";

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      calls: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!patient) {
    notFound();
  }

  const totalCalls = patient.calls.length;
  const scales = patient.calls
    .map((c) => c.visionScale)
    .filter((v): v is number => v !== null);
  const avgScale =
    scales.length > 0
      ? (scales.reduce((a, b) => a + b, 0) / scales.length).toFixed(1)
      : "—";
  const successCount = patient.calls.filter(
    (c) => c.callSuccessful === true
  ).length;
  const successRate =
    totalCalls > 0
      ? ((successCount / totalCalls) * 100).toFixed(0) + "%"
      : "—";
  const lastCall = patient.calls[0];

  // Build vision scale over time data (chronological order)
  const visionOverTime = patient.calls
    .filter((c) => c.visionScale !== null)
    .reverse()
    .map((c) => ({
      date: c.createdAt.toISOString().slice(0, 10),
      scale: c.visionScale!,
    }));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Link
        href="/patients"
        className="mb-6 inline-block text-sm text-blue-600 hover:underline"
      >
        &larr; Back to patients
      </Link>

      {/* Patient Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{patient.name}</h1>
        {patient.phone && (
          <p className="text-sm text-gray-500">{patient.phone}</p>
        )}
        {patient.notes && (
          <p className="mt-1 text-sm text-gray-600">{patient.notes}</p>
        )}
      </div>

      {/* Stat Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Calls" value={String(totalCalls)} />
        <StatCard label="Avg Vision Scale" value={String(avgScale)} />
        <StatCard
          label="Most Recent Call"
          value={lastCall ? lastCall.createdAt.toLocaleDateString() : "—"}
        />
        <StatCard label="Success Rate" value={successRate} />
      </div>

      {/* Vision Scale Over Time */}
      {visionOverTime.length > 1 && (
        <div className="mb-6">
          <VisionScaleOverTimeChart data={visionOverTime} />
        </div>
      )}

      {/* Call History */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Call History</h2>
        {patient.calls.length === 0 ? (
          <p className="text-gray-500">No calls linked to this patient.</p>
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
                    Activities
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Preference
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {patient.calls.map((call) => (
                  <tr key={call.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                      <Link
                        href={`/calls/${call.id}`}
                        className="hover:text-blue-600 hover:underline"
                      >
                        <LocalTime
                          date={new Date(
                            call.eventTimestamp * 1000
                          ).toISOString()}
                        />
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <CallOutcomeBadge successful={call.callSuccessful} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {call.callDurationSecs != null
                        ? formatDuration(call.callDurationSecs)
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <VisionScaleBadge scale={call.visionScale} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">
                      {call.activities ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {call.visionPreference ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
