import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { patientId } = body;

  try {
    const event = await prisma.webhookEvent.update({
      where: { id },
      data: { patientId: patientId || null },
    });
    return NextResponse.json({ success: true, patientId: event.patientId });
  } catch {
    return NextResponse.json(
      { error: "Call not found" },
      { status: 404 }
    );
  }
}
