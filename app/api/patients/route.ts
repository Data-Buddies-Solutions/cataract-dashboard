import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizePhone(value: string | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return digits;
}

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

    const normalizedComputedName = normalizeName(computedName);
    const normalizedPhone = normalizePhone(phone);
    const parsedDobCandidate = dateOfBirth ? new Date(dateOfBirth) : null;
    const parsedDob =
      parsedDobCandidate && !Number.isNaN(parsedDobCandidate.getTime())
        ? parsedDobCandidate
        : null;
    const dobKey = parsedDob && !Number.isNaN(parsedDob.getTime())
      ? parsedDob.toISOString().slice(0, 10)
      : null;

    const existing = await prisma.patient.findMany({
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        phone: true,
        dateOfBirth: true,
      },
    });

    const duplicate = existing.find((patient) => {
      const existingPhone = normalizePhone(patient.phone ?? undefined);
      if (normalizedPhone && existingPhone && normalizedPhone === existingPhone) {
        return true;
      }

      const existingDisplayName =
        [patient.firstName, patient.lastName].filter(Boolean).join(" ").trim() ||
        patient.name;
      const existingNormalizedName = normalizeName(existingDisplayName);

      if (existingNormalizedName !== normalizedComputedName) return false;
      if (!dobKey) return true;

      const existingDobKey = patient.dateOfBirth
        ? patient.dateOfBirth.toISOString().slice(0, 10)
        : null;
      return existingDobKey === dobKey;
    });

    if (duplicate) {
      return NextResponse.json(
        { error: "Patient already exists" },
        { status: 409 }
      );
    }

    const patient = await prisma.patient.create({
      data: {
        name: computedName,
        firstName: fn || null,
        lastName: ln || null,
        phone: phone?.trim() || null,
        dateOfBirth: parsedDob,
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
