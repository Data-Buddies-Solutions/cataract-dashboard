import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { LocalTime } from "@/app/components/local-time";
import { CallOutcomeBadge } from "@/app/components/call-outcome-badge";
import { PatientTagForm } from "@/app/components/patient-tag-form";
import type {
  EventData,
  TranscriptTurn,
  DataCollectionEntry,
  EvaluationCriteriaEntry,
} from "@/lib/types";

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatLabel(id: string): string {
  return id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function criteriaResultStyle(result: string): { color: string; bg: string } {
  if (result === "success")
    return { color: "text-green-700", bg: "bg-green-50 border-green-200" };
  if (result === "failure")
    return { color: "text-red-700", bg: "bg-red-50 border-red-200" };
  return { color: "text-amber-700", bg: "bg-amber-50 border-amber-200" };
}

function scaleColorClass(scale: number): string {
  if (scale <= 3) return "text-green-700";
  if (scale <= 6) return "text-amber-600";
  return "text-red-700";
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

export default async function CallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const event = await prisma.webhookEvent.findUnique({
    where: { id },
    include: { patient: { select: { id: true, name: true } } },
  });

  if (!event) {
    notFound();
  }

  const d = event.data as EventData;
  const transcript = d.transcript as TranscriptTurn[] | undefined;
  const summary = d.analysis?.transcript_summary;
  const duration = d.metadata?.call_duration_secs;
  const llmCost = d.metadata?.charging?.llm_price;
  const credits = d.metadata?.cost;
  const turnCount = transcript?.length ?? 0;

  const dcr = d.analysis?.data_collection_results ?? {};
  const evaluationCriteria = d.analysis?.evaluation_criteria_results
    ? (Object.values(
        d.analysis.evaluation_criteria_results
      ) as EvaluationCriteriaEntry[])
    : [];

  // Find cataract-specific entries with their rationale
  const visionScaleEntry = findDataCollectionEntry(
    dcr,
    "scale",
    "impact",
    "rating",
    "score"
  );
  const activitiesEntry = findDataCollectionEntry(
    dcr,
    "activit",
    "daily",
    "affected",
    "struggle",
    "difficult"
  );
  const preferenceEntry = findDataCollectionEntry(
    dcr,
    "preference",
    "goal",
    "after",
    "post",
    "want",
    "hope"
  );

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-block text-sm text-blue-600 hover:underline"
      >
        &larr; Back to calls
      </Link>

      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">
          <LocalTime
            date={new Date(event.eventTimestamp * 1000).toISOString()}
          />
        </h1>
        <CallOutcomeBadge successful={event.callSuccessful} />
      </div>

      {/* Patient tag */}
      <div className="mb-6">
        <PatientTagForm
          callId={event.id}
          currentPatientId={event.patientId}
          currentPatientName={event.patient?.name ?? null}
        />
      </div>

      {/* Cataract Data Cards */}
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-semibold">Cataract Assessment</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {/* Vision Scale */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="text-xs font-medium uppercase text-gray-500">
              Vision Impact Scale
            </h3>
            <p
              className={`mt-1 text-4xl font-bold ${
                event.visionScale != null
                  ? scaleColorClass(event.visionScale)
                  : "text-gray-400"
              }`}
            >
              {event.visionScale != null ? (
                <>
                  {event.visionScale}
                  <span className="text-lg font-normal text-gray-400">
                    /10
                  </span>
                </>
              ) : (
                "—"
              )}
            </p>
            {visionScaleEntry?.rationale && (
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                {visionScaleEntry.rationale}
              </p>
            )}
          </div>

          {/* Activities */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="text-xs font-medium uppercase text-gray-500">
              Affected Activities
            </h3>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {event.activities ?? "—"}
            </p>
            {activitiesEntry?.rationale && (
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                {activitiesEntry.rationale}
              </p>
            )}
          </div>

          {/* Vision Preference */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="text-xs font-medium uppercase text-gray-500">
              Vision Preference
            </h3>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {event.visionPreference ?? "—"}
            </p>
            {preferenceEntry?.rationale && (
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                {preferenceEntry.rationale}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Transcript Summary */}
      {summary && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-1 text-xs font-medium uppercase text-gray-500">
            Summary
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
        </div>
      )}

      {/* Evaluation Criteria */}
      {evaluationCriteria.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">Evaluation Criteria</h2>
          <div className="space-y-3">
            {evaluationCriteria.map((item) => {
              const style = criteriaResultStyle(item.result);
              return (
                <div
                  key={item.criteria_id}
                  className={`rounded-lg border p-4 ${style.bg}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`text-sm font-medium ${style.color}`}>
                      {formatLabel(item.criteria_id)}
                    </h3>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${style.color}`}
                    >
                      {item.result}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                    {item.rationale}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Call Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <dt className="text-xs font-medium uppercase text-gray-500">
            Duration
          </dt>
          <dd className="mt-1 text-lg font-semibold text-gray-900">
            {duration != null ? formatDuration(duration) : "—"}
          </dd>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <dt className="text-xs font-medium uppercase text-gray-500">
            Turns
          </dt>
          <dd className="mt-1 text-lg font-semibold text-gray-900">
            {turnCount}
          </dd>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <dt className="text-xs font-medium uppercase text-gray-500">
            LLM Cost
          </dt>
          <dd className="mt-1 text-lg font-semibold text-gray-900">
            {llmCost != null ? `$${llmCost.toFixed(4)}` : "—"}
          </dd>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <dt className="text-xs font-medium uppercase text-gray-500">
            Credits Used
          </dt>
          <dd className="mt-1 text-lg font-semibold text-gray-900">
            {credits != null ? credits.toLocaleString() : "—"}
          </dd>
        </div>
      </div>

      {/* Transcript */}
      {transcript && transcript.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">Transcript</h2>
          <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
            {transcript.map((turn, i) => (
              <div
                key={i}
                className={`flex flex-col ${
                  turn.role === "agent" ? "items-start" : "items-end"
                }`}
              >
                <span className="mb-0.5 text-xs font-medium uppercase text-gray-400">
                  {turn.role}
                  {turn.time_in_call_secs != null &&
                    ` (${turn.time_in_call_secs}s)`}
                </span>
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                    turn.role === "agent"
                      ? "bg-gray-100 text-gray-800"
                      : "bg-blue-600 text-white"
                  }`}
                >
                  {turn.message}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Raw Payload */}
      <details className="mb-6">
        <summary className="cursor-pointer text-lg font-semibold text-gray-700 hover:text-gray-900">
          Raw Payload
        </summary>
        <pre className="mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-gray-900 p-4 text-sm text-green-400">
          {JSON.stringify(event.data, null, 2)}
        </pre>
      </details>
    </main>
  );
}
