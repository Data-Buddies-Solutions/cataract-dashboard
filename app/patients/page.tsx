import Link from "next/link";
import { prisma } from "@/lib/db";
import { VisionScaleBadge } from "@/app/components/vision-scale-badge";
import { PatientIntakeDialog } from "@/app/components/patient-intake-dialog";
import { CallStatusActions } from "@/app/components/call-status-actions";
import { Badge } from "@/components/ui/badge";
import { getCallStatusLabel } from "@/lib/types";
import { formatDateET } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function PatientsPage() {
  const patients = await prisma.patient.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: {
      calls: {
        select: {
          id: true,
          visionScale: true,
          visionPreference: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Patients</h1>
        <PatientIntakeDialog />
      </div>

      {patients.length === 0 ? (
        <p className="text-muted-foreground">
          No patients yet. Use the &ldquo;Add Patients&rdquo; button above to get started.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Patient Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Appointment
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Doctor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  # Calls
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Avg Vision
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {patients.map((patient) => {
                const displayName =
                  [patient.firstName, patient.lastName]
                    .filter(Boolean)
                    .join(" ") || patient.name;
                const callCount = patient.calls.length;
                const scalesWithValue = patient.calls
                  .map((c) => c.visionScale)
                  .filter((v): v is number => v !== null);
                const avgScale =
                  scalesWithValue.length > 0
                    ? Math.round(
                        scalesWithValue.reduce((a, b) => a + b, 0) /
                          scalesWithValue.length
                      )
                    : null;

                return (
                  <tr key={patient.id} className="hover:bg-muted">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground">
                      <Link
                        href={`/patients/${patient.id}`}
                        className="hover:text-foreground hover:underline"
                      >
                        {displayName}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                      {patient.appointmentDate
                        ? formatDateET(patient.appointmentDate)
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                      {patient.doctor || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                      {callCount}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <VisionScaleBadge scale={avgScale} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <Badge variant="outline">
                        {getCallStatusLabel(patient.callStatus)}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <CallStatusActions
                        patientId={patient.id}
                        currentStatus={patient.callStatus}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
