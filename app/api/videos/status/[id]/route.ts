import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const event = await prisma.webhookEvent.findUnique({
    where: { id },
    select: {
      videoStatus: true,
      videoUrl: true,
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  }

  return NextResponse.json({
    videoStatus: event.videoStatus,
    videoUrl: event.videoUrl,
  });
}
