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
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>{untaggedCount}</strong> untagged call
          {untaggedCount !== 1 ? "s" : ""} — assign patients from the{" "}
          <Link href="/" className="underline hover:text-amber-900">
            Calls
          </Link>{" "}
          page.
        </div>
      )}

      {patients.length === 0 ? (
        <p className="text-gray-500">
          No patients yet. Tag a call from the dashboard to create a patient.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Patient Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  # Calls
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Last Call
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Avg Vision Scale
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Vision Preference
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
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
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                      <Link
                        href={`/patients/${patient.id}`}
                        className="hover:text-blue-600 hover:underline"
                      >
                        {patient.name}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {callCount}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {lastCall
                        ? lastCall.createdAt.toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <VisionScaleBadge scale={avgScale} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
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
