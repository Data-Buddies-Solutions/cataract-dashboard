import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface ImportPatient {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  appointmentDate?: string;
  doctor?: string;
}

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

function safeParseDate(value: string | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toDateKey(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { patients } = body as { patients: ImportPatient[] };

  if (!Array.isArray(patients) || patients.length === 0) {
    return NextResponse.json(
      { error: "patients array is required" },
      { status: 400 }
    );
  }

  const existingPatients = await prisma.patient.findMany({
    select: {
      name: true,
      firstName: true,
      lastName: true,
      phone: true,
      dateOfBirth: true,
    },
  });

  const existingPhones = new Set<string>();
  const existingNameDob = new Set<string>();
  const existingNameOnly = new Set<string>();

  for (const patient of existingPatients) {
    const displayName =
      [patient.firstName, patient.lastName].filter(Boolean).join(" ").trim() ||
      patient.name;
    const normalizedName = normalizeName(displayName);
    if (normalizedName) {
      existingNameOnly.add(normalizedName);
      const dobKey = toDateKey(patient.dateOfBirth);
      if (dobKey) {
        existingNameDob.add(`${normalizedName}|${dobKey}`);
      }
    }

    const phone = normalizePhone(patient.phone ?? undefined);
    if (phone) existingPhones.add(phone);
  }

  let skippedDuplicates = 0;
  let skippedInvalid = 0;
  const data: {
    name: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    dateOfBirth: Date | null;
    appointmentDate: Date | null;
    doctor: string | null;
    callStatus: "pending";
  }[] = [];

  for (const p of patients) {
    const fn = (p.firstName || "").trim();
    const ln = (p.lastName || "").trim();
    const displayName = [fn, ln].filter(Boolean).join(" ").trim();
    if (!displayName) {
      skippedInvalid++;
      continue;
    }

    const normalizedName = normalizeName(displayName);
    const normalizedPhone = normalizePhone(p.phone);
    const dob = safeParseDate(p.dateOfBirth);
    const appt = safeParseDate(p.appointmentDate);
    const dobKey = toDateKey(dob);

    const duplicateByPhone = normalizedPhone ? existingPhones.has(normalizedPhone) : false;
    const duplicateByNameDob = dobKey ? existingNameDob.has(`${normalizedName}|${dobKey}`) : false;
    const duplicateByNameOnly =
      !normalizedPhone && !dobKey && existingNameOnly.has(normalizedName);

    if (duplicateByPhone || duplicateByNameDob || duplicateByNameOnly) {
      skippedDuplicates++;
      continue;
    }

    if (normalizedPhone) existingPhones.add(normalizedPhone);
    existingNameOnly.add(normalizedName);
    if (dobKey) existingNameDob.add(`${normalizedName}|${dobKey}`);

    data.push({
      name: displayName,
      firstName: fn || null,
      lastName: ln || null,
      phone: p.phone?.trim() || null,
      dateOfBirth: dob,
      appointmentDate: appt,
      doctor: p.doctor?.trim() || null,
      callStatus: "pending",
    });
  }

  if (data.length === 0) {
    return NextResponse.json(
      {
        imported: 0,
        skippedDuplicates,
        skippedInvalid,
      },
      { status: 200 }
    );
  }

  const result = await prisma.patient.createMany({ data });

  return NextResponse.json(
    {
      imported: result.count,
      skippedDuplicates,
      skippedInvalid,
    },
    { status: 201 }
  );
}
