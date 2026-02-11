import { render } from "@react-email/components";
import { getResend } from "./resend";
import { prisma } from "./db";
import { extractPdfData, generatePatientPdf } from "./generate-patient-pdf";
import { generateVideo } from "./generate-video";
import type { VideoCallData } from "./generate-video";
import DoctorSummaryEmail from "@/emails/doctor-summary";
import PatientEmail from "@/emails/patient-email";
import PatientVideoReadyEmail from "@/emails/patient-video-ready";
import type {
  EventData,
  DataCollectionEntry,
  EvaluationCriteriaEntry,
} from "./types";

function findEntry(
  dcr: Record<string, DataCollectionEntry>,
  ...keywords: string[]
): string | null {
  for (const [key, entry] of Object.entries(dcr)) {
    const lowerKey = key.toLowerCase();
    if (keywords.some((kw) => lowerKey.includes(kw))) {
      return entry.value || null;
    }
  }
  return null;
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export async function sendPostCallEmails(
  eventData: EventData,
  eventId: string
) {
  const fromEmail = process.env.FROM_EMAIL;
  const doctorEmail = process.env.DOCTOR_EMAIL;

  if (!fromEmail) {
    console.error("FROM_EMAIL not configured, skipping post-call emails");
    return;
  }

  const dcr = eventData.analysis?.data_collection_results ?? {};
  const evalCriteria = eventData.analysis?.evaluation_criteria_results;

  // Extract data points
  const patientName =
    findEntry(dcr, "patient name", "name") || "Patient";
  const patientEmail = (() => {
    const val = findEntry(dcr, "email", "e-mail");
    if (val && val.includes("@") && val.includes(".")) return val;
    return null;
  })();
  const visionScale = (() => {
    const val = findEntry(dcr, "scale", "impact", "rating", "score");
    if (!val) return null;
    const n = parseInt(val, 10);
    return !isNaN(n) && n >= 1 && n <= 10 ? n : null;
  })();
  const glassesPreference = findEntry(dcr, "glass", "independence", "spectacle");
  const premiumLensInterest = findEntry(
    dcr,
    "premium",
    "lens interest",
    "iol",
    "multifocal",
    "toric"
  );
  const laserInterest = findEntry(dcr, "femtosecond", "laser");
  const activities = findEntry(
    dcr,
    "activit",
    "daily",
    "affected",
    "struggle",
    "difficult"
  );
  const hobbies = findEntry(dcr, "hobby", "hobbies", "lifestyle", "leisure");
  const medicalConditions = findEntry(
    dcr,
    "medical",
    "condition",
    "health",
    "medication"
  );
  const concerns = findEntry(
    dcr,
    "concern",
    "question",
    "nervous",
    "worry",
    "fear"
  );
  const visionPreference = findEntry(
    dcr,
    "preference",
    "goal",
    "after",
    "post",
    "want",
    "hope"
  );
  const callSummary = eventData.analysis?.transcript_summary ?? null;
  const duration = eventData.metadata?.call_duration_secs;
  const callSuccessful = eventData.analysis?.call_successful;

  const eventRecord = await prisma.webhookEvent.findUnique({
    where: { id: eventId },
  });
  const eventTimestamp = eventRecord?.eventTimestamp ?? Math.floor(Date.now() / 1000);

  const callDate = new Date(eventTimestamp * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const callOutcome =
    callSuccessful === true || callSuccessful === "true" || callSuccessful === "success"
      ? "Success"
      : callSuccessful === false || callSuccessful === "false" || callSuccessful === "failure"
        ? "Failed"
        : "Unknown";

  // Evaluation results
  const evaluationResults = evalCriteria
    ? Object.values(evalCriteria).map((item: EvaluationCriteriaEntry) => ({
        criteriaId: item.criteria_id,
        result: item.result,
        rationale: item.rationale,
      }))
    : [];

  // ─── 1. GENERATE PDF (instant) ───
  let pdfBytes: Uint8Array | null = null;
  try {
    const pdfData = extractPdfData(eventData, patientName, eventTimestamp);
    pdfBytes = await generatePatientPdf(pdfData);
  } catch (error) {
    console.error("PDF generation failed:", error);
  }

  // ─── 2. START VIDEO GENERATION (async, don't wait) ───
  const videoCallData: VideoCallData = {
    premiumLensInterest,
    laserInterest,
    activities,
    visionPreference,
    concerns,
  };

  // Fire and forget — video generation runs in background
  const videoPromise = generateVideo(videoCallData, eventId).catch((err) =>
    console.error("Video generation error:", err)
  );

  // ─── 3. SEND DOCTOR EMAIL ───
  if (doctorEmail) {
    try {
      const doctorHtml = await render(
        DoctorSummaryEmail({
          patientName,
          callDate,
          duration: duration != null ? formatDuration(duration) : "N/A",
          callOutcome,
          visionScale,
          glassesPreference,
          premiumLensInterest,
          laserInterest,
          activities,
          medicalConditions,
          concerns,
          callSummary,
          evaluationResults,
        })
      );

      await getResend().emails.send({
        from: fromEmail,
        to: doctorEmail,
        subject: `Call Summary: ${patientName} — ${callDate}`,
        html: doctorHtml,
      });

      await prisma.webhookEvent.update({
        where: { id: eventId },
        data: { doctorEmailSentAt: new Date() },
      });

      console.log("Doctor email sent for event", eventId);
    } catch (error) {
      console.error("Failed to send doctor email:", error);
    }
  }

  // ─── 4. SEND PATIENT EMAIL WITH PDF ───
  if (patientEmail && pdfBytes) {
    try {
      const patientHtml = await render(
        PatientEmail({
          patientName,
          callDate,
          videoUrl: null,
          videoReady: false,
        })
      );

      await getResend().emails.send({
        from: fromEmail,
        to: patientEmail,
        subject: `Your Cataract Surgery Guide — ${callDate}`,
        html: patientHtml,
        attachments: [
          {
            filename: `cataract-surgery-guide-${patientName.replace(/\s+/g, "-").toLowerCase()}.pdf`,
            content: Buffer.from(pdfBytes).toString("base64"),
          },
        ],
      });

      await prisma.webhookEvent.update({
        where: { id: eventId },
        data: {
          patientEmail,
          patientEmailSentAt: new Date(),
        },
      });

      console.log("Patient email sent for event", eventId);
    } catch (error) {
      console.error("Failed to send patient email:", error);
    }
  } else if (!patientEmail) {
    console.log("No patient email found, skipping patient email for event", eventId);
  }

  // ─── 5. WAIT FOR VIDEO AND SEND FOLLOW-UP IF NEEDED ───
  try {
    const videoUrl = await videoPromise;
    if (videoUrl && patientEmail) {
      // Send follow-up video email
      try {
        const videoHtml = await render(
          PatientVideoReadyEmail({
            patientName,
            videoUrl,
          })
        );

        await getResend().emails.send({
          from: fromEmail,
          to: patientEmail,
          subject: `Your Personalized Surgery Video Is Ready`,
          html: videoHtml,
        });

        console.log("Patient video email sent for event", eventId);
      } catch (error) {
        console.error("Failed to send video follow-up email:", error);
      }
    }
  } catch {
    // Video errors already logged in generateVideo
  }
}
