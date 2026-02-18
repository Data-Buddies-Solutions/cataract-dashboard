// Pure scoring logic — no React dependencies, safe for server components

export type PropensityTier = "high" | "moderate" | "low" | "insufficient";

export interface PropensityFactor {
  name: string;
  weight: number;
  score: number | null;
}

export interface PropensityResult {
  overallScore: number;
  label: string;
  tier: PropensityTier;
  factors: PropensityFactor[];
}

export interface PropensityInputs {
  premiumIOLValue?: string | null;
  readinessValue?: string | null;
  laserInterestValue?: string | null;
  hobbiesValue?: string | null;
  grandchildrenValue?: string | null;
  occupationValue?: string | null;
  sentimentValue?: string | null;
  personalityValue?: string | null;
}

export interface RadarAxisData {
  axis: string;
  patientNeeds: number;
  iolStrengths: number;
}

// ── Premium IOL Interest Score (bucket mapping) ──
const PREMIUM_IOL_BUCKETS: Record<string, number> = {
  "highly interested": 95,
  "leaning interest": 75,
  "cost concerned": 60,
  "neutral": 50,
  "not interested": 15,
};

function scorePremiumIOL(value: string): number | null {
  const lower = value.toLowerCase().trim();
  if (lower === "unknown") return null;
  for (const [bucket, score] of Object.entries(PREMIUM_IOL_BUCKETS)) {
    if (lower.includes(bucket)) return score;
  }
  // Fallback regex for free-text
  if (/\b(yes|very interested|definitely|absolutely|high)\b/.test(lower)) return 95;
  if (/\b(interested|want|keen|leaning)\b/.test(lower)) return 75;
  if (/\b(cost|afford|budget|price)\b/.test(lower)) return 60;
  if (/\b(maybe|considering|open|possibly|curious|unsure)\b/.test(lower)) return 50;
  if (/\b(no|not interested|declined|standard|basic)\b/.test(lower)) return 15;
  return 50;
}

// ── Femtosecond Laser Interest Score (bucket mapping) ──
const LASER_INTEREST_BUCKETS: Record<string, number> = {
  "highly interested": 95,
  "passively receptive": 65,
  "cost hesitant": 55,
  "skeptical": 30,
  "not interested": 15,
};

function scoreLaserInterest(value: string): number | null {
  const lower = value.toLowerCase().trim();
  if (lower === "unknown") return null;
  for (const [bucket, score] of Object.entries(LASER_INTEREST_BUCKETS)) {
    if (lower.includes(bucket)) return score;
  }
  // Fallback regex
  if (/\b(yes|interested|want|keen)\b/.test(lower)) return 95;
  if (/\b(open|receptive|maybe)\b/.test(lower)) return 65;
  if (/\b(cost|afford|expensive)\b/.test(lower)) return 55;
  if (/\b(skeptic|doubt|unsure|hesitant)\b/.test(lower)) return 30;
  if (/\b(no|not interested|declined)\b/.test(lower)) return 15;
  return 50;
}

// ── Surgical Readiness Score (unchanged) ──
function scoreReadiness(value: string): number {
  const lower = value.toLowerCase();
  if (/\b(ready|scheduled|decided|yes|asap|immediately)\b/.test(lower)) return 90;
  if (/\b(leaning|likely|soon|considering surgery|almost)\b/.test(lower)) return 70;
  if (/\b(thinking|exploring|researching|maybe)\b/.test(lower)) return 50;
  if (/\b(not ready|undecided|unsure|hesitant|nervous)\b/.test(lower)) return 30;
  if (/\b(no|refusing|not interested|postpone)\b/.test(lower)) return 20;
  return 50;
}

// ── Lifestyle Match Score (hobbies + grandchildren + occupation) ──
const LIFESTYLE_KEYWORDS = [
  "golf", "tennis", "swim", "hik", "run", "cycl", "travel", "driv",
  "read", "comput", "screen", "garden", "cook", "paint", "photograph",
  "fish", "yoga", "gym", "exercise", "sport", "outdoor", "active",
  "craft", "sew", "knit", "bird", "hunt", "sail", "ski",
  "grandchild", "grandkid", "grandson", "granddaughter",
  "teacher", "nurse", "engineer", "doctor", "pilot", "driver",
  "mechanic", "artist", "musician", "writer", "accountant",
];

function scoreLifestyle(hobbies?: string | null, grandchildren?: string | null, occupation?: string | null): number {
  const combined = `${hobbies ?? ""} ${grandchildren ?? ""} ${occupation ?? ""}`.toLowerCase();
  if (!combined.trim()) return 0;
  const matchCount = LIFESTYLE_KEYWORDS.filter((kw) => combined.includes(kw)).length;
  if (matchCount >= 5) return 95;
  if (matchCount >= 3) return 80;
  if (matchCount >= 2) return 65;
  if (matchCount >= 1) return 45;
  return 25;
}

// ── Patient Engagement Score (sentiment + personality) ──
const POSITIVE_KEYWORDS = [
  "positive", "happy", "engaged", "cooperative", "friendly", "warm",
  "enthusiastic", "optimistic", "pleasant", "open", "curious", "motivated",
  "agreeable", "patient", "calm", "receptive",
];
const NEGATIVE_KEYWORDS = [
  "negative", "angry", "frustrated", "hostile", "impatient", "anxious",
  "resistant", "dismissive", "rude", "uncooperative", "aggressive",
  "pessimistic", "combative", "difficult", "guarded",
];

