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

export function getPremiumIOLLabel(value: string): string {
  const lower = value.toLowerCase().trim();
  if (lower.includes("highly interested")) return "Highly Interested";
  if (lower.includes("leaning interest")) return "Leaning Interest";
  if (lower.includes("cost concerned")) return "Cost Concerned";
  if (lower.includes("neutral")) return "Neutral";
  if (lower.includes("not interested")) return "Not Interested";
  if (lower === "unknown") return "Unknown";
  // Fallback for free-text
  if (/\b(yes|very interested|definitely|high)\b/.test(lower)) return "Highly Interested";
  if (/\b(interested|want|keen|leaning)\b/.test(lower)) return "Leaning Interest";
  if (/\b(cost|afford|budget|price)\b/.test(lower)) return "Cost Concerned";
  if (/\b(maybe|considering|open|unsure)\b/.test(lower)) return "Neutral";
  if (/\b(no|not interested|declined)\b/.test(lower)) return "Not Interested";
  return "Unknown";
}

export function getLaserInterestLabel(value: string): string {
  const lower = value.toLowerCase().trim();
  if (lower.includes("highly interested")) return "Highly Interested";
  if (lower.includes("passively receptive")) return "Passively Receptive";
  if (lower.includes("cost hesitant")) return "Cost Hesitant";
  if (lower.includes("skeptical")) return "Skeptical";
  if (lower.includes("not interested")) return "Not Interested";
  if (lower === "unknown") return "Unknown";
  // Fallback
  if (/\b(yes|interested|want|keen)\b/.test(lower)) return "Highly Interested";
  if (/\b(open|receptive|maybe)\b/.test(lower)) return "Passively Receptive";
  if (/\b(cost|afford|expensive)\b/.test(lower)) return "Cost Hesitant";
  if (/\b(skeptic|doubt|unsure|hesitant)\b/.test(lower)) return "Skeptical";
  if (/\b(no|not interested|declined)\b/.test(lower)) return "Not Interested";
  return "Unknown";
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
  premiumIOLLabel: string | null;
  laserInterestLabel: string | null;
  personalityValue: string | null;
  hobbiesValue: string | null;
  grandchildrenValue: string | null;
  pastMedicalValue: string | null;
  pastSurgicalValue: string | null;
  medicationsValue: string | null;
  concernsValue: string | null;
  propensityInputs: PropensityInputs;
  propensity: ReturnType<typeof computePropensityScore>;
}

export function extractCallInsights(
  data: EventData,
  _event: Record<string, unknown>,
  patient?: { firstName?: string | null; lastName?: string | null; name?: string } | null
): CallInsights {
  const dcr = data.analysis?.data_collection_results ?? {};

  const hobbiesMatch = findDataCollectionEntry(dcr, "hobby", "hobbies", "interest", "lifestyle", "leisure");
  const concernsMatch = findDataCollectionEntry(dcr, "concern", "question", "nervous", "worry", "fear");
  const sentimentMatch = findDataCollectionEntry(dcr, "sentiment", "mood", "tone");
  const readinessMatch = findDataCollectionEntry(dcr, "readi", "ready", "timeline", "decision", "schedule", "stage");
  const occupationMatch = findDataCollectionEntry(dcr, "occupation", "job", "profession");
  const personalityMatch = findDataCollectionEntry(dcr, "personality", "tolerance", "temperament");
  const pastMedicalMatch = findDataCollectionEntry(dcr, "past medical", "medical history", "health history", "pmh");
  const pastSurgicalMatch = findDataCollectionEntry(dcr, "past surgical", "surgical history", "prior surg", "psh");
  const medicationsMatch = findDataCollectionEntry(dcr, "medication", "allerg", "drug", "prescription", "rx");
  const grandchildrenMatch = findDataCollectionEntry(dcr, "grandchild", "grandkid", "grandson", "granddaughter");
  const premiumIOLMatch = findDataCollectionEntry(dcr, "premium iol", "iol interest", "premium lens", "multifocal", "toric");
  const laserInterestMatch = findDataCollectionEntry(dcr, "femtosecond", "laser interest", "laser");

  const patientDisplayName = patient
    ? [patient.firstName, patient.lastName].filter(Boolean).join(" ") || patient.name || null
    : null;
  const patientName = patientDisplayName || null;

  const occupationValue = occupationMatch?.entry.value || null;
  const sentimentValue = sentimentMatch?.entry.value || null;
  const personalityValue = (personalityMatch?.entry.value && personalityMatch.entry.value !== "null") ? personalityMatch.entry.value : null;
  const readinessLabel = readinessMatch?.entry.value ? getReadinessLabel(readinessMatch.entry.value) : null;
  const premiumIOLLabel = premiumIOLMatch?.entry.value ? getPremiumIOLLabel(premiumIOLMatch.entry.value) : null;
  const laserInterestLabel = laserInterestMatch?.entry.value ? getLaserInterestLabel(laserInterestMatch.entry.value) : null;
  const hobbiesValue = hobbiesMatch?.entry.value || null;
  const grandchildrenValue = grandchildrenMatch?.entry.value || null;
  const pastMedicalValue = pastMedicalMatch?.entry.value || null;
  const pastSurgicalValue = pastSurgicalMatch?.entry.value || null;
  const medicationsValue = medicationsMatch?.entry.value || null;
  const concernsValue = concernsMatch?.entry.value || null;

  const propensityInputs: PropensityInputs = {
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

  return {
    patientName,
    occupationValue,
    sentimentValue,
    readinessLabel,
    premiumIOLLabel,
    laserInterestLabel,
    personalityValue,
    hobbiesValue,
    grandchildrenValue,
    pastMedicalValue,
    pastSurgicalValue,
    medicationsValue,
    concernsValue,
    propensityInputs,
    propensity,
  };
}
