import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { LocalTime } from "@/app/components/local-time";
import { AnalyticsStatCard } from "@/app/components/analytics-stat-card";
import { Phone, Eye, Calendar, CheckCircle2 } from "lucide-react";
import { CallOutcomeBadge } from "@/app/components/call-outcome-badge";
import { VisionScaleBadge } from "@/app/components/vision-scale-badge";
import { VisionScaleOverTimeChart } from "./vision-scale-over-time-chart";
import { CallStatusActions } from "@/app/components/call-status-actions";
import { Badge } from "@/components/ui/badge";
import { CALL_STATUS_LABELS, type CallStatus } from "@/lib/types";

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

  const displayName =
    [patient.firstName, patient.lastName].filter(Boolean).join(" ") ||
    patient.name;

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
        className="mb-6 inline-block text-sm text-primary hover:underline"
      >
        &larr; Back to patients
      </Link>

      {/* Patient Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{displayName}</h1>
          <Badge variant="outline">
            {CALL_STATUS_LABELS[patient.callStatus as CallStatus] ?? patient.callStatus}
          </Badge>
        </div>
        {patient.phone && (
          <p className="text-sm text-muted-foreground">{patient.phone}</p>
        )}
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {patient.dateOfBirth && (
            <span>DOB: {patient.dateOfBirth.toLocaleDateString()}</span>
          )}
          {patient.appointmentDate && (
            <span>Appointment: {patient.appointmentDate.toLocaleDateString()}</span>
          )}
          {patient.doctor && <span>Doctor: {patient.doctor}</span>}
        </div>
        {patient.notes && (
          <p className="mt-1 text-sm text-muted-foreground">{patient.notes}</p>
        )}
        <div className="mt-3">
          <CallStatusActions
            patientId={patient.id}
            currentStatus={patient.callStatus as CallStatus}
          />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <AnalyticsStatCard
          label="Total Calls"
          value={String(totalCalls)}
          icon={Phone}
          iconColorClass="bg-medical-info-light text-medical-info"
          bgClass="bg-medical-info-light/30"
        />
        <AnalyticsStatCard
          label="Avg Vision Scale"
          value={String(avgScale)}
          icon={Eye}
          iconColorClass="bg-medical-warning-light text-medical-warning"
          bgClass="bg-medical-warning-light/30"
        />
        <AnalyticsStatCard
          label="Most Recent Call"
          value={lastCall ? lastCall.createdAt.toLocaleDateString() : "—"}
          icon={Calendar}
          iconColorClass="bg-medical-purple-light text-medical-purple"
          bgClass="bg-medical-purple-light/30"
        />
        <AnalyticsStatCard
          label="Success Rate"
          value={successRate}
          icon={CheckCircle2}
          iconColorClass="bg-medical-success-light text-medical-success"
          bgClass="bg-medical-success-light/30"
        />
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
          <p className="text-muted-foreground">No calls linked to this patient.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Date &amp; Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Outcome
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Vision Scale
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Activities
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Preference
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {patient.calls.map((call) => (
                  <tr key={call.id} className="hover:bg-muted">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-foreground">
                      <Link
                        href={`/calls/${call.id}`}
                        className="hover:text-foreground hover:underline"
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
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                      {call.callDurationSecs != null
                        ? formatDuration(call.callDurationSecs)
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <VisionScaleBadge scale={call.visionScale} />
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">
                      {call.activities ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
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
