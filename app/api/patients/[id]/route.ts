import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const updateData: Record<string, string | null> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.phone !== undefined) updateData.phone = body.phone || null;
  if (body.notes !== undefined) updateData.notes = body.notes || null;

  try {
    const patient = await prisma.patient.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json(patient);
  } catch {
    return NextResponse.json(
      { error: "Patient not found" },
      { status: 404 }
    );
  }
}
