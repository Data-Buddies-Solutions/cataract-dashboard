import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { EventData, DataCollectionEntry } from "./types";

interface PatientPdfData {
  patientName: string;
  callDate: Date;
  visionScale: number | null;
  visionPreference: string | null;
  glassesPreference: string | null;
  premiumLensInterest: string | null;
  laserInterest: string | null;
  activities: string | null;
  hobbies: string | null;
  concerns: string | null;
  medicalConditions: string | null;
  driverInfo: string | null;
  callSummary: string | null;
}

function findEntry(
  dcr: Record<string, DataCollectionEntry>,
  ...keywords: string[]
): string | null {
  for (const [key, entry] of Object.entries(dcr)) {
    const lowerKey = key.toLowerCase();
    if (keywords.some((kw) => lowerKey.includes(kw))) {
      return entry.value || null;
    }
  }
  return null;
}

export function extractPdfData(
  eventData: EventData,
  patientName: string,
  eventTimestamp: number
): PatientPdfData {
  const dcr = eventData.analysis?.data_collection_results ?? {};

  return {
    patientName,
    callDate: new Date(eventTimestamp * 1000),
    visionScale: (() => {
      const val = findEntry(dcr, "scale", "impact", "rating", "score");
      if (!val) return null;
      const n = parseInt(val, 10);
      return !isNaN(n) && n >= 1 && n <= 10 ? n : null;
    })(),
    visionPreference: findEntry(
      dcr,
      "preference",
      "goal",
      "after",
      "post",
      "want",
      "hope"
    ),
    glassesPreference: findEntry(dcr, "glass", "independence", "spectacle"),
    premiumLensInterest: findEntry(
      dcr,
      "premium",
      "lens interest",
      "iol",
      "multifocal",
      "toric"
    ),
    laserInterest: findEntry(dcr, "femtosecond", "laser"),
    activities: findEntry(
      dcr,
      "activit",
      "daily",
      "affected",
      "struggle",
      "difficult",
      "functional",
      "demands",
      "limitation"
    ),
    hobbies: findEntry(dcr, "hobby", "hobbies", "lifestyle", "leisure"),
    concerns: findEntry(dcr, "concern", "question", "nervous", "worry", "fear"),
    medicalConditions: findEntry(
      dcr,
      "medical",
      "condition",
      "health",
      "medication",
      "surgical risk",
      "ocular history",
      "ocular"
    ),
    driverInfo: findEntry(dcr, "driver", "ride", "transport", "accompan"),
    callSummary: eventData.analysis?.transcript_summary ?? null,
  };
}

// Layout constants
const PAGE_WIDTH = 595; // A4
const PAGE_HEIGHT = 842;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const COLORS = {
  primary: rgb(0.13, 0.35, 0.65), // deep blue
  heading: rgb(0.1, 0.1, 0.1),
  body: rgb(0.25, 0.25, 0.25),
  muted: rgb(0.5, 0.5, 0.5),
  accent: rgb(0.13, 0.55, 0.35), // green accent
  divider: rgb(0.85, 0.85, 0.85),
  cardBg: rgb(0.96, 0.97, 0.98),
  white: rgb(1, 1, 1),
};

