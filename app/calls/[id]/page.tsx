import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { LocalTime } from "@/app/components/local-time";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Stethoscope,
  Scissors,
  Pill,
  Users,
  Heart,
  Sparkles,
  Zap,
  Target,
  Brain,
  MessageCircle,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ThumbsUp,
} from "lucide-react";
import { TranscriptPanel } from "./transcript-panel";
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
  getPremiumIOLLabel,
  getLaserInterestLabel,
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

  // ── New matchers ──
  const hobbiesMatch = findDataCollectionEntry(dcr, "hobby", "hobbies", "interest", "lifestyle", "leisure");
  const concernsMatch = findDataCollectionEntry(dcr, "concern", "question", "nervous", "worry", "fear");
  const sentimentMatch = findDataCollectionEntry(dcr, "sentiment", "mood", "tone");
  const readinessMatch = findDataCollectionEntry(dcr, "readi", "ready", "timeline", "decision", "schedule", "stage");
  const personalityMatch = findDataCollectionEntry(dcr, "personality", "tolerance", "temperament");
  const occupationMatch = findDataCollectionEntry(dcr, "occupation", "job", "profession");
  const pastMedicalMatch = findDataCollectionEntry(dcr, "past medical", "medical history", "health history", "pmh");
  const pastSurgicalMatch = findDataCollectionEntry(dcr, "past surgical", "surgical history", "prior surg", "psh");
  const medicationsMatch = findDataCollectionEntry(dcr, "medication", "allerg", "drug", "prescription", "rx");
  const grandchildrenMatch = findDataCollectionEntry(dcr, "grandchild", "grandkid", "grandson", "granddaughter");
  const premiumIOLMatch = findDataCollectionEntry(dcr, "premium iol", "iol interest", "premium lens", "multifocal", "toric");
  const laserInterestMatch = findDataCollectionEntry(dcr, "femtosecond", "laser interest", "laser");

  const matchedKeys = new Set(
    [hobbiesMatch, concernsMatch, sentimentMatch, readinessMatch, personalityMatch, occupationMatch, pastMedicalMatch, pastSurgicalMatch, medicationsMatch, grandchildrenMatch, premiumIOLMatch, laserInterestMatch]
      .filter(Boolean)
      .map((m) => m!.key)
  );
  const unmatchedEntries = findUnmatchedEntries(dcr, matchedKeys);

  // Patient name from DB
  const patientName = event.patient
    ? [event.patient.firstName, event.patient.lastName].filter(Boolean).join(" ") || event.patient.name
    : "Unknown Patient";
  const occupationValue = occupationMatch?.entry.value || null;
  const sentimentValue = sentimentMatch?.entry.value || null;
  const personalityValue = (personalityMatch?.entry.value && personalityMatch.entry.value !== "null") ? personalityMatch.entry.value : null;

  const readinessLabel = readinessMatch?.entry.value ? getReadinessLabel(readinessMatch.entry.value) : null;
  const premiumIOLLabel = premiumIOLMatch?.entry.value ? getPremiumIOLLabel(premiumIOLMatch.entry.value) : null;
  const laserInterestLabel = laserInterestMatch?.entry.value ? getLaserInterestLabel(laserInterestMatch.entry.value) : null;

  // IOL Upgrade Propensity scoring
  const propensityInputs = {
    premiumIOLValue: premiumIOLMatch?.entry.value,
    readinessValue: readinessMatch?.entry.value,
    laserInterestValue: laserInterestMatch?.entry.value,
    hobbiesValue: hobbiesMatch?.entry.value,
    grandchildrenValue: grandchildrenMatch?.entry.value,
    occupationValue,
    sentimentValue,
    personalityValue,
  };
  const propensity = computePropensityScore(propensityInputs);
  const radarData = computeRadarData(propensityInputs);

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <div className="mb-4 sm:mb-6">
        <Link
          href="/calls"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to calls
        </Link>
      </div>

      {/* ── 1. Hero Banner ── */}
      <div className="mb-6 rounded-lg border bg-card px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold sm:text-2xl">
                {patientName}
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

      {/* ── 3. Medical Dashboard ── */}
      <section className="mb-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">
          Medical Dashboard
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <div className="rounded-xl border bg-card p-3 sm:p-5">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
                Past Medical History
              </h3>
            </div>
            <p className="mt-2 text-sm leading-relaxed sm:mt-3">
              {pastMedicalMatch?.entry.value || <span className="text-muted-foreground">&mdash;</span>}
            </p>
          </div>

          <div className="rounded-xl border bg-card p-3 sm:p-5">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Scissors className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
                Past Surgical History
              </h3>
            </div>
            <p className="mt-2 text-sm leading-relaxed sm:mt-3">
              {pastSurgicalMatch?.entry.value || <span className="text-muted-foreground">&mdash;</span>}
            </p>
          </div>

          <div className="rounded-xl border bg-card p-3 sm:p-5">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Pill className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
                Medications & Allergies
              </h3>
            </div>
            <p className="mt-2 text-sm leading-relaxed sm:mt-3">
              {medicationsMatch?.entry.value || <span className="text-muted-foreground">&mdash;</span>}
            </p>
          </div>
        </div>
      </section>

      {/* ── 4. Patient Concerns Banner ── */}
      {concernsMatch?.entry.value && (
        <div className="mb-6 rounded-lg border border-l-4 border-l-medical-warning bg-medical-warning-light/10 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-medical-warning" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-medical-warning sm:text-sm">
              Patient Concerns & Questions
            </h2>
          </div>
          <p className="mt-2 text-sm font-medium leading-relaxed sm:text-base">
            {concernsMatch.entry.value}
          </p>
        </div>
      )}

      {/* ── 5. Personal Cards ── */}
      <section className="mb-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <div className="rounded-xl border bg-card p-3 sm:p-5">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
                Grandchildren
              </h3>
            </div>
            <p className="mt-2 text-sm leading-relaxed sm:mt-3">
              {grandchildrenMatch?.entry.value || <span className="text-muted-foreground">&mdash;</span>}
            </p>
          </div>

          <div className="rounded-xl border bg-card p-3 sm:p-5">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Heart className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
                Hobbies & Interests
              </h3>
            </div>
            <p className="mt-2 text-sm leading-relaxed sm:mt-3">
              {hobbiesMatch?.entry.value || <span className="text-muted-foreground">&mdash;</span>}
            </p>
          </div>
        </div>
      </section>

      {/* ── 6. IOL Upgrade Propensity ── */}
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

      {/* ── 7. Decision Indicators ── */}
      <section className="mb-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">
          Decision Indicators
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
          <div className="rounded-xl border bg-card p-3">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Readiness
              </h3>
            </div>
            <p className="mt-1.5 text-sm font-bold">
              {readinessLabel ?? <span className="font-normal text-muted-foreground">&mdash;</span>}
            </p>
          </div>

          <div className="rounded-xl border bg-card p-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Premium IOL
              </h3>
            </div>
            <p className="mt-1.5 text-sm font-bold">
              {premiumIOLLabel ?? <span className="font-normal text-muted-foreground">&mdash;</span>}
            </p>
          </div>

          <div className="rounded-xl border bg-card p-3">
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Laser
              </h3>
            </div>
            <p className="mt-1.5 text-sm font-bold">
              {laserInterestLabel ?? <span className="font-normal text-muted-foreground">&mdash;</span>}
            </p>
          </div>

          <div className="rounded-xl border bg-card p-3">
            <div className="flex items-center gap-1.5">
              <ThumbsUp className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Sentiment
              </h3>
            </div>
            <p className="mt-1.5 text-sm font-bold">
              {sentimentValue ?? <span className="font-normal text-muted-foreground">&mdash;</span>}
            </p>
          </div>

          <div className="col-span-2 rounded-xl border bg-card p-3 sm:col-span-1">
            <div className="flex items-center gap-1.5">
              <Brain className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Personality
              </h3>
            </div>
            <p className="mt-1.5 text-sm font-bold">
              {personalityValue ?? <span className="font-normal text-muted-foreground">&mdash;</span>}
            </p>
          </div>
        </div>
      </section>

      {/* ── 8. Surgeon's Notes ── */}
      {event.patient?.id && (
        <section className="mb-6">
          <SurgeonNotes
            patientId={event.patient.id}
            initialNotes={event.patient.notes ?? ""}
          />
        </section>
      )}

      {/* ── 9. Collapsible Accordions ── */}
      <Accordion type="multiple" className="mb-6">
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

      {/* ── Transcript & Raw Data ── */}
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
