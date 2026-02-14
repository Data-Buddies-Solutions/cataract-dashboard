import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  AlertTriangle,
  Target,
  Sparkles,
  Eye,
  MessageCircle,
  Briefcase,
} from "lucide-react";
import type { EventData } from "@/lib/types";
import { extractCallInsights } from "@/lib/extract-call-insights";
import { formatDateET, getEasternDayRange } from "@/lib/time";

export const dynamic = "force-dynamic";

function computeAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const m = today.getMonth() - dateOfBirth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return age;
}

const tierColor: Record<string, string> = {
  high: "bg-medical-success/10 text-medical-success border-medical-success/20",
  moderate: "bg-medical-warning/10 text-medical-warning border-medical-warning/20",
  low: "bg-medical-info/10 text-medical-info border-medical-info/20",
  insufficient: "bg-muted text-muted-foreground",
};

const tierLabel: Record<string, string> = {
  high: "High",
  moderate: "Moderate",
  low: "Low",
  insufficient: "Insufficient Data",
};

export default async function DashboardPage() {
  const now = new Date();
  const { start: startOfDay, end: endOfDay } = getEasternDayRange(now);

  const patients = await prisma.patient.findMany({
    where: {
      appointmentDate: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
    include: {
      calls: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { appointmentDate: "asc" },
  });

  const dateStr = formatDateET(now, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Today&apos;s Patients</h1>
        <p className="mt-1 text-sm text-muted-foreground">{dateStr}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {patients.length === 0
            ? "No patients scheduled for today"
            : `${patients.length} patient${patients.length === 1 ? "" : "s"} scheduled today`}
        </p>
      </div>

      {patients.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">No patients scheduled for today</p>
          <Link
            href="/patients"
            className="mt-3 inline-block text-sm text-primary hover:underline"
          >
            View all patients &rarr;
          </Link>
        </div>
      )}

      {patients.length > 0 && (
        <div className="space-y-3">
          {patients.map((patient) => (
            <PatientCard key={patient.id} patient={patient} />
          ))}
        </div>
      )}
    </main>
  );
}

type PatientWithCalls = Awaited<ReturnType<typeof prisma.patient.findMany<{
  include: { calls: { orderBy: { createdAt: "desc" }; take: 1 } };
}>>>[number];

function PatientCard({ patient }: { patient: PatientWithCalls }) {
  const latestCall = patient.calls[0];
  const age = patient.dateOfBirth ? computeAge(patient.dateOfBirth) : null;
  const displayName = [patient.firstName, patient.lastName].filter(Boolean).join(" ") || patient.name;

  if (!latestCall) {
    // No screening call
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{displayName}</h3>
              {age != null && (
                <span className="text-sm text-muted-foreground">{age}y</span>
              )}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-sm text-medical-warning">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>No AI screening call yet</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const callData = latestCall.data as EventData;
  const insights = extractCallInsights(callData, latestCall, patient);

  return (
    <Link
      href={`/calls/${latestCall.id}`}
      className="block rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Name & Age */}
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold">{displayName}</h3>
            {age != null && (
              <span className="shrink-0 text-sm text-muted-foreground">{age}y</span>
            )}
          </div>

          {/* Occupation */}
          {insights.occupationValue && (
            <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Briefcase className="h-3 w-3" />
              <span className="truncate">{insights.occupationValue}</span>
            </div>
          )}

          {/* Key metrics row */}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {/* Propensity Score + Tier */}
            {insights.propensity.tier !== "insufficient" && (
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold">{insights.propensity.overallScore}%</span>
                <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${tierColor[insights.propensity.tier]}`}>
                  {tierLabel[insights.propensity.tier]}
                </span>
              </div>
            )}

            {/* Vision Impact */}
            {insights.visionScale != null && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Eye className="h-3 w-3" />
                <span>{insights.visionScale}/10</span>
                <span className="text-xs">({insights.visionSeverity})</span>
              </div>
            )}

            {/* Readiness */}
            {insights.readinessLabel && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Target className="h-3 w-3" />
                <span>{insights.readinessLabel}</span>
              </div>
            )}

            {/* Premium Lens */}
            {insights.premiumLensLabel && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                <span>{insights.premiumLensLabel}</span>
              </div>
            )}
          </div>

          {/* Key Concern */}
          {insights.concernsValue && (
            <div className="mt-2 flex items-start gap-1.5">
              <MessageCircle className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
              <p className="line-clamp-1 text-sm text-muted-foreground">
                {insights.concernsValue}
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
