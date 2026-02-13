import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const event = await prisma.webhookEvent.findUnique({
      where: { id },
      select: { reviewedAt: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    const updated = await prisma.webhookEvent.update({
      where: { id },
      data: { reviewedAt: event.reviewedAt ? null : new Date() },
    });

    return NextResponse.json({ reviewedAt: updated.reviewedAt });
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
