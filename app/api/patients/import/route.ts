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

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { patients } = body as { patients: ImportPatient[] };

  if (!Array.isArray(patients) || patients.length === 0) {
    return NextResponse.json(
      { error: "patients array is required" },
      { status: 400 }
    );
  }

  const data = patients
    .map((p) => {
      const fn = (p.firstName || "").trim();
      const ln = (p.lastName || "").trim();
      const name = [fn, ln].filter(Boolean).join(" ");
      if (!name) return null;
      return {
        name,
        firstName: fn || null,
        lastName: ln || null,
        phone: p.phone?.trim() || null,
        dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth) : null,
        appointmentDate: p.appointmentDate ? new Date(p.appointmentDate) : null,
        doctor: p.doctor?.trim() || null,
        callStatus: "pending",
      };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null);

  if (data.length === 0) {
    return NextResponse.json(
      { error: "No valid patient records found" },
      { status: 400 }
    );
  }

  const result = await prisma.patient.createMany({ data });

  return NextResponse.json({ imported: result.count }, { status: 201 });
}
