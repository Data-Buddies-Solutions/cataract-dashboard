import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { constructWebhookEvent } from "@/lib/verify-signature";
import { extractPatientData } from "@/lib/extract-patient-data";
import type { EventData } from "@/lib/types";

export async function GET() {
  return NextResponse.json({ status: "webhook listening" });
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

  const payload = {
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
  };

  try {
    if (conversationId) {
      await prisma.webhookEvent.upsert({
        where: { conversationId },
        create: payload,
        update: payload,
      });
    } else {
      await prisma.webhookEvent.create({ data: payload });
    }
  } catch (err) {
    console.error("Failed to store webhook event:", err);
    return NextResponse.json(
      { error: "Failed to store event" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