function scorePatientEngagement(sentiment?: string | null, personality?: string | null): number | null {
  const combined = `${sentiment ?? ""} ${personality ?? ""}`.toLowerCase();
  if (!combined.trim()) return null;
  const posCount = POSITIVE_KEYWORDS.filter((kw) => combined.includes(kw)).length;
  const negCount = NEGATIVE_KEYWORDS.filter((kw) => combined.includes(kw)).length;
  if (posCount === 0 && negCount === 0) return 50; // neutral
  const netScore = 50 + (posCount - negCount) * 15;
  return Math.max(10, Math.min(95, netScore));
}

// ── Main Scoring Function ──
export function computePropensityScore(inputs: PropensityInputs): PropensityResult {
  const scores: { value: number; weight: number }[] = [];

  const premiumIOLScore = inputs.premiumIOLValue ? scorePremiumIOL(inputs.premiumIOLValue) : null;
  const readinessScore = inputs.readinessValue ? scoreReadiness(inputs.readinessValue) : null;
  const laserScore = inputs.laserInterestValue ? scoreLaserInterest(inputs.laserInterestValue) : null;
  const lifestyleScore = scoreLifestyle(inputs.hobbiesValue, inputs.grandchildrenValue, inputs.occupationValue) || null;
  const engagementScore = scorePatientEngagement(inputs.sentimentValue, inputs.personalityValue);

  if (premiumIOLScore != null) scores.push({ value: premiumIOLScore, weight: 0.35 });
  if (readinessScore != null) scores.push({ value: readinessScore, weight: 0.2 });
  if (laserScore != null) scores.push({ value: laserScore, weight: 0.15 });
  if (lifestyleScore != null) scores.push({ value: lifestyleScore, weight: 0.2 });
  if (engagementScore != null) scores.push({ value: engagementScore, weight: 0.1 });

  const factors: PropensityFactor[] = [
    { name: "Premium IOL Interest", weight: 0.35, score: premiumIOLScore },
    { name: "Surgical Readiness", weight: 0.2, score: readinessScore },
    { name: "Femtosecond Laser", weight: 0.15, score: laserScore },
    { name: "Lifestyle Match", weight: 0.2, score: lifestyleScore },
    { name: "Patient Engagement", weight: 0.1, score: engagementScore },
  ];

  // Insufficient data
  if (scores.length < 2) {
    return { overallScore: 0, label: "Insufficient Data", tier: "insufficient", factors };
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

  return { overallScore, label, tier, factors };
}

// ── Radar Data — New 5 Axes ──

const ACTIVE_LIFESTYLE_KEYWORDS = ["golf", "tennis", "swim", "hik", "run", "cycl", "travel", "outdoor", "sport", "exercise", "gym", "active", "yoga", "garden"];
const NEAR_VISION_KEYWORDS = ["read", "book", "newspaper", "magazine", "kindle", "close.?up", "fine print", "craft", "sew", "knit", "needlework", "grandchild", "grandkid"];
const DIGITAL_WORK_KEYWORDS = ["comput", "screen", "laptop", "phone", "tablet", "monitor", "digital", "work", "office", "desk", "engineer", "accountant", "program"];
const SOCIAL_FAMILY_KEYWORDS = ["grandchild", "grandkid", "grandson", "granddaughter", "family", "friend", "social", "church", "volunteer", "community", "club"];

function keywordScore(text: string, keywords: string[]): number {
  if (!text.trim()) return 0;
  const lower = text.toLowerCase();
  const matchCount = keywords.filter((kw) => new RegExp(kw).test(lower)).length;
  if (matchCount >= 3) return 95;
  if (matchCount >= 2) return 75;
  if (matchCount >= 1) return 55;
  return 0;
}

function scoreIndependence(premiumIOL?: string | null, readiness?: string | null): number {
  let score = 0;
  let factors = 0;
  if (premiumIOL) {
    const s = scorePremiumIOL(premiumIOL);
    if (s != null) { score += s; factors++; }
  }
  if (readiness) {
    score += scoreReadiness(readiness);
    factors++;
  }
  return factors > 0 ? Math.round(score / factors) : 0;
}

export function computeRadarData(inputs: PropensityInputs): RadarAxisData[] {
  const combined = [
    inputs.hobbiesValue,
    inputs.grandchildrenValue,
    inputs.occupationValue,
    inputs.premiumIOLValue,
    inputs.readinessValue,
  ]
    .filter(Boolean)
    .join(" ");

  const defaultVal = 30;

  const activeLifestyle = keywordScore(combined, ACTIVE_LIFESTYLE_KEYWORDS) || defaultVal;
  const nearVision = keywordScore(combined, NEAR_VISION_KEYWORDS) || defaultVal;
  const digitalWork = keywordScore(combined, DIGITAL_WORK_KEYWORDS) || defaultVal;
  const socialFamily = keywordScore(combined, SOCIAL_FAMILY_KEYWORDS) || defaultVal;
  const independence = scoreIndependence(inputs.premiumIOLValue, inputs.readinessValue) || defaultVal;

  return [
    { axis: "Active Lifestyle", patientNeeds: activeLifestyle, iolStrengths: 75 },
    { axis: "Near Vision", patientNeeds: nearVision, iolStrengths: 85 },
    { axis: "Digital/Work", patientNeeds: digitalWork, iolStrengths: 80 },
    { axis: "Social/Family", patientNeeds: socialFamily, iolStrengths: 70 },
    { axis: "Independence", patientNeeds: independence, iolStrengths: 75 },
  ];
}
