import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { constructWebhookEvent } from "@/lib/verify-signature";
import { extractPatientData } from "@/lib/extract-patient-data";
import type { EventData } from "@/lib/types";

export async function GET() {
  return NextResponse.json({ status: "webhook listening" });
}

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function extractNameFromValue(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      const name =
        (parsed as { patient_name?: string; name?: string; full_name?: string })
          .patient_name ||
        (parsed as { patient_name?: string; name?: string; full_name?: string })
          .name ||
        (parsed as { patient_name?: string; name?: string; full_name?: string })
          .full_name;
      if (typeof name === "string" && name.trim()) {
        return normalizeName(name);
      }
    }
  } catch {
    // Non-JSON values are valid and handled below.
  }

  return normalizeName(raw);
}

function extractCandidateNames(eventData: EventData): string[] {
  const dcr = eventData.analysis?.data_collection_results ?? {};
  const names = new Set<string>();

  for (const [key, entry] of Object.entries(dcr)) {
    const lowerKey = key.toLowerCase();
    const isNameField =
      lowerKey.includes("patient name") ||
      lowerKey === "name" ||
      (lowerKey.includes("name") && !lowerKey.includes("doctor"));

    if (!isNameField) continue;
    const parsed = extractNameFromValue(entry.value);
    if (!parsed) continue;

    const lowerName = parsed.toLowerCase();
    if (
      lowerName === "unknown" ||
      lowerName === "null" ||
      lowerName === "patient" ||
      lowerName.includes("@")
    ) {
      continue;
    }

    names.add(parsed);
  }

  return [...names];
}

function splitName(fullName: string): { firstName: string; lastName: string | null } {
  const normalized = normalizeName(fullName);
  const parts = normalized.split(" ").filter(Boolean);
  const firstName = parts[0] ?? "";
  const lastName = parts.length > 1 ? parts.slice(1).join(" ") : null;
  return { firstName, lastName };
}

async function findPatientIdForEvent(
  eventData: EventData,
  patientEmail: string | null
): Promise<string | null> {
  if (patientEmail) {
    const byEmail = await prisma.patient.findFirst({
      where: { email: { equals: patientEmail, mode: "insensitive" } },
      select: { id: true },
    });
    if (byEmail) return byEmail.id;
  }

  const candidateNames = extractCandidateNames(eventData);
  if (candidateNames.length === 0) return null;

  for (const candidateName of candidateNames) {
    const { firstName, lastName } = splitName(candidateName);
    const inFlightNameMatch = await prisma.patient.findFirst({
      where: {
        callStatus: { in: ["pending", "queued", "retry", "answered"] },
        name: { equals: candidateName, mode: "insensitive" },
      },
      orderBy: [{ appointmentDate: "asc" }, { updatedAt: "desc" }],
      select: { id: true },
    });
    if (inFlightNameMatch) return inFlightNameMatch.id;

    if (firstName) {
      const inFlightSplitMatch = await prisma.patient.findFirst({
        where: {
          callStatus: { in: ["pending", "queued", "retry", "answered"] },
          firstName: { equals: firstName, mode: "insensitive" },
          ...(lastName
            ? { lastName: { equals: lastName, mode: "insensitive" } }
            : {}),
        },
        orderBy: [{ appointmentDate: "asc" }, { updatedAt: "desc" }],
        select: { id: true },
      });
      if (inFlightSplitMatch) return inFlightSplitMatch.id;
    }

    const anyNameMatch = await prisma.patient.findFirst({
      where: { name: { equals: candidateName, mode: "insensitive" } },
      orderBy: [{ appointmentDate: "asc" }, { updatedAt: "desc" }],
      select: { id: true },
    });
    if (anyNameMatch) return anyNameMatch.id;

    if (firstName) {
      const anySplitMatch = await prisma.patient.findFirst({
        where: {
          firstName: { equals: firstName, mode: "insensitive" },
          ...(lastName
            ? { lastName: { equals: lastName, mode: "insensitive" } }
            : {}),
        },
        orderBy: [{ appointmentDate: "asc" }, { updatedAt: "desc" }],
        select: { id: true },
      });
      if (anySplitMatch) return anySplitMatch.id;
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signatureHeader = request.headers.get("ElevenLabs-Signature");

  if (!signatureHeader) {
    return NextResponse.json(
      { error: "Missing ElevenLabs-Signature header" },
      { status: 401 }
    );
  }

  const secret = process.env.ELEVENLABS_CONVAI_WEBHOOK_SECRET;
  if (!secret) {
    console.error("ELEVENLABS_CONVAI_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event;
  try {
    event = constructWebhookEvent(body, signatureHeader, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verification failed";
    console.error("Webhook verification failed:", message);
    return NextResponse.json({ error: message }, { status: 401 });
  }

  const data = event.data as Record<string, unknown>;
  const conversationId = (data.conversation_id as string) ?? null;
  const extracted = extractPatientData(event.data as EventData);
  const matchedPatientId = await findPatientIdForEvent(
    event.data as EventData,
    extracted.patientEmail
  );

  const basePayload = {
    type: event.type,
    eventTimestamp: event.event_timestamp,
    agentId: (data.agent_id as string) ?? null,
    conversationId,
    status:
      event.type === "post_call_transcription"
        ? (data.status as string) ?? null
        : null,
    data: event.data as object,
    callSuccessful: extracted.callSuccessful,
    callDurationSecs: extracted.callDurationSecs,
    visionScale: extracted.visionScale,
    activities: extracted.activities,
    visionPreference: extracted.visionPreference,
    patientEmail: extracted.patientEmail,
  };
  const createPayload = matchedPatientId
    ? { ...basePayload, patientId: matchedPatientId }
    : basePayload;
  const updatePayload = matchedPatientId
    ? { ...basePayload, patientId: matchedPatientId }
    : basePayload;

  let savedEvent;
  try {
    if (conversationId) {
      savedEvent = await prisma.webhookEvent.upsert({
        where: { conversationId },
        create: createPayload,
        update: updatePayload,
      });
    } else {
      savedEvent = await prisma.webhookEvent.create({ data: createPayload });
    }
  } catch (err) {
    console.error("Failed to store webhook event:", err);
    return NextResponse.json(
      { error: "Failed to store event" },
      { status: 500 }
    );
  }

  if (event.type === "post_call_transcription" && savedEvent.patientId) {
    if (savedEvent.callSuccessful === true) {
      await prisma.patient.updateMany({
        where: {
          id: savedEvent.patientId,
          callStatus: { in: ["pending", "queued", "retry"] },
        },
        data: { callStatus: "answered" },
      });
    } else if (savedEvent.callSuccessful === false) {
      await prisma.patient.updateMany({
        where: {
          id: savedEvent.patientId,
          callStatus: { in: ["pending", "queued", "answered"] },
        },
        data: { callStatus: "retry" },
      });
    }
  }

  return NextResponse.json({ received: true, patientId: savedEvent.patientId });
}
