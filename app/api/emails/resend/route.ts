import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendPostCallEmails } from "@/lib/send-post-call-emails";
import type { EventData } from "@/lib/types";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { callId, type } = body as {
    callId: string;
    type?: "patient" | "doctor" | "both";
  };

  if (!callId) {
    return NextResponse.json({ error: "callId is required" }, { status: 400 });
  }

  const event = await prisma.webhookEvent.findUnique({
    where: { id: callId },
  });

  if (!event) {
    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  }

  const eventData = event.data as EventData;

  // Fire-and-forget
  sendPostCallEmails(eventData, event.id).catch((err) =>
    console.error("Resend email error:", err)
  );

  return NextResponse.json({
    success: true,
    message: `Resending ${type || "both"} email(s) for call ${callId}`,
  });
}
