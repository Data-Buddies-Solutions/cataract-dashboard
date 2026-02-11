import Link from "next/link";
import { prisma } from "@/lib/db";
import { VisionScaleBadge } from "@/app/components/vision-scale-badge";

export const dynamic = "force-dynamic";

export default async function PatientsPage() {
  const patients = await prisma.patient.findMany({
    orderBy: { name: "asc" },
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

  const untaggedCount = await prisma.webhookEvent.count({
    where: {
      type: "post_call_transcription",
      patientId: null,
    },
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Patients</h1>

      {untaggedCount > 0 && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
          <strong>{untaggedCount}</strong> untagged call
          {untaggedCount !== 1 ? "s" : ""} — assign patients from the{" "}
          <Link href="/" className="underline hover:text-amber-900 dark:hover:text-amber-200">
            Calls
          </Link>{" "}
          page.
        </div>
      )}

      {patients.length === 0 ? (
        <p className="text-muted-foreground">
          No patients yet. Tag a call from the dashboard to create a patient.
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
                  # Calls
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Last Call
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Avg Vision Scale
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Vision Preference
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {patients.map((patient) => {
                const callCount = patient.calls.length;
                const lastCall = patient.calls[0];
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
                const latestPreference = patient.calls.find(
                  (c) => c.visionPreference
                )?.visionPreference;

                return (
                  <tr key={patient.id} className="hover:bg-muted">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground">
                      <Link
                        href={`/patients/${patient.id}`}
                        className="hover:text-foreground hover:underline"
                      >
                        {patient.name}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                      {callCount}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                      {lastCall
                        ? lastCall.createdAt.toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <VisionScaleBadge scale={avgScale} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                      {latestPreference ?? "—"}
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
