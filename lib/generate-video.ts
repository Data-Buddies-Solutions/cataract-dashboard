import { getGoogleAI } from "./google-ai";
import { prisma } from "./db";

interface VideoCallData {
  premiumLensInterest: string | null;
  laserInterest: string | null;
  activities: string | null;
  visionPreference: string | null;
  concerns: string | null;
}

function buildVideoPrompt(data: VideoCallData): string {
  const parts: string[] = [
    "A calm, professional medical animation explaining cataract surgery in a warm, reassuring style.",
    "Clean white and soft blue color palette, modern medical illustration style.",
    "Show a gentle cross-section of an eye with a cloudy lens being replaced by a clear artificial lens.",
  ];

  // Tailor to premium lens interest
  const premiumLower = data.premiumLensInterest?.toLowerCase() ?? "";
  if (
    premiumLower.includes("yes") ||
    premiumLower.includes("interested") ||
    premiumLower.includes("maybe")
  ) {
    parts.push(
      "Highlight the premium lens implant with a subtle golden glow, showing how it provides clear vision at multiple distances."
    );
  }

  // Tailor to laser interest
  const laserLower = data.laserInterest?.toLowerCase() ?? "";
  if (
    laserLower.includes("yes") ||
    laserLower.includes("interested") ||
    laserLower.includes("maybe")
  ) {
    parts.push(
      "Show a precise laser beam making a clean circular incision, emphasizing computer-guided accuracy."
    );
  }

  // Tailor to patient activities
  if (data.activities) {
    const activitiesLower = data.activities.toLowerCase();
    if (
      activitiesLower.includes("driv") ||
      activitiesLower.includes("night")
    ) {
      parts.push(
        "End with a scene of clear nighttime driving vision, headlights without glare or halos."
      );
    } else if (
      activitiesLower.includes("read") ||
      activitiesLower.includes("book") ||
      activitiesLower.includes("computer")
    ) {
      parts.push(
        "End with a scene of crisp, clear text on a page coming into focus."
      );
    } else if (
      activitiesLower.includes("golf") ||
      activitiesLower.includes("sport") ||
      activitiesLower.includes("outdoor")
    ) {
      parts.push(
        "End with a bright outdoor scene coming into sharp, vivid focus."
      );
    } else {
      parts.push(
        "End with a bright, clear view of an everyday scene coming into sharp focus, symbolizing restored vision."
      );
    }
  } else {
    parts.push(
      "End with a bright, clear view of an everyday scene coming into sharp focus, symbolizing restored vision."
    );
  }

  parts.push(
    "No text overlays, no narration, no people's faces. Smooth transitions, soothing pace."
  );

  return parts.join(" ");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateVideo(
  callData: VideoCallData,
  eventId: string
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not configured, skipping video generation");
    return null;
  }

  try {
    // Mark as generating
    await prisma.webhookEvent.update({
      where: { id: eventId },
      data: { videoStatus: "generating" },
    });

    const prompt = buildVideoPrompt(callData);

    let operation = await getGoogleAI().models.generateVideos({
      model: "veo-3.1-generate-preview",
      prompt,
      config: {
        aspectRatio: "16:9",
      },
    });

    // Poll until complete (up to 5 minutes)
    const maxAttempts = 30;
    let attempt = 0;
    while (!operation.done && attempt < maxAttempts) {
      await sleep(10000);
      operation = await getGoogleAI().operations.getVideosOperation({ operation });
      attempt++;
    }

    if (!operation.done) {
      console.error("Video generation timed out for event", eventId);
      await prisma.webhookEvent.update({
        where: { id: eventId },
        data: { videoStatus: "failed" },
      });
      return null;
    }

    // Get the video URL from the response
    const video = operation.response?.generatedVideos?.[0]?.video;
    const videoUri = video?.uri ?? null;

    if (videoUri) {
      await prisma.webhookEvent.update({
        where: { id: eventId },
        data: { videoUrl: videoUri, videoStatus: "ready" },
      });
    } else {
      await prisma.webhookEvent.update({
        where: { id: eventId },
        data: { videoStatus: "failed" },
      });
    }

    return videoUri;
  } catch (error) {
    console.error("Video generation failed for event", eventId, error);
    await prisma.webhookEvent.update({
      where: { id: eventId },
      data: { videoStatus: "failed" },
    });
    return null;
  }
}

export { buildVideoPrompt, type VideoCallData };
