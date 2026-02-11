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
      "goal"
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
    concerns: findEntry(
      dcr,
      "concern",
      "question",
      "nervous",
      "worry",
      "fear"
    ),
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

// ── Layout constants ──
const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 30;
const HEADER_H = 72;
const GUTTER = 12;
const FOOTER_H = 32;

const C = {
  navy: rgb(0.118, 0.227, 0.373),
  navyLight: rgb(0.16, 0.28, 0.44),
  teal: rgb(0.051, 0.451, 0.467),
  tealLight: rgb(0.85, 0.95, 0.95),
  warm: rgb(0.973, 0.961, 0.941),
  white: rgb(1, 1, 1),
  body: rgb(0.2, 0.2, 0.2),
  muted: rgb(0.5, 0.5, 0.5),
  light: rgb(0.93, 0.93, 0.93),
  cardBg: rgb(0.98, 0.98, 0.99),
  success: rgb(0.086, 0.639, 0.29),
  successLight: rgb(0.91, 0.98, 0.93),
  warning: rgb(0.851, 0.467, 0.024),
  warningLight: rgb(1, 0.97, 0.89),
  critical: rgb(0.863, 0.149, 0.149),
  criticalLight: rgb(1, 0.94, 0.94),
};

export async function generatePatientPdf(
  data: PatientPdfData
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  // ── Helpers ──
  function wrapText(
    text: string,
    f: typeof font,
    size: number,
    maxW: number
  ): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const test = cur ? `${cur} ${w}` : w;
      if (f.widthOfTextAtSize(test, size) > maxW && cur) {
        lines.push(cur);
        cur = w;
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  function drawText(
    text: string,
    x: number,
    y: number,
    size: number,
    f: typeof font,
    color: typeof C.body
  ) {
    page.drawText(text, { x, y, size, font: f, color });
  }

  /** Draw wrapped text, return y after last line */
  function drawWrapped(
    text: string,
    x: number,
    y: number,
    size: number,
    f: typeof font,
    color: typeof C.body,
    maxW: number,
    maxLines = 99
  ): number {
    const lines = wrapText(text, f, size, maxW).slice(0, maxLines);
    const lh = size + 5;
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (i === maxLines - 1 && wrapText(text, f, size, maxW).length > maxLines)
        line = line.slice(0, -3) + "...";
      drawText(line, x, y - i * lh, size, f, color);
    }
    return y - lines.length * lh;
  }

  function scoreColor(s: number) {
    if (s <= 3) return { fill: C.success, bg: C.successLight, label: "Mild" };
    if (s <= 6)
      return { fill: C.warning, bg: C.warningLight, label: "Moderate" };
    return { fill: C.critical, bg: C.criticalLight, label: "Significant" };
  }

  // ── Card geometry ──
  const contentTop = PAGE_HEIGHT - HEADER_H;
  const contentBot = FOOTER_H;
  const cardH = (contentTop - contentBot - GUTTER) / 2;
  const cardW = (PAGE_WIDTH - 2 * MARGIN - GUTTER) / 2;
  const PAD = 14; // inner card padding
  const innerW = cardW - PAD * 2;

  const TL = { x: MARGIN, y: contentTop };
  const TR = { x: MARGIN + cardW + GUTTER, y: contentTop };
  const BL = { x: MARGIN, y: contentTop - cardH - GUTTER };
  const BR = { x: MARGIN + cardW + GUTTER, y: contentTop - cardH - GUTTER };

  function drawCard(
    cx: number,
    cy: number,
    headerText: string,
    headerColor: typeof C.navy
  ) {
    // Card background
    page.drawRectangle({
      x: cx,
      y: cy - cardH,
      width: cardW,
      height: cardH,
      color: C.cardBg,
    });
    // Header strip
    const stripH = 28;
    page.drawRectangle({
      x: cx,
      y: cy - stripH,
      width: cardW,
      height: stripH,
      color: headerColor,
    });
    // Header text
    drawText(headerText.toUpperCase(), cx + PAD, cy - 19, 10, bold, C.white);
    // Return y position below header
    return cy - stripH - PAD;
  }

  // ════════════════════════════════════════
  //  HEADER BANNER
  // ════════════════════════════════════════
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - HEADER_H,
    width: PAGE_WIDTH,
    height: HEADER_H,
    color: C.navy,
  });
  // Teal accent at bottom
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - HEADER_H,
    width: PAGE_WIDTH,
    height: 3,
    color: C.teal,
  });

  drawText(
    "Your Cataract Surgery Guide",
    MARGIN,
    PAGE_HEIGHT - 32,
    20,
    bold,
    C.white
  );
  const dateStr = data.callDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  drawText(
    `${data.patientName}  |  ${dateStr}`,
    MARGIN,
    PAGE_HEIGHT - 52,
    10,
    font,
    rgb(0.7, 0.78, 0.88)
  );

  // ════════════════════════════════════════
  //  TOP-LEFT: YOUR VISION PROFILE
  // ════════════════════════════════════════
  let cy = drawCard(TL.x, TL.y, "Your Vision Profile", C.navy);
  const tlX = TL.x + PAD;

  if (data.visionScale != null) {
    const sc = scoreColor(data.visionScale);
    // Large score number
    drawText(`${data.visionScale}`, tlX, cy - 8, 48, bold, sc.fill);
    const numW = bold.widthOfTextAtSize(`${data.visionScale}`, 48);
    drawText("/10", tlX + numW + 2, cy - 8, 16, font, C.muted);
    // Severity badge
    const badgeY = cy - 14;
    const badgeX = tlX + numW + 36;
    page.drawRectangle({
      x: badgeX,
      y: badgeY,
      width: 70,
      height: 18,
      color: sc.bg,
    });
    drawText(sc.label, badgeX + 8, badgeY + 5, 9, bold, sc.fill);

    // Progress bar
    const barY = cy - 62;
    const barW = innerW;
    const barH = 8;
    // Track
    page.drawRectangle({
      x: tlX,
      y: barY,
      width: barW,
      height: barH,
      color: C.light,
    });
    // Fill
    page.drawRectangle({
      x: tlX,
      y: barY,
      width: barW * (data.visionScale / 10),
      height: barH,
      color: sc.fill,
    });
    // Scale labels
    drawText("1", tlX, barY - 12, 7, font, C.muted);
    const tenW = font.widthOfTextAtSize("10", 7);
    drawText("10", tlX + barW - tenW, barY - 12, 7, font, C.muted);
    cy = barY - 26;
  } else {
    drawText("No score recorded", tlX, cy - 12, 10, font, C.muted);
    cy -= 30;
  }

  // Divider
  page.drawLine({
    start: { x: tlX, y: cy },
    end: { x: tlX + innerW, y: cy },
    thickness: 0.5,
    color: C.light,
  });
  cy -= 14;

  // Vision goal
  if (data.visionPreference) {
    drawText("VISION GOAL", tlX, cy, 7, bold, C.muted);
    cy = drawWrapped(
      data.visionPreference,
      tlX,
      cy - 12,
      9,
      font,
      C.body,
      innerW,
      2
    );
    cy -= 6;
  }
  // Glasses preference
  if (data.glassesPreference) {
    drawText("GLASSES", tlX, cy, 7, bold, C.muted);
    cy = drawWrapped(
      data.glassesPreference,
      tlX,
      cy - 12,
      9,
      font,
      C.body,
      innerW,
      2
    );
    cy -= 6;
  }
  // Activities
  if (data.activities) {
    drawText("ACTIVITIES AFFECTED", tlX, cy, 7, bold, C.muted);
    drawWrapped(data.activities, tlX, cy - 12, 9, font, C.body, innerW, 3);
  }

  // ════════════════════════════════════════
  //  TOP-RIGHT: THE PROCEDURE
  // ════════════════════════════════════════
  cy = drawCard(TR.x, TR.y, "The Procedure", C.teal);
  const trX = TR.x + PAD;

  const steps = [
    ["Numbing drops", "No needles, no pain"],
    ["Tiny opening", "2-3mm incision"],
    ["Lens removed", "Gentle ultrasound"],
    ["New lens placed", "Custom to your eyes"],
  ];

  const stepStartY = cy - 4;
  const stepGap = 46;
  const circleR = 10;
  const lineX = trX + circleR;

  // Vertical connector line
  page.drawLine({
    start: { x: lineX, y: stepStartY - circleR },
    end: { x: lineX, y: stepStartY - (steps.length - 1) * stepGap - circleR },
    thickness: 2,
    color: C.tealLight,
  });

  for (let i = 0; i < steps.length; i++) {
    const sy = stepStartY - i * stepGap;
    // Circle
    page.drawCircle({ x: lineX, y: sy, size: circleR, color: C.teal });
    // Number
    const nStr = `${i + 1}`;
    const nW = bold.widthOfTextAtSize(nStr, 10);
    drawText(nStr, lineX - nW / 2, sy - 4, 10, bold, C.white);
    // Text
    drawText(steps[i][0], trX + circleR * 2 + 8, sy + 2, 10, bold, C.body);
    drawText(
      steps[i][1],
      trX + circleR * 2 + 8,
      sy - 10,
      8,
      font,
      C.muted
    );
  }

  // "15-20 min" callout
  const calloutY = stepStartY - (steps.length - 1) * stepGap - 40;
  page.drawRectangle({
    x: trX,
    y: calloutY,
    width: innerW,
    height: 24,
    color: C.tealLight,
  });
  // Teal left accent on callout
  page.drawRectangle({
    x: trX,
    y: calloutY,
    width: 3,
    height: 24,
    color: C.teal,
  });
  drawText(
    "Most procedures take 15-20 minutes",
    trX + 10,
    calloutY + 8,
    9,
    bold,
    C.teal
  );

  // Recovery mini-timeline
  const tlY = calloutY - 30;
  drawText("RECOVERY", trX, tlY + 4, 7, bold, C.muted);
  const dotY = tlY - 14;
  const dots = [
    { label: "Day 1", desc: "Rest" },
    { label: "Week 1", desc: "Clearer" },
    { label: "Month 1", desc: "Healed" },
  ];
  const dotSpacing = innerW / (dots.length - 1);

  // Connector line
  page.drawLine({
    start: { x: trX, y: dotY },
    end: { x: trX + innerW, y: dotY },
    thickness: 2,
    color: C.light,
  });

  for (let i = 0; i < dots.length; i++) {
    const dx = trX + i * dotSpacing;
    page.drawCircle({ x: dx, y: dotY, size: 5, color: C.teal });
    page.drawCircle({ x: dx, y: dotY, size: 3, color: C.white });
    const lW = bold.widthOfTextAtSize(dots[i].label, 7);
    drawText(dots[i].label, dx - lW / 2, dotY - 14, 7, bold, C.body);
    const dW = font.widthOfTextAtSize(dots[i].desc, 7);
    drawText(dots[i].desc, dx - dW / 2, dotY - 23, 7, font, C.muted);
  }

  // ════════════════════════════════════════
  //  BOTTOM-LEFT: YOUR PLAN
  // ════════════════════════════════════════
  cy = drawCard(BL.x, BL.y, "Your Plan", C.navyLight);
  const blX = BL.x + PAD;

  // Premium lens
  const drawOption = (
    label: string,
    value: string | null,
    y: number,
    dotColor: typeof C.teal
  ): number => {
    page.drawCircle({ x: blX + 5, y: y + 1, size: 5, color: dotColor });
    drawText(label, blX + 16, y + 4, 8, bold, C.muted);
    if (value) {
      return drawWrapped(value, blX + 16, y - 8, 9, font, C.body, innerW - 16, 2) - 8;
    }
    drawText("Not discussed", blX + 16, y - 8, 9, font, C.light);
    return y - 24;
  };

  drawText("PROCEDURE OPTIONS", blX, cy, 7, bold, C.muted);
  cy -= 16;
  cy = drawOption("Premium Lens", data.premiumLensInterest, cy, C.teal);
  cy = drawOption("Laser-Assisted", data.laserInterest, cy, C.teal);

  // Divider
  page.drawLine({
    start: { x: blX, y: cy },
    end: { x: blX + innerW, y: cy },
    thickness: 0.5,
    color: C.light,
  });
  cy -= 14;

  // Concerns
  if (data.concerns) {
    drawText("YOUR CONCERNS", blX, cy, 7, bold, C.muted);
    cy = drawWrapped(
      data.concerns,
      blX,
      cy - 12,
      9,
      font,
      C.body,
      innerW,
      4
    );
    cy -= 8;
    // Reassurance note
    page.drawRectangle({
      x: blX,
      y: cy - 2,
      width: innerW,
      height: 18,
      color: C.successLight,
    });
    page.drawRectangle({
      x: blX,
      y: cy - 2,
      width: 3,
      height: 18,
      color: C.success,
    });
    drawText(
      "Your team will address these before surgery",
      blX + 8,
      cy + 3,
      8,
      font,
      C.success
    );
  } else if (data.medicalConditions) {
    drawText("MEDICAL INFO", blX, cy, 7, bold, C.muted);
    drawWrapped(
      data.medicalConditions,
      blX,
      cy - 12,
      9,
      font,
      C.body,
      innerW,
      4
    );
  }

  // ════════════════════════════════════════
  //  BOTTOM-RIGHT: NEXT STEPS
  // ════════════════════════════════════════
  cy = drawCard(BR.x, BR.y, "Next Steps", C.teal);
  const brX = BR.x + PAD;

  const nextSteps = [
    "Schedule pre-op appointment",
    "List all current medications",
    "Arrange a ride home",
    "Follow eye drop instructions",
    "No food/drink after midnight (if told)",
    "Wear comfortable clothes",
  ];

  const checkSize = 10;
  const checkGap = 28;

  for (let i = 0; i < nextSteps.length; i++) {
    const sy = cy - i * checkGap;
    // Checkbox
    page.drawRectangle({
      x: brX,
      y: sy - checkSize + 4,
      width: checkSize,
      height: checkSize,
      borderColor: C.teal,
      borderWidth: 1.5,
      color: C.white,
    });
    // Checkmark line (decorative small tick)
    page.drawLine({
      start: { x: brX + 2, y: sy - 1 },
      end: { x: brX + 4, y: sy - 3 },
      thickness: 1.2,
      color: C.teal,
    });
    page.drawLine({
      start: { x: brX + 4, y: sy - 3 },
      end: { x: brX + 8, y: sy + 2 },
      thickness: 1.2,
      color: C.teal,
    });
    // Text
    drawText(nextSteps[i], brX + checkSize + 8, sy - 4, 9, font, C.body);
  }

  // Driver info callout at bottom of card
  if (data.driverInfo) {
    const diY = cy - nextSteps.length * checkGap - 4;
    page.drawRectangle({
      x: brX,
      y: diY - 2,
      width: innerW,
      height: 20,
      color: C.warningLight,
    });
    page.drawRectangle({
      x: brX,
      y: diY - 2,
      width: 3,
      height: 20,
      color: C.warning,
    });
    drawWrapped(
      `Ride: ${data.driverInfo}`,
      brX + 8,
      diY + 6,
      8,
      font,
      C.body,
      innerW - 16,
      1
    );
  }

  // ════════════════════════════════════════
  //  FOOTER
  // ════════════════════════════════════════
  drawText(
    "For informational purposes only. Does not replace medical advice from your surgical team.",
    MARGIN,
    16,
    7,
    font,
    C.muted
  );

  return pdfDoc.save();
}
