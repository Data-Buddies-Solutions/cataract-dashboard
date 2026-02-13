import type { DataCollectionEntry, EventData } from "@/lib/types";
import { computePropensityScore, type PropensityInputs } from "@/lib/propensity-scoring";

// ── Data collection helpers ──

export function findDataCollectionEntry(
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

export function findUnmatchedEntries(
  dcr: Record<string, DataCollectionEntry>,
  matchedKeys: Set<string>
): { key: string; entry: DataCollectionEntry }[] {
  return Object.entries(dcr)
    .filter(([key]) => !matchedKeys.has(key))
    .map(([key, entry]) => ({ key, entry }));
}

// ── Label helpers ──

export function getReadinessLabel(value: string): string {
  const lower = value.toLowerCase();
  if (lower.includes("ready") || lower.includes("scheduled") || lower.includes("decided") || lower.includes("yes"))
    return "Ready";
  if (lower.includes("considering") || lower.includes("leaning") || lower.includes("likely") || lower.includes("soon"))
    return "Leaning Yes";
  if (lower.includes("not ready") || lower.includes("undecided") || lower.includes("unsure") || lower.includes("no"))
    return "Not Ready";
  return "Unknown";
}

export function getPremiumLensLabel(value: string): string {
  const lower = value.toLowerCase();
  if (lower.includes("yes") || lower.includes("interested") || lower.includes("high"))
    return "High Interest";
  if (lower.includes("maybe") || lower.includes("unsure") || lower.includes("considering") || lower.includes("moderate"))
    return "Considering";
  if (lower.includes("no") || lower.includes("not interested") || lower.includes("declined"))
    return "Not Interested";
  return "Unknown";
}

export function visionSeverityLabel(scale: number): string {
  if (scale <= 3) return "Mild";
  if (scale <= 6) return "Moderate";
  return "Severe";
}

export function formatLabel(id: string): string {
  return id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Full extraction from a call event ──

export interface CallInsights {
  patientName: string | null;
  occupationValue: string | null;
  sentimentValue: string | null;
  readinessLabel: string | null;
  premiumLensLabel: string | null;
  visionScale: number | null;
  visionSeverity: string | null;
  concernsValue: string | null;
  propensityInputs: PropensityInputs;
  propensity: ReturnType<typeof computePropensityScore>;
}

export function extractCallInsights(
  data: EventData,
  event: { visionScale?: number | null; activities?: string | null },
  patient?: { firstName?: string | null; lastName?: string | null; name?: string } | null
): CallInsights {
  const dcr = data.analysis?.data_collection_results ?? {};

  const activitiesMatch = findDataCollectionEntry(dcr, "activit", "daily", "affected", "struggle", "difficult", "functional", "demands", "limitation");
  const hobbiesMatch = findDataCollectionEntry(dcr, "hobby", "hobbies", "lifestyle", "leisure");
  const glassesMatch = findDataCollectionEntry(dcr, "glass", "independence", "spectacle");
  const premiumLensMatch = findDataCollectionEntry(dcr, "premium", "lens interest", "iol", "multifocal", "toric");
  const concernsMatch = findDataCollectionEntry(dcr, "concern", "question", "nervous", "worry", "fear");
  const sentimentMatch = findDataCollectionEntry(dcr, "sentiment", "mood", "tone");
  const patientNameMatch = findDataCollectionEntry(dcr, "patient name", "name");
  const readinessMatch = findDataCollectionEntry(dcr, "readi", "ready", "timeline", "decision", "schedule", "stage");
  const occupationMatch = findDataCollectionEntry(dcr, "occupation", "job", "profession");

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
  const patientDisplayName = patient
    ? [patient.firstName, patient.lastName].filter(Boolean).join(" ") || patient.name || null
    : null;
  patientName = patientName || patientDisplayName || null;

  const occupationValue = parsedOccupation || (occupationMatch?.entry.value !== rawNameValue ? occupationMatch?.entry.value : null) || null;
  const sentimentValue = sentimentMatch?.entry.value || null;
  const readinessLabel = readinessMatch?.entry.value ? getReadinessLabel(readinessMatch.entry.value) : null;
  const premiumLensLabel = premiumLensMatch?.entry.value ? getPremiumLensLabel(premiumLensMatch.entry.value) : null;
  const visionScale = event.visionScale ?? null;
  const visionSeverity = visionScale != null ? visionSeverityLabel(visionScale) : null;
  const concernsValue = concernsMatch?.entry.value || null;

  const propensityInputs: PropensityInputs = {
    premiumLensValue: premiumLensMatch?.entry.value,
    readinessValue: readinessMatch?.entry.value,
    visionScale,
    glassesValue: glassesMatch?.entry.value,
    activitiesValue: activitiesMatch?.entry.value || event.activities,
    hobbiesValue: hobbiesMatch?.entry.value,
  };
  const propensity = computePropensityScore(propensityInputs);

  return {
    patientName,
    occupationValue,
    sentimentValue,
    readinessLabel,
    premiumLensLabel,
    visionScale,
    visionSeverity,
    concernsValue,
    propensityInputs,
    propensity,
  };
}
