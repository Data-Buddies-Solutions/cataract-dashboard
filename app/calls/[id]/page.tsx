import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { LocalTime } from "@/app/components/local-time";
import { CallOutcomeBadge } from "@/app/components/call-outcome-badge";
import { PatientTagForm } from "@/app/components/patient-tag-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  Glasses,
  Sparkles,
  Zap,
  Heart,
  Activity,
  Stethoscope,
  HelpCircle,
  Car,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { PostCallStatus } from "@/app/components/post-call-status";
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

function criteriaIcon(result: string) {
  if (result === "success")
    return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  if (result === "failure")
    return <XCircle className="h-4 w-4 text-red-600" />;
  return <AlertCircle className="h-4 w-4 text-amber-600" />;
}

function scaleColorClass(scale: number): string {
  if (scale <= 3) return "text-green-700";
  if (scale <= 6) return "text-amber-600";
  return "text-red-700";
}

function scaleColorBg(scale: number): string {
  if (scale <= 3) return "bg-green-50 border-green-200";
  if (scale <= 6) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

function sentimentBadgeClass(sentiment: string): string {
  const s = sentiment.toLowerCase();
  if (s.includes("positive") || s.includes("happy") || s.includes("satisfied"))
    return "bg-green-100 text-green-800 border-green-300";
  if (s.includes("negative") || s.includes("unhappy") || s.includes("frustrated"))
    return "bg-red-100 text-red-800 border-red-300";
  if (s.includes("neutral") || s.includes("mixed"))
    return "bg-gray-100 text-gray-800 border-gray-300";
  return "bg-blue-100 text-blue-800 border-blue-300";
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

  // Extract all data collection entries
  const visionScaleEntry = findDataCollectionEntry(
    dcr, "scale", "impact", "rating", "score"
  );
  const activitiesEntry = findDataCollectionEntry(
    dcr, "activit", "daily", "affected", "struggle", "difficult", "functional", "demands", "limitation"
  );
  const preferenceEntry = findDataCollectionEntry(
    dcr, "preference", "goal", "after", "post", "want", "hope"
  );
  const hobbiesEntry = findDataCollectionEntry(
    dcr, "hobby", "hobbies", "lifestyle", "leisure"
  );
  const glassesEntry = findDataCollectionEntry(
    dcr, "glass", "independence", "spectacle"
  );
  const premiumLensEntry = findDataCollectionEntry(
    dcr, "premium", "lens interest", "iol", "multifocal", "toric"
  );
  const laserEntry = findDataCollectionEntry(
    dcr, "femtosecond", "laser"
  );
  const medicalEntry = findDataCollectionEntry(
    dcr, "medical", "condition", "health", "medication", "surgical risk", "ocular"
  );
  const concernsEntry = findDataCollectionEntry(
    dcr, "concern", "question", "nervous", "worry", "fear"
  );
  const sentimentEntry = findDataCollectionEntry(
    dcr, "sentiment", "mood", "tone"
  );
  const patientNameEntry = findDataCollectionEntry(
    dcr, "patient name", "name"
  );
  const driverEntry = findDataCollectionEntry(
    dcr, "driver", "ride", "transport", "accompan"
  );

  const patientName = patientNameEntry?.value || event.patient?.name || null;
  const sentimentValue = sentimentEntry?.value || null;

  const bannerBorder = event.callSuccessful === true
    ? "border-l-4 border-l-green-500"
    : event.callSuccessful === false
      ? "border-l-4 border-l-red-500"
      : "";

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-block text-sm text-blue-600 hover:underline"
      >
        &larr; Back to calls
      </Link>

      {/* Top Banner */}
      <div className={`mb-6 rounded-xl border bg-white p-6 ${bannerBorder}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {patientName || "Unknown Patient"}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <LocalTime
                date={new Date(event.eventTimestamp * 1000).toISOString()}
              />
              {duration != null && (
                <>
                  <span>&middot;</span>
                  <span>{formatDuration(duration)}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {sentimentValue && (
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${sentimentBadgeClass(sentimentValue)}`}
              >
                {sentimentValue}
              </span>
            )}
            <CallOutcomeBadge successful={event.callSuccessful} />
          </div>
        </div>

        {/* Patient tag */}
        <div className="mt-4">
          <PatientTagForm
            callId={event.id}
            currentPatientId={event.patientId}
            currentPatientName={event.patient?.name ?? null}
          />
        </div>
      </div>

      {/* Call Synopsis - promoted to #1 position */}
      {summary && (
        <div className="mb-6 rounded-lg border border-l-4 border-l-blue-500 bg-blue-50/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Call Synopsis
            </h2>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
        </div>
      )}

      {/* Post-Call Communications */}
      <div className="mb-6">
        <PostCallStatus
          callId={event.id}
          patientEmail={event.patientEmail}
          patientEmailSentAt={event.patientEmailSentAt?.toISOString() ?? null}
          doctorEmailSentAt={event.doctorEmailSentAt?.toISOString() ?? null}
          videoStatus={event.videoStatus}
          videoUrl={event.videoUrl}
        />
      </div>

      {/* Key Metrics Row */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Key Metrics
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Vision Impact */}
          <div
            className={`rounded-lg border p-4 ${
              event.visionScale != null
                ? scaleColorBg(event.visionScale)
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-gray-400" />
              <h3 className="text-xs font-medium uppercase text-gray-500">
                Vision Impact
              </h3>
            </div>
            <p
              className={`mt-1 text-3xl font-bold ${
                event.visionScale != null
                  ? scaleColorClass(event.visionScale)
                  : "text-gray-400"
              }`}
            >
              {event.visionScale != null ? (
                <>
                  {event.visionScale}
                  <span className="text-base font-normal text-gray-400">
                    /10
                  </span>
                </>
              ) : (
                "—"
              )}
            </p>
          </div>

          {/* Glasses Preference */}
          <div className="rounded-lg border border-gray-200 bg-blue-50/20 p-4">
            <div className="flex items-center gap-1.5">
              <Glasses className="h-3.5 w-3.5 text-gray-400" />
              <h3 className="text-xs font-medium uppercase text-gray-500">
                Glasses Preference
              </h3>
            </div>
            <p className="mt-1">
              {glassesEntry?.value ? (
                <Badge variant="secondary" className="text-sm">
                  {glassesEntry.value}
                </Badge>
              ) : preferenceEntry?.value ? (
                <Badge variant="secondary" className="text-sm">
                  {preferenceEntry.value}
                </Badge>
              ) : (
                <span className="text-sm text-gray-400">—</span>
              )}
            </p>
          </div>

          {/* Premium Lens Interest */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-gray-400" />
              <h3 className="text-xs font-medium uppercase text-gray-500">
                Premium Lens Interest
              </h3>
            </div>
            <p className="mt-1">
              {premiumLensEntry?.value ? (
                <PremiumLensBadge value={premiumLensEntry.value} />
              ) : (
                <span className="text-sm text-gray-400">—</span>
              )}
            </p>
          </div>

          {/* Femtosecond Laser */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-gray-400" />
              <h3 className="text-xs font-medium uppercase text-gray-500">
                Femtosecond Laser
              </h3>
            </div>
            <p className="mt-1">
              {laserEntry?.value ? (
                <Badge variant="outline" className="text-sm">
                  {laserEntry.value}
                </Badge>
              ) : (
                <span className="text-sm text-gray-400">—</span>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Details Section */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Details
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Lifestyle & Hobbies */}
          <Card className="py-4">
            <CardHeader className="pb-0 pt-0">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <Heart className="h-3.5 w-3.5" />
                Lifestyle & Hobbies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-900">
                {hobbiesEntry?.value || "—"}
              </p>
            </CardContent>
          </Card>

          {/* Activities Affected */}
          <Card className="py-4">
            <CardHeader className="pb-0 pt-0">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <Activity className="h-3.5 w-3.5" />
                Activities Affected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-900">
                {activitiesEntry?.value || event.activities || "—"}
              </p>
            </CardContent>
          </Card>

          {/* Medical Conditions */}
          <Card className="py-4">
            <CardHeader className="pb-0 pt-0">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <Stethoscope className="h-3.5 w-3.5" />
                Medical Conditions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-900">
                {medicalEntry?.value || "—"}
              </p>
            </CardContent>
          </Card>

          {/* Patient Concerns & Questions */}
          <Card className="py-4">
            <CardHeader className="pb-0 pt-0">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <HelpCircle className="h-3.5 w-3.5" />
                Concerns & Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-900">
                {concernsEntry?.value || "—"}
              </p>
            </CardContent>
          </Card>

          {/* Driver Confirmed */}
          <Card className="py-4 sm:col-span-2">
            <CardHeader className="pb-0 pt-0">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <Car className="h-3.5 w-3.5" />
                Driver / Transportation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-900">
                {driverEntry?.value || "—"}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator className="my-6" />

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
                    <div className="flex items-center gap-2">
                      {criteriaIcon(item.result)}
                      <h3 className={`text-sm font-medium ${style.color}`}>
                        {formatLabel(item.criteria_id)}
                      </h3>
                    </div>
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

      {/* Call Stats - demoted to subtle row */}
      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg bg-muted/50 px-4 py-3">
        <div>
          <dt className="text-xs text-muted-foreground">Duration</dt>
          <dd className="text-sm font-medium">
            {duration != null ? formatDuration(duration) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Turns</dt>
          <dd className="text-sm font-medium">{turnCount}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">LLM Cost</dt>
          <dd className="text-sm font-medium">
            {llmCost != null ? `$${llmCost.toFixed(4)}` : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Credits Used</dt>
          <dd className="text-sm font-medium">
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

function PremiumLensBadge({ value }: { value: string }) {
  const lower = value.toLowerCase();
  let colorClass = "bg-gray-100 text-gray-800 border-gray-300";
  if (
    lower.includes("yes") ||
    lower.includes("interested") ||
    lower.includes("high")
  ) {
    colorClass = "bg-green-100 text-green-800 border-green-300";
  } else if (
    lower.includes("no") ||
    lower.includes("not interested") ||
    lower.includes("declined")
  ) {
    colorClass = "bg-red-100 text-red-800 border-red-300";
  } else if (
    lower.includes("maybe") ||
    lower.includes("unsure") ||
    lower.includes("considering")
  ) {
    colorClass = "bg-amber-100 text-amber-800 border-amber-300";
  }

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-0.5 text-sm font-medium ${colorClass}`}
    >
      {value}
    </span>
  );
}
