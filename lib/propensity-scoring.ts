// Pure scoring logic — no React dependencies, safe for server components

export type PropensityTier = "high" | "moderate" | "low" | "insufficient";

export interface PropensityResult {
  overallScore: number;
  label: string;
  tier: PropensityTier;
}

export interface PropensityInputs {
  premiumLensValue?: string | null;
  readinessValue?: string | null;
  visionScale?: number | null;
  glassesValue?: string | null;
  activitiesValue?: string | null;
  hobbiesValue?: string | null;
}

export interface RadarAxisData {
  axis: string;
  patientNeeds: number;
  iolStrengths: number;
}

// ── Premium Lens Interest Score ──
function scorePremiumLens(value: string): number {
  const lower = value.toLowerCase();
  if (/\b(yes|very interested|definitely|absolutely|high)\b/.test(lower)) return 95;
  if (/\b(interested|want|keen|prefer premium|leaning)\b/.test(lower)) return 80;
  if (/\b(maybe|considering|open|possibly|curious|unsure)\b/.test(lower)) return 55;
  if (/\b(not sure|undecided|need more)\b/.test(lower)) return 40;
  if (/\b(no|not interested|declined|standard|basic)\b/.test(lower)) return 15;
  return 50; // neutral default
}

// ── Surgical Readiness Score ──
function scoreReadiness(value: string): number {
  const lower = value.toLowerCase();
  if (/\b(ready|scheduled|decided|yes|asap|immediately)\b/.test(lower)) return 90;
  if (/\b(leaning|likely|soon|considering surgery|almost)\b/.test(lower)) return 70;
  if (/\b(thinking|exploring|researching|maybe)\b/.test(lower)) return 50;
  if (/\b(not ready|undecided|unsure|hesitant|nervous)\b/.test(lower)) return 30;
  if (/\b(no|refusing|not interested|postpone)\b/.test(lower)) return 20;
  return 50;
}

// ── Glasses Independence Score ──
function scoreGlasses(value: string): number {
  const lower = value.toLowerCase();
  if (/\b(no glasses|without glasses|glasses.?free|independence|hate glasses)\b/.test(lower)) return 90;
  if (/\b(reduce|minimal|less dependent|prefer not)\b/.test(lower)) return 75;
  if (/\b(don't mind|okay with|fine with|accept)\b/.test(lower)) return 40;
  if (/\b(reading glasses ok|some glasses|reading only)\b/.test(lower)) return 30;
  return 50;
}

// ── Lifestyle Activity Score ──
const ACTIVE_KEYWORDS = [
  "golf", "tennis", "swim", "hik", "run", "cycl", "travel", "driv",
  "read", "comput", "screen", "garden", "cook", "paint", "photograph",
  "fish", "yoga", "gym", "exercise", "sport", "outdoor", "active",
  "craft", "sew", "knit", "bird", "hunt", "sail", "ski",
];

function scoreLifestyle(activities?: string | null, hobbies?: string | null): number {
  const combined = `${activities ?? ""} ${hobbies ?? ""}`.toLowerCase();
  if (!combined.trim()) return 0; // no data
  const matchCount = ACTIVE_KEYWORDS.filter((kw) => combined.includes(kw)).length;
  if (matchCount >= 5) return 95;
  if (matchCount >= 3) return 80;
  if (matchCount >= 2) return 65;
  if (matchCount >= 1) return 45;
  return 25;
}

// ── Main Scoring Function ──
export function computePropensityScore(inputs: PropensityInputs): PropensityResult {
  const scores: { value: number; weight: number }[] = [];

  if (inputs.premiumLensValue) {
    scores.push({ value: scorePremiumLens(inputs.premiumLensValue), weight: 0.3 });
  }
  if (inputs.readinessValue) {
    scores.push({ value: scoreReadiness(inputs.readinessValue), weight: 0.2 });
  }
  if (inputs.visionScale != null) {
    scores.push({ value: Math.min(inputs.visionScale * 10, 100), weight: 0.2 });
  }
  if (inputs.glassesValue) {
    scores.push({ value: scoreGlasses(inputs.glassesValue), weight: 0.15 });
  }
  const lifestyleScore = scoreLifestyle(inputs.activitiesValue, inputs.hobbiesValue);
  if (lifestyleScore > 0) {
    scores.push({ value: lifestyleScore, weight: 0.15 });
  }

  // Insufficient data
  if (scores.length < 2) {
    return { overallScore: 0, label: "Insufficient Data", tier: "insufficient" };
  }

  // Renormalize weights
  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
  const overallScore = Math.round(
    scores.reduce((sum, s) => sum + s.value * (s.weight / totalWeight), 0)
  );

  let tier: PropensityTier;
  let label: string;
  if (overallScore >= 75) {
    tier = "high";
    label = "High Likelihood: Premium Candidate";
  } else if (overallScore >= 45) {
    tier = "moderate";
    label = "Moderate Interest: Follow Up Recommended";
  } else {
    tier = "low";
    label = "Low Propensity: Standard IOL Likely";
  }

  return { overallScore, label, tier };
}

// ── Radar Data ──

const READING_KEYWORDS = ["read", "book", "newspaper", "magazine", "kindle", "close.?up", "fine print"];
const NIGHT_KEYWORDS = ["driv", "night", "headlight", "glare", "dark", "evening", "halos"];
const COMPUTER_KEYWORDS = ["comput", "screen", "laptop", "phone", "tablet", "monitor", "digital", "work"];
const COST_KEYWORDS = ["cost", "price", "afford", "budget", "invest", "worth", "pay", "premium", "money", "insurance"];
const ACTIVE_LIFESTYLE_KEYWORDS = ["golf", "tennis", "swim", "hik", "run", "cycl", "travel", "outdoor", "sport", "exercise", "gym", "active", "yoga", "garden"];

function keywordScore(text: string, keywords: string[]): number {
  if (!text.trim()) return 0;
  const lower = text.toLowerCase();
  const matchCount = keywords.filter((kw) => new RegExp(kw).test(lower)).length;
  if (matchCount >= 3) return 95;
  if (matchCount >= 2) return 75;
  if (matchCount >= 1) return 55;
  return 0;
}

export function computeRadarData(inputs: PropensityInputs): RadarAxisData[] {
  const combined = [
    inputs.activitiesValue,
    inputs.hobbiesValue,
    inputs.glassesValue,
    inputs.premiumLensValue,
    inputs.readinessValue,
  ]
    .filter(Boolean)
    .join(" ");

  const defaultVal = 30; // fallback when no relevant data

  const reading = keywordScore(combined, READING_KEYWORDS) || defaultVal;
  const nightDriving = keywordScore(combined, NIGHT_KEYWORDS) || defaultVal;
  const computer = keywordScore(combined, COMPUTER_KEYWORDS) || defaultVal;
  const costFlex = keywordScore(combined, COST_KEYWORDS) || defaultVal;
  const activeLifestyle = keywordScore(combined, ACTIVE_LIFESTYLE_KEYWORDS) || defaultVal;

  return [
    { axis: "Reading", patientNeeds: reading, iolStrengths: 85 },
    { axis: "Night Vision", patientNeeds: nightDriving, iolStrengths: 60 },
    { axis: "Computer", patientNeeds: computer, iolStrengths: 80 },
    { axis: "Cost Flex", patientNeeds: costFlex, iolStrengths: 70 },
    { axis: "Lifestyle", patientNeeds: activeLifestyle, iolStrengths: 75 },
  ];
}
