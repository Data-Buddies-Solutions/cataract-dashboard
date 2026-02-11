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
  Heading,
} from "@react-email/components";
import { Tailwind, pixelBasedPreset } from "@react-email/tailwind";

interface PatientEmailProps {
  patientName: string;
  callDate: string;
  visionScale: number | null;
  glassesPreference: string | null;
  premiumLensInterest: string | null;
  laserInterest: string | null;
  activities: string | null;
  concerns: string | null;
  visionPreference: string | null;
}

function severityInfo(scale: number) {
  if (scale <= 3)
    return { label: "Mild", color: "#16a34a", bg: "#f0fdf4" };
  if (scale <= 6)
    return { label: "Moderate", color: "#ca8a04", bg: "#fefce8" };
  return { label: "Significant", color: "#dc2626", bg: "#fef2f2" };
}

export default function PatientEmail({
  patientName,
  callDate,
  visionScale,
  glassesPreference,
  premiumLensInterest,
  laserInterest,
  activities,
  concerns,
  visionPreference,
}: PatientEmailProps) {
  const severity = visionScale != null ? severityInfo(visionScale) : null;
  const hasPersonalizedData =
    visionScale != null ||
    visionPreference ||
    glassesPreference ||
    premiumLensInterest ||
    laserInterest ||
    concerns;
  const firstName = patientName.split(" ")[0];

  return (
    <Html lang="en">
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
          theme: {
            extend: {
              colors: {
                navy: "#1a2e44",
                teal: "#0d7377",
                slate: "#475569",
                faint: "#f8fafc",
              },
            },
          },
        }}
      >
        <Head />
        <Preview>
          Your personalized cataract surgery guide is ready, {firstName}
        </Preview>
        <Body className="bg-[#f1f5f9] py-[40px] font-sans">
          <Container className="mx-auto max-w-[600px] bg-white">
            {/* ── Accent bar ── */}
            <Section
              className="h-[4px] w-full"
              style={{
                background: "linear-gradient(90deg, #1a2e44 0%, #0d7377 100%)",
              }}
            />

            {/* ── Header ── */}
            <Section className="px-[48px] pt-[48px] pb-[8px] text-center">
              <Text className="m-0 text-[11px] font-semibold uppercase tracking-[2px] text-teal">
                Cataract Surgery Center
              </Text>
              <Heading className="m-0 mt-[16px] text-[28px] font-normal leading-[36px] text-navy">
                Your Surgery Guide
              </Heading>
              <Text className="m-0 mt-[8px] text-[14px] text-slate">
                Personalized for {patientName} &middot; {callDate}
              </Text>
            </Section>

            {/* ── Greeting ── */}
            <Section className="px-[48px] pt-[32px]">
              <Text className="m-0 text-[16px] leading-[26px] text-[#334155]">
                Hi {firstName},
              </Text>
              <Text className="m-0 mt-[12px] text-[16px] leading-[26px] text-[#334155]">
                Thank you for your recent consultation. We&apos;ve prepared this
                summary along with a detailed PDF guide (attached) to help you
                feel confident and informed as you prepare for your procedure.
              </Text>
            </Section>

            {/* ── Personalized Data ── */}
            {hasPersonalizedData && (
              <Section className="px-[48px] pt-[36px]">
                <Text className="m-0 mb-[20px] text-[11px] font-semibold uppercase tracking-[2px] text-slate">
                  From Your Consultation
                </Text>

                {/* Vision Score */}
                {visionScale != null && severity && (
                  <Section className="mb-[16px] rounded-[8px] bg-faint px-[24px] py-[20px]">
                    <Row>
                      <Column className="w-[72px] align-top">
                        <Text
                          className="m-0 text-[32px] font-bold leading-[36px]"
                          style={{ color: severity.color }}
                        >
                          {visionScale}
                          <span className="text-[16px] font-normal text-[#94a3b8]">
                            /10
                          </span>
                        </Text>
                      </Column>
                      <Column className="align-top pl-[16px]">
                        <Text className="m-0 text-[13px] font-semibold text-navy">
                          Vision Impact Score
                        </Text>
                        <Text className="m-0 mt-[4px] text-[13px] leading-[19px] text-slate">
                          {severity.label} impact on your daily activities.
                          Your surgeon will use this to guide your treatment plan.
                        </Text>
                      </Column>
                    </Row>
                  </Section>
                )}

                {/* Vision Goals */}
                {(visionPreference || glassesPreference) && (
                  <Section className="mb-[16px]">
                    {visionPreference && (
                      <>
                        <Text className="m-0 text-[12px] font-semibold uppercase tracking-[1px] text-[#94a3b8]">
                          Your Vision Goals
                        </Text>
                        <Text className="m-0 mt-[6px] text-[15px] leading-[23px] text-[#334155]">
                          {visionPreference}
                        </Text>
                      </>
                    )}
                    {glassesPreference && (
                      <Text className="m-0 mt-[8px] text-[14px] leading-[22px] text-slate">
                        Glasses preference: {glassesPreference}
                      </Text>
                    )}
                  </Section>
                )}

                {/* Lens Options */}
                {(premiumLensInterest || laserInterest) && (
                  <Section className="mb-[16px]">
                    <Text className="m-0 mb-[10px] text-[12px] font-semibold uppercase tracking-[1px] text-[#94a3b8]">
                      Options Discussed
                    </Text>
                    <Row>
                      {premiumLensInterest && (
                        <Column className="w-[50%] pr-[8px] align-top">
                          <Section className="rounded-[6px] bg-faint px-[16px] py-[12px]">
                            <Text className="m-0 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#94a3b8]">
                              Premium Lens
                            </Text>
                            <Text className="m-0 mt-[4px] text-[14px] font-semibold text-navy">
                              {premiumLensInterest}
                            </Text>
                          </Section>
                        </Column>
                      )}
                      {laserInterest && (
                        <Column className="w-[50%] pl-[8px] align-top">
                          <Section className="rounded-[6px] bg-faint px-[16px] py-[12px]">
                            <Text className="m-0 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#94a3b8]">
                              Laser-Assisted
                            </Text>
                            <Text className="m-0 mt-[4px] text-[14px] font-semibold text-navy">
                              {laserInterest}
                            </Text>
                          </Section>
                        </Column>
                      )}
                    </Row>
                  </Section>
                )}

                {/* Concerns */}
                {concerns && (
                  <Section className="mb-[4px]">
                    <Text className="m-0 text-[12px] font-semibold uppercase tracking-[1px] text-[#94a3b8]">
                      Your Questions
                    </Text>
                    <Text className="m-0 mt-[6px] text-[15px] leading-[23px] text-[#334155]">
                      {concerns}
                    </Text>
                    <Text className="m-0 mt-[8px] text-[13px] italic text-teal">
                      Your team will address each of these at your next visit.
                    </Text>
                  </Section>
                )}
              </Section>
            )}

            <Hr className="mx-[48px] mt-[36px] border-solid border-[#e2e8f0]" />

            {/* ── PDF Callout ── */}
            <Section className="px-[48px] py-[32px]">
              <Section className="rounded-[8px] bg-faint px-[24px] py-[20px] text-center">
                <Text className="m-0 text-[15px] font-semibold text-navy">
                  Your Detailed Guide is Attached
                </Text>
                <Text className="m-0 mt-[6px] text-[13px] leading-[20px] text-slate">
                  We&apos;ve included a PDF with a complete overview of your
                  consultation, procedure details, and preparation checklist.
                </Text>
              </Section>
            </Section>

            <Hr className="mx-[48px] border-solid border-[#e2e8f0]" />

            {/* ── What to Expect ── */}
            <Section className="px-[48px] py-[36px]">
              <Heading className="m-0 mb-[24px] text-[20px] font-normal text-navy">
                What to Expect
              </Heading>

              <Row className="mb-[20px]">
                <Column className="w-[32px] align-top">
                  <Text
                    className="m-0 text-center text-[13px] font-bold leading-[28px] text-white"
                    style={{
                      backgroundColor: "#0d7377",
                      borderRadius: "50%",
                      width: "28px",
                      height: "28px",
                    }}
                  >
                    1
                  </Text>
                </Column>
                <Column className="pl-[14px] align-top">
                  <Text className="m-0 text-[15px] font-semibold text-navy">
                    Numbing drops
                  </Text>
                  <Text className="m-0 mt-[2px] text-[14px] leading-[21px] text-slate">
                    Placed in your eye for comfort. No needles.
                  </Text>
                </Column>
              </Row>

              <Row className="mb-[20px]">
                <Column className="w-[32px] align-top">
                  <Text
                    className="m-0 text-center text-[13px] font-bold leading-[28px] text-white"
                    style={{
                      backgroundColor: "#0d7377",
                      borderRadius: "50%",
                      width: "28px",
                      height: "28px",
                    }}
                  >
                    2
                  </Text>
                </Column>
                <Column className="pl-[14px] align-top">
                  <Text className="m-0 text-[15px] font-semibold text-navy">
                    A tiny incision
                  </Text>
                  <Text className="m-0 mt-[2px] text-[14px] leading-[21px] text-slate">
                    About 2-3mm, to access the clouded lens.
                  </Text>
                </Column>
              </Row>

              <Row className="mb-[20px]">
                <Column className="w-[32px] align-top">
                  <Text
                    className="m-0 text-center text-[13px] font-bold leading-[28px] text-white"
                    style={{
                      backgroundColor: "#0d7377",
                      borderRadius: "50%",
                      width: "28px",
                      height: "28px",
                    }}
                  >
                    3
                  </Text>
                </Column>
                <Column className="pl-[14px] align-top">
                  <Text className="m-0 text-[15px] font-semibold text-navy">
                    Lens removed
                  </Text>
                  <Text className="m-0 mt-[2px] text-[14px] leading-[21px] text-slate">
                    Gently broken up and removed with ultrasound.
                  </Text>
                </Column>
              </Row>

              <Row>
                <Column className="w-[32px] align-top">
                  <Text
                    className="m-0 text-center text-[13px] font-bold leading-[28px] text-white"
                    style={{
                      backgroundColor: "#0d7377",
                      borderRadius: "50%",
                      width: "28px",
                      height: "28px",
                    }}
                  >
                    4
                  </Text>
                </Column>
                <Column className="pl-[14px] align-top">
                  <Text className="m-0 text-[15px] font-semibold text-navy">
                    New lens placed
                  </Text>
                  <Text className="m-0 mt-[2px] text-[14px] leading-[21px] text-slate">
                    A clear artificial lens, customized for your vision.
                  </Text>
                </Column>
              </Row>

              <Text className="m-0 mt-[24px] text-[14px] text-slate">
                The entire procedure typically takes 15-20 minutes. Over 98%
                of cataract surgeries are successful.
              </Text>
            </Section>

            <Hr className="mx-[48px] border-solid border-[#e2e8f0]" />

            {/* ── Recovery ── */}
            <Section className="px-[48px] py-[36px]">
              <Heading className="m-0 mb-[24px] text-[20px] font-normal text-navy">
                Recovery
              </Heading>

              <Row className="mb-[16px]">
                <Column className="w-[80px] align-top">
                  <Text className="m-0 rounded-[4px] bg-[#eff6ff] px-[12px] py-[6px] text-center text-[12px] font-bold text-[#1e40af]">
                    Day 1
                  </Text>
                </Column>
                <Column className="pl-[16px] align-top">
                  <Text className="m-0 text-[14px] leading-[22px] text-[#334155]">
                    Rest at home. Some blurry vision is normal. Begin
                    prescribed eye drops.
                  </Text>
                </Column>
              </Row>

              <Row className="mb-[16px]">
                <Column className="w-[80px] align-top">
                  <Text className="m-0 rounded-[4px] bg-[#fef9c3] px-[12px] py-[6px] text-center text-[12px] font-bold text-[#854d0e]">
                    Week 1
                  </Text>
                </Column>
                <Column className="pl-[16px] align-top">
                  <Text className="m-0 text-[14px] leading-[22px] text-[#334155]">
                    Most patients notice clearer vision. Avoid rubbing your
                    eye and heavy lifting.
                  </Text>
                </Column>
              </Row>

              <Row>
                <Column className="w-[80px] align-top">
                  <Text className="m-0 rounded-[4px] bg-[#dcfce7] px-[12px] py-[6px] text-center text-[12px] font-bold text-[#166534]">
                    Month 1
                  </Text>
                </Column>
                <Column className="pl-[16px] align-top">
                  <Text className="m-0 text-[14px] leading-[22px] text-[#334155]">
                    Fully healed for most patients. Final glasses prescription
                    if needed.
                  </Text>
                </Column>
              </Row>
            </Section>

            <Hr className="mx-[48px] border-solid border-[#e2e8f0]" />

            {/* ── Next Steps ── */}
            <Section className="px-[48px] py-[36px]">
              <Heading className="m-0 mb-[20px] text-[20px] font-normal text-navy">
                Preparing for Surgery
              </Heading>

              <Text className="m-0 mb-[10px] text-[14px] leading-[24px] text-[#334155]">
                &#x2610;{"  "}Schedule your pre-operative appointment
              </Text>
              <Text className="m-0 mb-[10px] text-[14px] leading-[24px] text-[#334155]">
                &#x2610;{"  "}Prepare a list of all current medications
              </Text>
              <Text className="m-0 mb-[10px] text-[14px] leading-[24px] text-[#334155]">
                &#x2610;{"  "}Arrange a ride home for surgery day
              </Text>
              <Text className="m-0 text-[14px] leading-[24px] text-[#334155]">
                &#x2610;{"  "}Write down any remaining questions
              </Text>
            </Section>

            {/* ── Sign-off ── */}
            <Section className="px-[48px] pb-[40px]">
              <Text className="m-0 text-[15px] leading-[24px] text-[#334155]">
                If you have any questions at all, please don&apos;t hesitate
                to reach out. We&apos;re here to help.
              </Text>
              <Text className="m-0 mt-[20px] text-[15px] text-[#334155]">
                Warm regards,
              </Text>
              <Text className="m-0 mt-[2px] text-[15px] font-semibold text-navy">
                Your Surgical Team
              </Text>
            </Section>

            {/* ── Footer ── */}
            <Section className="bg-[#f8fafc] px-[48px] py-[24px]">
              <Text className="m-0 text-center text-[11px] leading-[17px] text-[#94a3b8]">
                This email was sent following your consultation on {callDate}.
                The information provided is educational and does not replace
                medical advice from your care team.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

PatientEmail.PreviewProps = {
  patientName: "Margaret Thompson",
  callDate: "February 10, 2026",
  visionScale: 7,
  glassesPreference: "Would prefer minimal dependence on glasses",
  premiumLensInterest: "Interested",
  laserInterest: "Considering",
  activities: "Difficulty reading, driving at night, and watching television",
  concerns: "Worried about the recovery time and whether both eyes can be done at once",
  visionPreference: "Would like to read and use the computer without glasses",
} satisfies PatientEmailProps;
