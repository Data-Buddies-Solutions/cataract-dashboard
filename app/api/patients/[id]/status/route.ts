import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const VALID_STATUSES = ["pending", "queued", "called", "completed"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { callStatus } = body;

  if (!callStatus || !VALID_STATUSES.includes(callStatus)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const patient = await prisma.patient.update({
      where: { id },
      data: { callStatus },
    });
    return NextResponse.json(patient);
  } catch {
    return NextResponse.json(
      { error: "Patient not found" },
      { status: 404 }
    );
  }
}
