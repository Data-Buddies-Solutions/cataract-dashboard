import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const patients = await prisma.patient.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      phone: true,
      callStatus: true,
    },
  });
  return NextResponse.json(patients);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { firstName, lastName, phone, dateOfBirth, appointmentDate, doctor, notes } = body;

  // Support both old (name) and new (firstName/lastName) creation
  if (firstName || lastName) {
    const fn = (firstName || "").trim();
    const ln = (lastName || "").trim();
    const computedName = [fn, ln].filter(Boolean).join(" ");

    if (!computedName) {
      return NextResponse.json(
        { error: "First name or last name is required" },
        { status: 400 }
      );
    }

    const patient = await prisma.patient.create({
      data: {
        name: computedName,
        firstName: fn || null,
        lastName: ln || null,
        phone: phone?.trim() || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        appointmentDate: appointmentDate ? new Date(appointmentDate) : null,
        doctor: doctor?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json(patient, { status: 201 });
  }

  // Legacy: support plain "name" field
  const { name } = body;
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json(
      { error: "Name is required" },
      { status: 400 }
    );
  }

  const trimmed = name.trim();
  const spaceIdx = trimmed.indexOf(" ");
  const fn = spaceIdx > 0 ? trimmed.slice(0, spaceIdx) : trimmed;
  const ln = spaceIdx > 0 ? trimmed.slice(spaceIdx + 1) : "";

  const patient = await prisma.patient.create({
    data: {
      name: trimmed,
      firstName: fn,
      lastName: ln || null,
      phone: phone?.trim() || null,
      notes: notes?.trim() || null,
    },
  });

  return NextResponse.json(patient, { status: 201 });
}