export async function generatePatientPdf(
  data: PatientPdfData
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  function addPage() {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
  }

  function checkSpace(needed: number) {
    if (y - needed < MARGIN) {
      addPage();
    }
  }

  function drawLine() {
    checkSpace(20);
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_WIDTH - MARGIN, y },
      thickness: 0.5,
      color: COLORS.divider,
    });
    y -= 15;
  }

  // Wrap long text into lines that fit within maxWidth
  function wrapText(
    text: string,
    font: typeof helvetica,
    fontSize: number,
    maxWidth: number
  ): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, fontSize);
      if (width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  function drawWrappedText(
    text: string,
    fontSize: number,
    color: typeof COLORS.body,
    font: typeof helvetica = helvetica,
    indent: number = 0
  ) {
    const lines = wrapText(text, font, fontSize, CONTENT_WIDTH - indent);
    for (const line of lines) {
      checkSpace(fontSize + 4);
      page.drawText(line, {
        x: MARGIN + indent,
        y,
        size: fontSize,
        font,
        color,
      });
      y -= fontSize + 4;
    }
  }

  function drawSectionHeading(title: string) {
    checkSpace(40);
    y -= 8;
    page.drawText(title.toUpperCase(), {
      x: MARGIN,
      y,
      size: 10,
      font: helveticaBold,
      color: COLORS.primary,
    });
    y -= 6;
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: MARGIN + 40, y },
      thickness: 2,
      color: COLORS.primary,
    });
    y -= 14;
  }

  function drawLabelValue(label: string, value: string) {
    checkSpace(30);
    page.drawText(label, {
      x: MARGIN,
      y,
      size: 9,
      font: helveticaBold,
      color: COLORS.muted,
    });
    y -= 14;
    drawWrappedText(value, 10, COLORS.body);
    y -= 4;
  }

  // ─── HEADER ───
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 100,
    width: PAGE_WIDTH,
    height: 100,
    color: COLORS.primary,
  });

  page.drawText("Your Cataract Surgery Guide", {
    x: MARGIN,
    y: PAGE_HEIGHT - 55,
    size: 22,
    font: helveticaBold,
    color: COLORS.white,
  });

  page.drawText("Personalized for your upcoming procedure", {
    x: MARGIN,
    y: PAGE_HEIGHT - 75,
    size: 11,
    font: helvetica,
    color: rgb(0.8, 0.85, 0.95),
  });

  y = PAGE_HEIGHT - 120;

  // Patient name and date
  page.drawText(`Prepared for: ${data.patientName}`, {
    x: MARGIN,
    y,
    size: 12,
    font: helveticaBold,
    color: COLORS.heading,
  });
  y -= 16;

  page.drawText(
    `Date: ${data.callDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}`,
    {
      x: MARGIN,
      y,
      size: 10,
      font: helvetica,
      color: COLORS.muted,
    }
  );
  y -= 24;

  drawLine();

  // ─── YOUR VISION GOALS ───
  drawSectionHeading("Your Vision Goals");

  if (data.visionPreference) {
    drawLabelValue("Vision Goal", data.visionPreference);
  }
  if (data.glassesPreference) {
    drawLabelValue("Glasses Preference", data.glassesPreference);
  }
  if (data.visionScale != null) {
    drawLabelValue(
      "Vision Impact Score",
      `${data.visionScale}/10 — ${
        data.visionScale <= 3
          ? "Mild impact on daily life"
          : data.visionScale <= 6
            ? "Moderate impact on daily life"
            : "Significant impact on daily life"
      }`
    );
  }
  if (!data.visionPreference && !data.glassesPreference && data.visionScale == null) {
    drawWrappedText("No vision goal information was collected during your call.", 10, COLORS.muted);
  }

  drawLine();

  // ─── WHAT WE DISCUSSED ───
  drawSectionHeading("What We Discussed");

  if (data.activities) {
    drawLabelValue("Activities Affected by Vision", data.activities);
  }
  if (data.hobbies) {
    drawLabelValue("Your Lifestyle & Hobbies", data.hobbies);
  }
  if (!data.activities && !data.hobbies) {
    drawWrappedText("No lifestyle details were discussed.", 10, COLORS.muted);
  }

  drawLine();

  // ─── PROCEDURE OPTIONS ───
  const hasPremium =
    data.premiumLensInterest &&
    !data.premiumLensInterest.toLowerCase().includes("no");
  const hasLaser =
    data.laserInterest &&
    !data.laserInterest.toLowerCase().includes("no");

  if (hasPremium || hasLaser) {
    drawSectionHeading("Procedure Options Discussed");

    if (hasPremium) {
      drawLabelValue("Premium Lens", data.premiumLensInterest!);
      drawWrappedText(
        "Premium intraocular lenses (IOLs) can reduce or eliminate the need for glasses after cataract surgery. Options include multifocal lenses for near and distance vision, toric lenses for astigmatism correction, and extended depth of focus lenses. Your surgeon will discuss which option best matches your vision goals.",
        9,
        COLORS.body,
        helvetica,
        0
      );
      y -= 8;
    }

    if (hasLaser) {
      drawLabelValue("Femtosecond Laser-Assisted Surgery", data.laserInterest!);
      drawWrappedText(
        "Femtosecond laser technology provides computer-guided precision during key steps of cataract surgery. The laser creates precise incisions and softens the cataract for gentle removal. This can enhance accuracy, especially when combined with premium lens implants.",
        9,
        COLORS.body,
        helvetica,
        0
      );
      y -= 8;
    }

    drawLine();
  }

  // ─── YOUR CONCERNS ───
  if (data.concerns) {
    drawSectionHeading("Your Questions & Concerns");
    drawWrappedText(data.concerns, 10, COLORS.body);
    y -= 6;
    drawWrappedText(
      "Your surgical team will address all of your concerns in detail during your pre-operative consultation. Please don't hesitate to bring up any additional questions at that time.",
      9,
      COLORS.muted,
      helvetica,
      0
    );
    drawLine();
  }

  // ─── MEDICAL NOTES ───
  if (data.medicalConditions) {
    drawSectionHeading("Medical Information");
    drawWrappedText(data.medicalConditions, 10, COLORS.body);
    y -= 4;
    drawWrappedText(
      "Please confirm all medical conditions and current medications with your surgical team.",
      9,
      COLORS.muted,
      helvetica,
      0
    );
    drawLine();
  }

  // ─── NEXT STEPS ───
  drawSectionHeading("Next Steps Before Surgery");

  const nextSteps = [
    "Attend your pre-operative consultation appointment",
    "Bring a current list of all medications you take",
    "Arrange for someone to drive you home after surgery",
    "Follow any instructions about eye drops or medications",
    "Avoid eating or drinking after midnight before surgery (if instructed)",
    "Wear comfortable clothing on the day of surgery",
  ];

  for (const step of nextSteps) {
    checkSpace(18);
    page.drawText("•", {
      x: MARGIN + 4,
      y: y + 1,
      size: 12,
      font: helvetica,
      color: COLORS.accent,
    });
    drawWrappedText(step, 10, COLORS.body, helvetica, 16);
    y -= 2;
  }

  if (data.driverInfo) {
    y -= 4;
    drawLabelValue("Transportation", data.driverInfo);
  }

  drawLine();

  // ─── CALL SUMMARY ───
  if (data.callSummary) {
    drawSectionHeading("Summary of Your Call");
    drawWrappedText(data.callSummary, 10, COLORS.body);
    drawLine();
  }

  // ─── FOOTER ───
  checkSpace(40);
  y -= 8;
  drawWrappedText(
    "This guide was generated from your pre-surgery call. It is for informational purposes only and does not replace medical advice from your surgical team.",
    8,
    COLORS.muted
  );

  return pdfDoc.save();
}
