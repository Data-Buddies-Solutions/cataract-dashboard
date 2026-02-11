import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { LocalTime } from "@/app/components/local-time";
import { CallOutcomeBadge } from "@/app/components/call-outcome-badge";
import { PatientTagForm } from "@/app/components/patient-tag-form";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  Glasses,
  Sparkles,
  Zap,
  Heart,
  Stethoscope,
  HelpCircle,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Target,
  Brain,
} from "lucide-react";
import { PostCallStatus } from "@/app/components/post-call-status";
import { TranscriptTabs } from "./transcript-tabs";
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
): { key: string; entry: DataCollectionEntry } | undefined {
  for (const [key, entry] of Object.entries(dcr)) {
    const lowerKey = key.toLowerCase();
    if (keywords.some((kw) => lowerKey.includes(kw))) {
      return { key, entry };
    }
  }
  return undefined;
}

function findUnmatchedEntries(
  dcr: Record<string, DataCollectionEntry>,
  matchedKeys: Set<string>
): { key: string; entry: DataCollectionEntry }[] {
  return Object.entries(dcr)
    .filter(([key]) => !matchedKeys.has(key))
    .map(([key, entry]) => ({ key, entry }));
}

/* ── Readiness helpers ── */

function getReadinessLevel(value: string): {
  label: string;
  color: string;
  bg: string;
} {
  const lower = value.toLowerCase();
  if (
    lower.includes("ready") ||
    lower.includes("scheduled") ||
    lower.includes("decided") ||
    lower.includes("yes")
  )
    return {
      label: "Ready",
      color: "text-medical-success",
      bg: "bg-medical-success-light",
    };
  if (
    lower.includes("considering") ||
    lower.includes("leaning") ||
    lower.includes("likely") ||
    lower.includes("soon")
  )
    return {
      label: "Leaning Yes",
      color: "text-medical-warning",
      bg: "bg-medical-warning-light",
    };
  if (
    lower.includes("not ready") ||
    lower.includes("undecided") ||
    lower.includes("unsure") ||
    lower.includes("no")
  )
    return {
      label: "Not Ready",
      color: "text-medical-critical",
      bg: "bg-medical-critical-light",
    };
  return {
    label: "Unknown",
    color: "text-medical-neutral",
    bg: "bg-medical-neutral-light",
  };
}

/* ── Premium lens helpers ── */

function getPremiumLensLevel(value: string): {
  label: string;
  color: string;
  bg: string;
} {
  const lower = value.toLowerCase();
  if (
    lower.includes("yes") ||
    lower.includes("interested") ||
    lower.includes("high")
  )
    return {
      label: "High Interest",
      color: "text-medical-success",
      bg: "bg-medical-success-light",
    };
  if (
    lower.includes("maybe") ||
    lower.includes("unsure") ||
    lower.includes("considering")
  )
    return {
      label: "Considering",
      color: "text-medical-warning",
      bg: "bg-medical-warning-light",
    };
  if (
    lower.includes("no") ||
    lower.includes("not interested") ||
    lower.includes("declined")
  )
    return {
      label: "Not Interested",
      color: "text-medical-critical",
      bg: "bg-medical-critical-light",
    };
  return {
    label: "Unknown",
    color: "text-medical-neutral",
    bg: "bg-medical-neutral-light",
  };
}

/* ── Vision Impact helpers ── */

