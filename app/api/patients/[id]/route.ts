import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const updateData: Record<string, unknown> = {};
  if (body.firstName !== undefined) updateData.firstName = body.firstName || null;
  if (body.lastName !== undefined) updateData.lastName = body.lastName || null;
  if (body.phone !== undefined) updateData.phone = body.phone || null;
  if (body.notes !== undefined) updateData.notes = body.notes || null;
  if (body.dateOfBirth !== undefined)
    updateData.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null;
  if (body.appointmentDate !== undefined)
    updateData.appointmentDate = body.appointmentDate ? new Date(body.appointmentDate) : null;
  if (body.doctor !== undefined) updateData.doctor = body.doctor || null;
  if (body.callStatus !== undefined) updateData.callStatus = body.callStatus;

  // Recompute name if firstName or lastName changed
  if (body.firstName !== undefined || body.lastName !== undefined) {
    const existing = await prisma.patient.findUnique({ where: { id } });
    if (existing) {
      const fn = (body.firstName ?? existing.firstName ?? "").trim();
      const ln = (body.lastName ?? existing.lastName ?? "").trim();
      updateData.name = [fn, ln].filter(Boolean).join(" ");
    }
  }

  // Legacy: support plain name update
  if (body.name !== undefined && body.firstName === undefined) {
    updateData.name = body.name;
  }

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
