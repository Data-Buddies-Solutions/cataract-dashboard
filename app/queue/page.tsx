import Link from "next/link";
import { prisma } from "@/lib/db";
import { CallStatusActions } from "@/app/components/call-status-actions";
import { getCallStatusLabel, normalizeCallStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { formatDateET } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function QueuePage() {
  const patients = await prisma.patient.findMany({
    where: { callStatus: { in: ["queued", "retry"] } },
    orderBy: [{ appointmentDate: "asc" }, { lastName: "asc" }],
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Call Queue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {patients.length} patient{patients.length !== 1 ? "s" : ""} needing
          outreach calls
        </p>
      </div>

      {patients.length === 0 ? (
        <p className="text-muted-foreground">
          No patients in the queue. Add patients to the queue from the{" "}
          <Link href="/patients" className="underline hover:text-foreground">
            Patients
          </Link>{" "}
          page.
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
                  Phone
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Appointment Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Doctor
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

                return (
                  <tr key={patient.id} className="hover:bg-muted">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground">
                      <Link
                        href={`/patients/${patient.id}`}
                        className="hover:underline"
                      >
                        {displayName}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                      {patient.phone || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                      {patient.appointmentDate
                        ? formatDateET(patient.appointmentDate)
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                      {patient.doctor || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <Badge
                        variant={
                          normalizeCallStatus(patient.callStatus) === "retry"
                            ? "destructive"
                            : "outline"
                        }
                      >
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
