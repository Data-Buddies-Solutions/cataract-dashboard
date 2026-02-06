import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const patients = await prisma.patient.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, phone: true },
  });
  return NextResponse.json(patients);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, phone, notes } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json(
      { error: "Name is required" },
      { status: 400 }
    );
  }

  const patient = await prisma.patient.create({
    data: {
      name: name.trim(),
      phone: phone?.trim() || null,
      notes: notes?.trim() || null,
    },
  });

  return NextResponse.json(patient, { status: 201 });
}
