import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Row,
  Column,
  Text,
  Hr,
} from "@react-email/components";
import { Tailwind, pixelBasedPreset } from "@react-email/tailwind";

interface DoctorSummaryEmailProps {
  patientName: string;
  callDate: string;
  duration: string;
  callOutcome: string;
  visionScale: number | null;
  glassesPreference: string | null;
  premiumLensInterest: string | null;
  laserInterest: string | null;
  activities: string | null;
  medicalConditions: string | null;
  concerns: string | null;
  callSummary: string | null;
  evaluationResults: {
    criteriaId: string;
    result: string;
    rationale: string;
  }[];
}

function visionColor(scale: number) {
  if (scale <= 3) return { text: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" };
  if (scale <= 6) return { text: "#ca8a04", bg: "#fefce8", border: "#fef08a" };
  return { text: "#dc2626", bg: "#fef2f2", border: "#fecaca" };
}

function outcomeStyle(outcome: string) {
  if (outcome === "Success")
    return { text: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" };
  if (outcome === "Failed")
    return { text: "#dc2626", bg: "#fef2f2", border: "#fecaca" };
  return { text: "#64748b", bg: "#f8fafc", border: "#e2e8f0" };
}

function criteriaStyle(result: string) {
  if (result === "success")
    return { text: "#16a34a", bg: "#f0fdf4", border: "#16a34a" };
  if (result === "failure")
    return { text: "#dc2626", bg: "#fef2f2", border: "#dc2626" };
  return { text: "#ca8a04", bg: "#fefce8", border: "#ca8a04" };
}

export default function DoctorSummaryEmail({
  patientName,
  callDate,
  duration,
  callOutcome,
  visionScale,
  glassesPreference,
  premiumLensInterest,
  laserInterest,
  activities,
  medicalConditions,
  concerns,
  callSummary,
  evaluationResults,
}: DoctorSummaryEmailProps) {
  const outcome = outcomeStyle(callOutcome);
  const vc = visionScale != null ? visionColor(visionScale) : null;

  return (
    <Html lang="en">
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
          theme: {
            extend: {
              colors: {
                navy: "#1a2e44",
                slate: "#475569",
                faint: "#f8fafc",
              },
            },
          },
        }}
      >
        <Head />
        <Preview>
          {patientName} — Vision {visionScale != null ? `${visionScale}/10` : "N/A"} | {callOutcome}
        </Preview>
        <Body className="bg-[#f1f5f9] py-[40px] font-sans">
          <Container className="mx-auto max-w-[600px] bg-white">
            {/* ── Accent bar ── */}
            <Section className="h-[3px] w-full bg-navy" />

            {/* ── Header ── */}
            <Section className="px-[40px] pt-[32px] pb-[24px]">
              <Row>
                <Column className="align-top">
                  <Text className="m-0 text-[11px] font-semibold uppercase tracking-[2px] text-[#94a3b8]">
                    Post-Call Summary
                  </Text>
                  <Text className="m-0 mt-[8px] text-[22px] font-semibold leading-[28px] text-navy">
                    {patientName}
                  </Text>
                  <Text className="m-0 mt-[4px] text-[13px] text-slate">
                    {callDate} &middot; {duration}
                  </Text>
                </Column>
                <Column className="w-[100px] text-right align-top">
                  <Text
                    className="m-0 mt-[30px] inline-block rounded-[6px] px-[12px] py-[6px] text-[11px] font-bold uppercase tracking-[0.5px]"
                    style={{
                      backgroundColor: outcome.bg,
                      color: outcome.text,
                      border: `1px solid ${outcome.border}`,
                    }}
                  >
                    {callOutcome}
                  </Text>
                </Column>
              </Row>
            </Section>

            <Hr className="mx-[40px] border-solid border-[#e2e8f0]" />

            {/* ── Metrics ── */}
            <Section className="px-[40px] py-[24px]">
              <Row>
                <Column className="w-[50%] pr-[6px] align-top">
                  <Section
                    className="rounded-[8px] px-[20px] py-[16px]"
                    style={{
                      backgroundColor: vc?.bg || "#f8fafc",
                      border: `1px solid ${vc?.border || "#e2e8f0"}`,
                    }}
                  >
                    <Text className="m-0 text-[10px] font-semibold uppercase tracking-[1px] text-[#94a3b8]">
                      Vision Scale
                    </Text>
                    <Text
                      className="m-0 mt-[6px] text-[28px] font-bold leading-[32px]"
                      style={{ color: vc?.text || "#94a3b8" }}
                    >
                      {visionScale != null ? visionScale : "—"}
                      {visionScale != null && (
                        <span className="text-[14px] font-normal text-[#94a3b8]">
                          /10
                        </span>
                      )}
                    </Text>
                  </Section>
                </Column>
                <Column className="w-[50%] pl-[6px] align-top">
                  <Section className="rounded-[8px] bg-faint px-[20px] py-[16px]" style={{ border: "1px solid #e2e8f0" }}>
                    <Text className="m-0 text-[10px] font-semibold uppercase tracking-[1px] text-[#94a3b8]">
                      Glasses Preference
                    </Text>
                    <Text className="m-0 mt-[6px] text-[14px] font-semibold leading-[20px] text-navy">
                      {glassesPreference || "—"}
                    </Text>
                  </Section>
                </Column>
              </Row>

              <Row className="mt-[12px]">
                <Column className="w-[50%] pr-[6px] align-top">
                  <Section className="rounded-[8px] bg-faint px-[20px] py-[16px]" style={{ border: "1px solid #e2e8f0" }}>
                    <Text className="m-0 text-[10px] font-semibold uppercase tracking-[1px] text-[#94a3b8]">
                      Premium Lens
                    </Text>
                    <Text className="m-0 mt-[6px] text-[14px] font-semibold leading-[20px] text-navy">
                      {premiumLensInterest || "—"}
                    </Text>
                  </Section>
                </Column>
                <Column className="w-[50%] pl-[6px] align-top">
                  <Section className="rounded-[8px] bg-faint px-[20px] py-[16px]" style={{ border: "1px solid #e2e8f0" }}>
                    <Text className="m-0 text-[10px] font-semibold uppercase tracking-[1px] text-[#94a3b8]">
                      Laser-Assisted
                    </Text>
                    <Text className="m-0 mt-[6px] text-[14px] font-semibold leading-[20px] text-navy">
                      {laserInterest || "—"}
                    </Text>
                  </Section>
                </Column>
              </Row>
            </Section>

            {/* ── Patient Details ── */}
            {(activities || medicalConditions || concerns) && (
              <>
                <Hr className="mx-[40px] border-solid border-[#e2e8f0]" />
                <Section className="px-[40px] py-[24px]">
                  <Text className="m-0 mb-[16px] text-[11px] font-semibold uppercase tracking-[2px] text-[#94a3b8]">
                    Patient Details
                  </Text>

                  {(activities || medicalConditions) && (
                    <Row>
                      {activities && (
                        <Column className={`${medicalConditions ? "w-[50%] pr-[10px]" : "w-full"} align-top`}>
                          <Text className="m-0 text-[10px] font-semibold uppercase tracking-[1px] text-[#94a3b8]">
                            Activities Affected
                          </Text>
                          <Text className="m-0 mt-[4px] text-[13px] leading-[20px] text-[#334155]">
                            {activities}
                          </Text>
                        </Column>
                      )}
                      {medicalConditions && (
                        <Column className={`${activities ? "w-[50%] pl-[10px]" : "w-full"} align-top`}>
                          <Text className="m-0 text-[10px] font-semibold uppercase tracking-[1px] text-[#94a3b8]">
                            Medical Conditions
                          </Text>
                          <Text className="m-0 mt-[4px] text-[13px] leading-[20px] text-[#334155]">
                            {medicalConditions}
                          </Text>
                        </Column>
                      )}
                    </Row>
                  )}

                  {concerns && (
                    <Section className={activities || medicalConditions ? "mt-[16px]" : ""}>
                      <Text className="m-0 text-[10px] font-semibold uppercase tracking-[1px] text-[#94a3b8]">
                        Concerns
                      </Text>
                      <Text className="m-0 mt-[4px] text-[13px] leading-[20px] text-[#334155]">
                        {concerns}
                      </Text>
                    </Section>
                  )}
                </Section>
              </>
            )}

            {/* ── Call Summary ── */}
            {callSummary && (
              <>
                <Hr className="mx-[40px] border-solid border-[#e2e8f0]" />
                <Section className="px-[40px] py-[24px]">
                  <Text className="m-0 mb-[12px] text-[11px] font-semibold uppercase tracking-[2px] text-[#94a3b8]">
                    Call Summary
                  </Text>
                  <Text className="m-0 text-[14px] leading-[22px] text-[#334155]">
                    {callSummary}
                  </Text>
                </Section>
              </>
            )}

            {/* ── Evaluation Criteria ── */}
            {evaluationResults.length > 0 && (
              <>
                <Hr className="mx-[40px] border-solid border-[#e2e8f0]" />
                <Section className="px-[40px] py-[24px]">
                  <Text className="m-0 mb-[14px] text-[11px] font-semibold uppercase tracking-[2px] text-[#94a3b8]">
                    Evaluation
                  </Text>
                  {evaluationResults.map((item) => {
                    const cs = criteriaStyle(item.result);
                    return (
                      <Section
                        key={item.criteriaId}
                        className="mb-[8px] rounded-[6px] px-[16px] py-[12px]"
                        style={{
                          backgroundColor: cs.bg,
                          borderLeft: `3px solid ${cs.border}`,
                        }}
                      >
                        <Text className="m-0 text-[12px] font-semibold text-[#334155]">
                          <span style={{ color: cs.text }} className="font-bold uppercase">
                            {item.result}
                          </span>
                          {"  "}
                          {item.criteriaId.replace(/_/g, " ")}
                        </Text>
                        <Text className="m-0 mt-[4px] text-[11px] leading-[17px] text-slate">
                          {item.rationale}
                        </Text>
                      </Section>
                    );
                  })}
                </Section>
              </>
            )}

            {/* ── Footer ── */}
            <Section className="bg-[#f8fafc] px-[40px] py-[20px]">
              <Text className="m-0 text-center text-[11px] text-[#94a3b8]">
                Automated summary from Cataract Surgery Dashboard
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

DoctorSummaryEmail.PreviewProps = {
  patientName: "Margaret Thompson",
  callDate: "February 10, 2026",
  duration: "8m 32s",
  callOutcome: "Success",
  visionScale: 7,
  glassesPreference: "Would prefer minimal dependence on glasses",
  premiumLensInterest: "Interested",
  laserInterest: "Considering",
  activities: "Difficulty reading, driving at night, and watching television",
  medicalConditions: "Mild diabetes, controlled with medication",
  concerns: "Worried about the recovery time and whether both eyes can be done at once",
  callSummary:
    "Patient expressed strong interest in premium lens options. Vision is significantly impacting daily activities. Concerned about recovery timeline but otherwise eager to proceed.",
  evaluationResults: [
    { criteriaId: "patient_engagement", result: "success", rationale: "Patient was actively engaged and asked thoughtful questions throughout" },
    { criteriaId: "data_collection", result: "success", rationale: "All required data points were collected during the call" },
    { criteriaId: "concern_handling", result: "success", rationale: "Addressed recovery concerns with empathy and clear information" },
  ],
} satisfies DoctorSummaryEmailProps;
