import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { LocalTime } from "@/app/components/local-time";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  MessageCircle,
} from "lucide-react";
import { TranscriptPanel } from "./transcript-panel";
import { ReviewButton } from "./review-button";
import { SurgeonNotes } from "./surgeon-notes";
import type {
  EventData,
  TranscriptTurn,
  EvaluationCriteriaEntry,
} from "@/lib/types";
import { computePropensityScore, computeRadarData } from "@/lib/propensity-scoring";
import { PropensityGauge } from "@/app/components/charts/propensity-gauge";
import { LifestyleRadar } from "@/app/components/charts/lifestyle-radar";
import { PropensityBreakdown } from "@/app/components/propensity-breakdown";
import {
  findDataCollectionEntry,
  findUnmatchedEntries,
  getReadinessLabel,
  getPremiumLensLabel,
  visionSeverityLabel,
  formatLabel,
} from "@/lib/extract-call-insights";

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function criteriaIcon(result: string) {
  if (result === "success")
    return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />;
  if (result === "failure")
    return <XCircle className="h-4 w-4 text-muted-foreground" />;
  return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
}

const tierBadgeVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  high: "default",
  moderate: "secondary",
  low: "outline",
  insufficient: "outline",
};

export default async function CallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const event = await prisma.webhookEvent.findUnique({
    where: { id },
    include: { patient: { select: { id: true, name: true, firstName: true, lastName: true, notes: true } } },
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

  const activitiesMatch = findDataCollectionEntry(dcr, "activit", "daily", "affected", "struggle", "difficult", "functional", "demands", "limitation");
  const hobbiesMatch = findDataCollectionEntry(dcr, "hobby", "hobbies", "lifestyle", "leisure");
  const glassesMatch = findDataCollectionEntry(dcr, "glass", "independence", "spectacle");
  const preferenceMatch = findDataCollectionEntry(dcr, "preference", "goal");
  const premiumLensMatch = findDataCollectionEntry(dcr, "premium", "lens interest", "iol", "multifocal", "toric");
  const laserMatch = findDataCollectionEntry(dcr, "femtosecond", "laser");
  const medicalMatch = findDataCollectionEntry(dcr, "medical", "condition", "health", "medication", "surgical risk", "ocular");
  const concernsMatch = findDataCollectionEntry(dcr, "concern", "question", "nervous", "worry", "fear");
  const sentimentMatch = findDataCollectionEntry(dcr, "sentiment", "mood", "tone");
  const patientNameMatch = findDataCollectionEntry(dcr, "patient name", "name");
  const readinessMatch = findDataCollectionEntry(dcr, "readi", "ready", "timeline", "decision", "schedule", "stage");
  const personalityMatch = findDataCollectionEntry(dcr, "personality", "tolerance", "temperament");
  const occupationMatch = findDataCollectionEntry(dcr, "occupation", "job", "profession");
  const emailMatch = findDataCollectionEntry(dcr, "email", "e-mail");

  const matchedKeys = new Set(
    [activitiesMatch, hobbiesMatch, glassesMatch, preferenceMatch, premiumLensMatch, laserMatch, medicalMatch, concernsMatch, sentimentMatch, patientNameMatch, readinessMatch, personalityMatch, occupationMatch, emailMatch]
      .filter(Boolean)
      .map((m) => m!.key)
  );
  const unmatchedEntries = findUnmatchedEntries(dcr, matchedKeys);

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

  // Parse patient name
  let patientName: string | null = null;
  let parsedOccupation: string | null = null;
  const rawNameValue = patientNameMatch?.entry.value;
  if (rawNameValue) {
    try {
      const parsed = JSON.parse(rawNameValue);
      patientName = parsed.patient_name || parsed.name || null;
      parsedOccupation = parsed.occupation || null;
    } catch {
      patientName = rawNameValue;
    }
  }
  const patientDisplayName = event.patient
    ? [event.patient.firstName, event.patient.lastName].filter(Boolean).join(" ") || event.patient.name
    : null;
  patientName = patientName || patientDisplayName || null;
  const occupationValue = parsedOccupation || (occupationMatch?.entry.value !== rawNameValue ? occupationMatch?.entry.value : null);

  const sentimentValue = sentimentMatch?.entry.value || null;

  const readinessLabel = readinessEntry?.value ? getReadinessLabel(readinessEntry.value) : null;
  const premiumLensLabel = premiumLensEntry?.value ? getPremiumLensLabel(premiumLensEntry.value) : null;
  const visionScale = event.visionScale;

  // IOL Upgrade Propensity scoring
  const propensityInputs = {
    premiumLensValue: premiumLensEntry?.value,
    readinessValue: readinessEntry?.value,
    visionScale,
    glassesValue: glassesEntry?.value,
    activitiesValue: activitiesEntry?.value || event.activities,
    hobbiesValue: hobbiesEntry?.value,
  };
  const propensity = computePropensityScore(propensityInputs);
  const radarData = computeRadarData(propensityInputs);

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <div className="mb-4 flex items-center justify-between sm:mb-6">
        <Link
          href="/calls"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to calls
        </Link>
        <ReviewButton
          callId={event.id}
          initialReviewedAt={event.reviewedAt?.toISOString() ?? null}
        />
      </div>

      {/* ── 1. Hero Banner ── */}
      <div className="mb-6 rounded-lg border bg-card px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold sm:text-2xl">
                {patientName || "Unknown Patient"}
              </h1>
              {event.patient?.id && (
                <Link
                  href={`/patients/${event.patient.id}`}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  View patient &rarr;
                </Link>
              )}
            </div>
            {occupationValue && (
              <span className="text-sm text-muted-foreground">{occupationValue}</span>
            )}
          </div>
          {propensity.tier !== "insufficient" && (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{propensity.overallScore}%</span>
              <Badge variant={tierBadgeVariant[propensity.tier]}>
                {propensity.tier === "high" ? "High" : propensity.tier === "moderate" ? "Moderate" : "Low"}
              </Badge>
            </div>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>
            <LocalTime date={new Date(event.eventTimestamp * 1000).toISOString()} />
          </span>
          {duration != null && (
            <>
              <span>&middot;</span>
              <span>{formatDuration(duration)}</span>
            </>
          )}
          {sentimentValue && (
            <>
              <span>&middot;</span>
              <span>{sentimentValue}</span>
            </>
          )}
          {event.callSuccessful != null && (
            <>
              <span>&middot;</span>
              <span>{event.callSuccessful ? "Successful" : "Failed"}</span>
            </>
          )}
        </div>
      </div>

      {/* ── 2. Call Synopsis ── */}
      {summary && (
        <div className="mb-6 rounded-lg border bg-card p-4 sm:p-5">
          <div className="mb-1.5 flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">
              Call Synopsis
            </h2>
          </div>
          <p className="text-sm leading-relaxed sm:text-[15px]">{summary}</p>
        </div>
      )}

      {/* ── 3. Decision Dashboard ── */}
      <section className="mb-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">
          Decision Dashboard
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <div className="rounded-xl border bg-card p-3 sm:p-6">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
                Surgical Readiness
              </h3>
            </div>
            <p className="mt-2 text-base font-bold sm:mt-4 sm:text-lg">
              {readinessLabel ?? "Not assessed"}
            </p>
            {readinessEntry?.value && !readinessEntry.value.toLowerCase().includes(readinessLabel?.toLowerCase() ?? "") && (
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {readinessEntry.value}
              </p>
            )}
          </div>

          <div className="rounded-xl border bg-card p-3 sm:p-6">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
                Premium Lens
              </h3>
            </div>
            <p className="mt-2 text-base font-bold sm:mt-4 sm:text-lg">
              {premiumLensLabel ?? "Not assessed"}
            </p>
            {premiumLensEntry?.value && premiumLensEntry.value.split(/\s+/).length > 3 && !premiumLensEntry.value.toLowerCase().includes(premiumLensLabel?.toLowerCase() ?? "") && (
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {premiumLensEntry.value}
              </p>
            )}
          </div>

          <div className="rounded-xl border bg-card p-3 sm:p-6">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
                Vision Impact
              </h3>
            </div>
            {visionScale != null ? (
              <>
                <div className="mt-2 flex items-baseline gap-1 sm:mt-3 sm:gap-2">
                  <span className="text-2xl font-bold sm:text-4xl">{visionScale}</span>
                  <span className="text-[10px] font-medium text-muted-foreground sm:text-sm">/10</span>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {visionSeverityLabel(visionScale)}
                  </Badge>
                </div>
                <Progress
                  value={visionScale * 10}
                  className="mt-2 h-1.5 sm:mt-3 sm:h-2.5"
                />
              </>
            ) : (
              <p className="mt-2 text-lg font-bold text-muted-foreground sm:mt-4">&mdash;</p>
            )}
          </div>
        </div>

        {/* Key Concern — elevated to decision dashboard */}
        {concernsEntry?.value && (
          <div className="mt-3 rounded-xl border bg-card p-3 sm:mt-4 sm:p-5">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
                Key Concern
              </h3>
            </div>
            <p className="mt-2 text-sm font-medium leading-relaxed sm:text-base">
              {concernsEntry.value}
            </p>
          </div>
        )}
      </section>

      {/* ── 3b. IOL Upgrade Propensity ── */}
      <section className="mb-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">
          IOL Upgrade Propensity
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <PropensityGauge
            score={propensity.overallScore}
            label={propensity.label}
            tier={propensity.tier}
          />
          <LifestyleRadar data={radarData} />
        </div>
        <div className="mt-4">
          <PropensityBreakdown factors={propensity.factors} />
        </div>
      </section>

      {/* ── Surgeon's Notes ── */}
      {event.patient?.id && (
        <section className="mb-6">
          <SurgeonNotes
            patientId={event.patient.id}
            initialNotes={event.patient.notes ?? ""}
          />
        </section>
      )}

      {/* ── 4. Key Clinical Info ── */}
      <section className="mb-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">
          Clinical Info
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-4">
            <div className="mb-1.5 flex items-center gap-2">
              <Stethoscope className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Medical History & Risk
              </h3>
            </div>
            <p className="text-sm">
              {medicalEntry?.value || <span className="text-muted-foreground">&mdash;</span>}
            </p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="mb-1.5 flex items-center gap-2">
              <Glasses className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Glasses Preference
              </h3>
            </div>
            <p className="text-sm">
              {glassesEntry?.value || preferenceEntry?.value || <span className="text-muted-foreground">&mdash;</span>}
            </p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="mb-1.5 flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Femtosecond Laser
              </h3>
            </div>
            <p className="text-sm">
              {laserEntry?.value || <span className="text-muted-foreground">&mdash;</span>}
            </p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="mb-1.5 flex items-center gap-2">
              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Concerns & Questions
              </h3>
            </div>
            <p className="text-sm">
              {concernsEntry?.value || <span className="text-muted-foreground">&mdash;</span>}
            </p>
          </div>
        </div>
      </section>

      {/* ── 5. Collapsible Detail Sections ── */}
      <Accordion type="multiple" className="mb-6">
        {/* Patient Profile */}
        <AccordionItem value="patient-profile">
          <AccordionTrigger className="text-sm font-semibold">
            Patient Profile
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-4 pt-1 sm:grid-cols-2">
              <div>
                <div className="mb-1.5 flex items-center gap-2">
                  <Heart className="h-3.5 w-3.5 text-muted-foreground" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Lifestyle & Activities
                  </h3>
                </div>
                <div className="space-y-1 text-sm">
                  {hobbiesEntry?.value && <p>{hobbiesEntry.value}</p>}
                  {(activitiesEntry?.value || event.activities) && (
                    <p>{activitiesEntry?.value || event.activities}</p>
                  )}
                  {!hobbiesEntry?.value && !activitiesEntry?.value && !event.activities && (
                    <p className="text-muted-foreground">&mdash;</p>
                  )}
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center gap-2">
                  <Brain className="h-3.5 w-3.5 text-muted-foreground" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Personality & Sentiment
                  </h3>
                </div>
                <div className="space-y-1 text-sm">
                  {personalityEntry?.value && personalityEntry.value !== "null" && <p>{personalityEntry.value}</p>}
                  {sentimentValue && <p>{sentimentValue}</p>}
                  {(!personalityEntry?.value || personalityEntry.value === "null") && !sentimentValue && (
                    <p className="text-muted-foreground">&mdash;</p>
                  )}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* AI Evaluation */}
        {evaluationCriteria.length > 0 && (
          <AccordionItem value="ai-evaluation">
            <AccordionTrigger className="text-sm font-semibold">
              AI Evaluation
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-1">
                {evaluationCriteria.map((item) => (
                  <div
                    key={item.criteria_id}
                    className="rounded-lg border p-3 sm:p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {criteriaIcon(item.result)}
                        <h3 className="text-sm font-medium">
                          {formatLabel(item.criteria_id)}
                        </h3>
                      </div>
                      <span className="shrink-0 text-xs font-semibold uppercase text-muted-foreground">
                        {item.result}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.rationale}
                    </p>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Other Collected Data */}
        {unmatchedEntries.length > 0 && (
          <AccordionItem value="other-data">
            <AccordionTrigger className="text-sm font-semibold">
              Other Collected Data
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4 pt-1 sm:grid-cols-2">
                {unmatchedEntries.map(({ key, entry }) => (
                  <div key={key}>
                    <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {formatLabel(key)}
                    </h3>
                    <p className="text-sm">{entry.value || "&mdash;"}</p>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      <Separator className="my-6" />

      {/* ── 6. Transcript & Raw Data ── */}
      <Accordion type="single" collapsible className="mb-6">
        <AccordionItem value="transcript">
          <AccordionTrigger className="text-sm font-semibold">
            Transcript & Raw Data
          </AccordionTrigger>
          <AccordionContent>
            <TranscriptPanel
              transcript={transcript}
              rawData={event.data}
              duration={duration}
              turnCount={turnCount}
              llmCost={llmCost}
              credits={credits}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </main>
  );
}
