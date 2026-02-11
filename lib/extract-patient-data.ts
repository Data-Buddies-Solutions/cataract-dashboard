import type { EventData } from "./types";

interface ExtractedPatientData {
  callSuccessful: boolean | null;
  callDurationSecs: number | null;
  visionScale: number | null;
  activities: string | null;
  visionPreference: string | null;
  patientEmail: string | null;
}

export function extractPatientData(data: EventData): ExtractedPatientData {
  // Parse call_successful
  let callSuccessful: boolean | null = null;
  const success = data.analysis?.call_successful;
  if (success === true || success === "true" || success === "success") {
    callSuccessful = true;
  } else if (success === false || success === "false" || success === "failure") {
    callSuccessful = false;
  }

  // Extract call duration
  const callDurationSecs = data.metadata?.call_duration_secs ?? null;

  // Extract cataract-specific fields from data_collection_results
  let visionScale: number | null = null;
  let activities: string | null = null;
  let visionPreference: string | null = null;
  let patientEmail: string | null = null;

  const dcr = data.analysis?.data_collection_results;
  if (dcr) {
    for (const [key, entry] of Object.entries(dcr)) {
      const lowerKey = key.toLowerCase();

      if (
        lowerKey.includes("vision") &&
        (lowerKey.includes("scale") || lowerKey.includes("impact") || lowerKey.includes("rating") || lowerKey.includes("score"))
      ) {
        const parsed = parseInt(entry.value, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 10) {
          visionScale = parsed;
        }
      } else if (
        lowerKey.includes("activit") ||
        lowerKey.includes("daily") ||
        lowerKey.includes("affected") ||
        lowerKey.includes("struggle") ||
        lowerKey.includes("difficult") ||
        lowerKey.includes("functional") ||
        lowerKey.includes("demands") ||
        lowerKey.includes("limitation")
      ) {
        activities = entry.value;
      } else if (
        lowerKey.includes("email") ||
        lowerKey.includes("e-mail") ||
        (lowerKey.includes("mail") && lowerKey.includes("address"))
      ) {
        const emailValue = entry.value.trim();
        if (emailValue.includes("@") && emailValue.includes(".")) {
          patientEmail = emailValue;
        }
      } else if (
        lowerKey.includes("preference") ||
        lowerKey.includes("goal") ||
        (lowerKey.includes("vision") && (lowerKey.includes("after") || lowerKey.includes("post") || lowerKey.includes("want") || lowerKey.includes("hope")))
      ) {
        visionPreference = entry.value;
      }
    }
  }

  return {
    callSuccessful,
    callDurationSecs,
    visionScale,
    activities,
    visionPreference,
    patientEmail,
  };
}
