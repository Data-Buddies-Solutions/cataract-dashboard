import Link from "next/link";
import { prisma } from "@/lib/db";
import { AnalyticsStatCard } from "@/app/components/analytics-stat-card";
import {
  Users,
  ListOrdered,
  PhoneCall,
  Calendar,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [totalPatients, queueSize, todayCalls, upcomingAppointments] =
    await Promise.all([
      prisma.patient.count(),
      prisma.patient.count({ where: { callStatus: "queued" } }),
      prisma.webhookEvent.count({
        where: {
          type: "post_call_transcription",
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.patient.count({
        where: {
          appointmentDate: {
            gte: new Date(),
          },
        },
      }),
    ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of patients, calls, and queue status
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <AnalyticsStatCard
          label="Total Patients"
          value={String(totalPatients)}
          icon={Users}
          iconColorClass="bg-muted text-muted-foreground"
          bgClass=""
        />
        <AnalyticsStatCard
          label="Queue Size"
          value={String(queueSize)}
          icon={ListOrdered}
          iconColorClass="bg-muted text-muted-foreground"
          bgClass=""
        />
        <AnalyticsStatCard
          label="Calls Today"
          value={String(todayCalls)}
          icon={PhoneCall}
          iconColorClass="bg-muted text-muted-foreground"
          bgClass=""
        />
        <AnalyticsStatCard
          label="Upcoming Appts"
          value={String(upcomingAppointments)}
          icon={Calendar}
          iconColorClass="bg-muted text-muted-foreground"
          bgClass=""
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/patients"
          className="rounded-lg border bg-card p-5 transition-colors hover:bg-accent"
        >
          <Users className="mb-2 h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold">Patients</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            View and manage patient records
          </p>
        </Link>
        <Link
          href="/queue"
          className="rounded-lg border bg-card p-5 transition-colors hover:bg-accent"
        >
          <ListOrdered className="mb-2 h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold">Call Queue</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage patients queued for AI calls
          </p>
        </Link>
        <Link
          href="/calls"
          className="rounded-lg border bg-card p-5 transition-colors hover:bg-accent"
        >
          <PhoneCall className="mb-2 h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold">Call History</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse all received call data
          </p>
        </Link>
      </div>
    </main>
  );
}