function visionSeverityColor(scale: number): {
  text: string;
  indicator: string;
  bg: string;
  label: string;
} {
  if (scale <= 3)
    return {
      text: "text-medical-success",
      indicator: "[&_[data-slot=progress-indicator]]:bg-medical-success",
      bg: "bg-medical-success-light",
      label: "Mild",
    };
  if (scale <= 6)
    return {
      text: "text-medical-warning",
      indicator: "[&_[data-slot=progress-indicator]]:bg-medical-warning",
      bg: "bg-medical-warning-light",
      label: "Moderate",
    };
  return {
    text: "text-medical-critical",
    indicator: "[&_[data-slot=progress-indicator]]:bg-medical-critical",
    bg: "bg-medical-critical-light",
    label: "Severe",
  };
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

  // Data collection entries — each returns { key, entry } or undefined
  const activitiesMatch = findDataCollectionEntry(
    dcr, "activit", "daily", "affected", "struggle", "difficult", "functional", "demands", "limitation"
  );
  const hobbiesMatch = findDataCollectionEntry(
    dcr, "hobby", "hobbies", "lifestyle", "leisure"
  );
  const glassesMatch = findDataCollectionEntry(
    dcr, "glass", "independence", "spectacle"
  );
  const preferenceMatch = findDataCollectionEntry(
    dcr, "preference", "goal"
  );
  const premiumLensMatch = findDataCollectionEntry(
    dcr, "premium", "lens interest", "iol", "multifocal", "toric"
  );
  const laserMatch = findDataCollectionEntry(
    dcr, "femtosecond", "laser"
  );
  const medicalMatch = findDataCollectionEntry(
    dcr, "medical", "condition", "health", "medication", "surgical risk", "ocular"
  );
  const concernsMatch = findDataCollectionEntry(
    dcr, "concern", "question", "nervous", "worry", "fear"
  );
  const sentimentMatch = findDataCollectionEntry(
    dcr, "sentiment", "mood", "tone"
  );
  const patientNameMatch = findDataCollectionEntry(
    dcr, "patient name", "name"
  );
  const readinessMatch = findDataCollectionEntry(
    dcr, "readi", "ready", "timeline", "decision", "schedule", "stage"
  );
  const personalityMatch = findDataCollectionEntry(
    dcr, "personality", "tolerance", "temperament"
  );
  const occupationMatch = findDataCollectionEntry(
    dcr, "occupation", "job", "profession"
  );
  const emailMatch = findDataCollectionEntry(
    dcr, "email", "e-mail"
  );

  // Collect matched keys so we can surface anything unmatched
  const matchedKeys = new Set(
    [
      activitiesMatch, hobbiesMatch, glassesMatch, preferenceMatch,
      premiumLensMatch, laserMatch, medicalMatch, concernsMatch,
      sentimentMatch, patientNameMatch, readinessMatch, personalityMatch,
      occupationMatch, emailMatch,
    ]
      .filter(Boolean)
      .map((m) => m!.key)
  );
  const unmatchedEntries = findUnmatchedEntries(dcr, matchedKeys);

  // Convenience accessors
  const activitiesEntry = activitiesMatch?.entry;
  const hobbiesEntry = hobbiesMatch?.entry;
  const glassesEntry = glassesMatch?.entry;
  const preferenceEntry = preferenceMatch?.entry;
  const premiumLensEntry = premiumLensMatch?.entry;
  const laserEntry = laserMatch?.entry;
  const medicalEntry = medicalMatch?.entry;
  const concernsEntry = concernsMatch?.entry;
  const readinessEntry = readinessMatch?.entry;
  const personalityEntry = personalityMatch?.entry;
  const occupationEntry = occupationMatch?.entry;

  const patientName = patientNameMatch?.entry.value || event.patient?.name || null;
  const sentimentValue = sentimentMatch?.entry.value || null;

  // Decision dashboard values
  const readiness = readinessEntry?.value
    ? getReadinessLevel(readinessEntry.value)
    : null;
  const premiumLens = premiumLensEntry?.value
    ? getPremiumLensLevel(premiumLensEntry.value)
    : null;
  const visionScale = event.visionScale;
  const visionSeverity = visionScale != null ? visionSeverityColor(visionScale) : null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <Link
        href="/"
        className="mb-4 inline-block text-sm text-blue-600 hover:underline sm:mb-6"
      >
        &larr; Back to calls
      </Link>

      {/* ── Section 1: Patient Header Banner ── */}
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border bg-white px-4 py-2.5 sm:mb-6">
        <h1 className="truncate text-base font-semibold text-gray-900 sm:text-lg">
          {patientName || "Unknown Patient"}
        </h1>
        <span className="text-xs text-gray-400">&middot;</span>
        <span className="text-xs text-gray-500">
          <LocalTime
            date={new Date(event.eventTimestamp * 1000).toISOString()}
          />
        </span>
        {duration != null && (
          <>
            <span className="text-xs text-gray-400">&middot;</span>
            <span className="text-xs text-gray-500">{formatDuration(duration)}</span>
          </>
        )}
        {sentimentValue && (
          <span
            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${sentimentBadgeClass(sentimentValue)}`}
          >
            {sentimentValue}
          </span>
        )}
        <CallOutcomeBadge successful={event.callSuccessful} />
        <div className="ml-auto">
          <PatientTagForm
            callId={event.id}
            currentPatientId={event.patientId}
            currentPatientName={event.patient?.name ?? null}
          />
        </div>
      </div>

      {/* ── Section 2: Decision Dashboard ── */}
      <section className="mb-4 sm:mb-8">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 sm:mb-3 sm:text-sm">
          Decision Dashboard
        </h2>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {/* Surgical Readiness */}
          <div
            className={`rounded-xl border p-3 shadow-sm sm:p-6 ${readiness?.bg ?? "bg-medical-neutral-light"}`}
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Target className="hidden h-4 w-4 text-gray-500 sm:block" />
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 sm:text-xs">
                Surgical Readiness
              </h3>
            </div>
            <div className="mt-2 sm:mt-4">
              {readiness ? (
                <span
                  className={`inline-flex rounded-full bg-white/60 px-2 py-0.5 text-xs font-bold sm:px-4 sm:py-1.5 sm:text-lg ${readiness.color}`}
                >
                  {readiness.label}
                </span>
              ) : (
                <span className="text-xs font-bold text-gray-400 sm:text-lg">Not assessed</span>
              )}
            </div>
            {readinessEntry?.value && readiness?.label !== readinessEntry.value && (
              <p className="mt-1.5 hidden text-xs leading-relaxed text-gray-500 sm:block">
                {readinessEntry.value}
              </p>
            )}
          </div>

          {/* Premium Lens Interest */}
          <div
            className={`rounded-xl border p-3 shadow-sm sm:p-6 ${premiumLens?.bg ?? "bg-medical-neutral-light"}`}
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Sparkles className="hidden h-4 w-4 text-gray-500 sm:block" />
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 sm:text-xs">
                Premium Lens
              </h3>
            </div>
            <div className="mt-2 sm:mt-4">
              {premiumLens ? (
                <span
                  className={`inline-flex rounded-full bg-white/60 px-2 py-0.5 text-xs font-bold sm:px-4 sm:py-1.5 sm:text-lg ${premiumLens.color}`}
                >
                  {premiumLens.label}
                </span>
              ) : (
                <span className="text-xs font-bold text-gray-400 sm:text-lg">Not assessed</span>
              )}
            </div>
            {premiumLensEntry?.value && (
              <p className="mt-1.5 hidden text-xs leading-relaxed text-gray-500 sm:block">
                {premiumLensEntry.value}
              </p>
            )}
          </div>

          {/* Vision Impact Score */}
          <div
            className={`rounded-xl border p-3 shadow-sm sm:p-6 ${visionSeverity?.bg ?? "bg-medical-neutral-light"}`}
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Eye className="hidden h-4 w-4 text-gray-500 sm:block" />
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 sm:text-xs">
                Vision Impact
              </h3>
            </div>
            {visionScale != null && visionSeverity ? (
              <>
                <div className="mt-2 flex items-baseline gap-1 sm:mt-3 sm:gap-2">
                  <span className={`text-2xl font-bold sm:text-4xl ${visionSeverity.text}`}>
                    {visionScale}
                  </span>
                  <span className="text-[10px] font-medium text-gray-400 sm:text-sm">/10</span>
                  <Badge
                    variant="outline"
                    className={`ml-auto hidden text-xs sm:inline-flex ${visionSeverity.text}`}
                  >
                    {visionSeverity.label}
                  </Badge>
                </div>
                <Progress
                  value={visionScale * 10}
                  className={`mt-2 h-1.5 sm:mt-3 sm:h-2.5 ${visionSeverity.indicator}`}
                />
              </>
            ) : (
              <p className="mt-2 text-lg font-bold text-gray-400 sm:mt-4">—</p>
            )}
          </div>
        </div>
      </section>

      {/* ── Section 3: Patient Profile ── */}
      <section className="mb-4 sm:mb-8">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 sm:mb-3 sm:text-sm">
          Patient Profile
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          {/* Lifestyle & Activities */}
          <div className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-2 flex items-center gap-2">
              <Heart className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-700">
                Lifestyle & Activities
              </h3>
            </div>
            <div className="space-y-1.5 text-sm text-gray-600">
              {hobbiesEntry?.value && (
                <p>{hobbiesEntry.value}</p>
              )}
              {(activitiesEntry?.value || event.activities) && (
                <p>{activitiesEntry?.value || event.activities}</p>
              )}
              {!hobbiesEntry?.value && !activitiesEntry?.value && !event.activities && (
                <p className="text-gray-400">—</p>
              )}
            </div>
          </div>

          {/* Personality & Sentiment */}
          <div className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-2 flex items-center gap-2">
              <Brain className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-700">
                Personality & Sentiment
              </h3>
            </div>
            <div className="space-y-1.5 text-sm text-gray-600">
              {personalityEntry?.value && (
                <p>{personalityEntry.value}</p>
              )}
              {sentimentValue && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500">Sentiment:</span>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${sentimentBadgeClass(sentimentValue)}`}
                  >
                    {sentimentValue}
                  </span>
                </div>
              )}
              {!personalityEntry?.value && !sentimentValue && (
                <p className="text-gray-400">—</p>
              )}
            </div>
          </div>

          {/* Medical History & Risk */}
          <div className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-2 flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-700">
                Medical History & Risk
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              {medicalEntry?.value || <span className="text-gray-400">—</span>}
            </p>
          </div>

          {/* Concerns & Questions */}
          <div className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-2 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-700">
                Concerns & Questions
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              {concernsEntry?.value || <span className="text-gray-400">—</span>}
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 4: Consultation Details ── */}
      <section className="mb-4 sm:mb-8">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 sm:mb-3 sm:text-sm">
          Consultation Details
        </h2>
        <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-white px-4 py-3 sm:gap-4 sm:px-5 sm:py-4">
          <div className="flex items-center gap-2">
            <Glasses className="h-4 w-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-500">Glasses</span>
            <Badge variant="secondary" className="text-xs">
              {glassesEntry?.value || preferenceEntry?.value || "—"}
            </Badge>
          </div>

          <Separator orientation="vertical" className="h-5" />

          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-500">Femtosecond Laser</span>
            <Badge variant="secondary" className="text-xs">
              {laserEntry?.value || "—"}
            </Badge>
          </div>
        </div>
      </section>

      {/* ── Section 5: AI Evaluation ── */}
      {evaluationCriteria.length > 0 && (
        <section className="mb-4 sm:mb-8">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 sm:mb-3 sm:text-sm">
            AI Evaluation
          </h2>
          <div className="space-y-2 sm:space-y-3">
            {evaluationCriteria.map((item) => {
              const style = criteriaResultStyle(item.result);
              return (
                <div
                  key={item.criteria_id}
                  className={`rounded-lg border p-3 sm:p-4 ${style.bg}`}
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
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {item.rationale}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Unmatched Data Collection Entries ── */}
      {unmatchedEntries.length > 0 && (
        <section className="mb-4 sm:mb-8">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 sm:mb-3 sm:text-sm">
            Other Collected Data
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            {unmatchedEntries.map(({ key, entry }) => (
              <div key={key} className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
                <h3 className="mb-1.5 text-sm font-semibold text-gray-700">
                  {formatLabel(key)}
                </h3>
                <p className="text-sm text-gray-600">{entry.value || "—"}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Section 6: Call Synopsis ── */}
      {summary && (
        <div className="mb-4 rounded-xl border border-medical-info/30 bg-medical-info-light p-4 sm:mb-6 sm:p-5">
          <div className="mb-1.5 flex items-center gap-2 sm:mb-2">
            <FileText className="h-4 w-4 text-medical-info" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-medical-info sm:text-sm">
              Call Synopsis
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-gray-800 sm:text-[15px]">{summary}</p>
        </div>
      )}

      {/* ── Section 7: Post-Call Communications ── */}
      <div className="mb-4 sm:mb-6">
        <PostCallStatus
          callId={event.id}
          patientEmail={event.patientEmail}
          patientEmailSentAt={event.patientEmailSentAt?.toISOString() ?? null}
          doctorEmailSentAt={event.doctorEmailSentAt?.toISOString() ?? null}
        />
      </div>

      <Separator className="my-4 sm:my-6" />

      {/* ── Section 8: Transcript & Raw Data ── */}
      <section className="mb-6">
        <TranscriptTabs
          transcript={transcript}
          rawData={event.data}
          duration={duration}
          turnCount={turnCount}
          llmCost={llmCost}
          credits={credits}
        />
      </section>
    </main>
  );
}
