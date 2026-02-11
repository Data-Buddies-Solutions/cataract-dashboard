import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function VideoPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const event = await prisma.webhookEvent.findUnique({
    where: { id },
    select: {
      videoUrl: true,
      videoStatus: true,
      patientEmail: true,
    },
  });

  if (!event) {
    notFound();
  }

  if (event.videoStatus === "generating") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-xl rounded-xl bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <h1 className="text-xl font-bold text-gray-900">
            Your Video Is Being Created
          </h1>
          <p className="mt-2 text-gray-500">
            We&apos;re generating a personalized video for you. This usually
            takes about 2 minutes. Please refresh this page shortly.
          </p>
        </div>
      </main>
    );
  }

  if (event.videoStatus === "failed" || !event.videoUrl) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-xl rounded-xl bg-white p-8 text-center shadow-lg">
          <h1 className="text-xl font-bold text-gray-900">
            Video Unavailable
          </h1>
          <p className="mt-2 text-gray-500">
            We weren&apos;t able to generate your personalized video. Please
            contact the office if you have questions about your upcoming
            procedure.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
          Your Cataract Surgery Guide
        </h1>
        <p className="mb-6 text-center text-gray-500">
          This personalized video was created to help you understand your
          upcoming procedure.
        </p>
        <div className="overflow-hidden rounded-lg bg-black">
          <video
            controls
            autoPlay
            playsInline
            className="w-full"
            src={event.videoUrl}
          >
            Your browser does not support the video tag.
          </video>
        </div>
        <p className="mt-4 text-center text-xs text-gray-400">
          This video is for educational purposes only and does not replace
          medical advice from your surgical team.
        </p>
      </div>
    </main>
  );
}
