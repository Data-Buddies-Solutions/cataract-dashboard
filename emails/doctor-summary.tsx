import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Text,
  Hr,
  Preview,
} from "@react-email/components";

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
  evaluationResults: { criteriaId: string; result: string; rationale: string }[];
}

function visionScaleColor(scale: number): string {
  if (scale <= 3) return "#16a34a";
  if (scale <= 6) return "#d97706";
  return "#dc2626";
}

function outcomeColor(outcome: string): string {
  if (outcome === "Success") return "#16a34a";
  if (outcome === "Failed") return "#dc2626";
  return "#6b7280";
}

function criteriaColor(result: string): string {
  if (result === "success") return "#16a34a";
  if (result === "failure") return "#dc2626";
  return "#d97706";
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
  return (
    <Html>
      <Head />
      <Preview>
        Call Summary: {patientName} — Vision Scale{" "}
        {visionScale != null ? `${visionScale}/10` : "N/A"} |{" "}
        {callOutcome}
      </Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={headerTitleStyle}>Pre-Surgery Call Summary</Text>
            <Text style={headerSubtitleStyle}>
              {patientName} &middot; {callDate} &middot; {duration}
            </Text>
            <Text style={{ ...badgeStyle, color: outcomeColor(callOutcome) }}>
              {callOutcome}
            </Text>
          </Section>

          {/* Key Metrics Grid */}
          <Section style={metricsContainerStyle}>
            <Row>
              <Column style={metricBoxStyle}>
                <Text style={metricLabelStyle}>Vision Scale</Text>
                <Text
                  style={{
                    ...metricValueStyle,
                    color:
                      visionScale != null
                        ? visionScaleColor(visionScale)
                        : "#6b7280",
                  }}
                >
                  {visionScale != null ? `${visionScale}/10` : "—"}
                </Text>
              </Column>
              <Column style={metricBoxStyle}>
                <Text style={metricLabelStyle}>Glasses Preference</Text>
                <Text style={metricValueSmallStyle}>
                  {glassesPreference || "—"}
                </Text>
              </Column>
            </Row>
            <Row>
              <Column style={metricBoxStyle}>
                <Text style={metricLabelStyle}>Premium Lens Interest</Text>
                <Text style={metricValueSmallStyle}>
                  {premiumLensInterest || "—"}
                </Text>
              </Column>
              <Column style={metricBoxStyle}>
                <Text style={metricLabelStyle}>Femtosecond Laser</Text>
                <Text style={metricValueSmallStyle}>
                  {laserInterest || "—"}
                </Text>
              </Column>
            </Row>
          </Section>

          <Hr style={dividerStyle} />

          {/* Patient Snapshot */}
          <Section style={sectionStyle}>
            <Text style={sectionHeadingStyle}>Patient Snapshot</Text>

            {activities && (
              <>
                <Text style={fieldLabelStyle}>Activities Affected</Text>
                <Text style={fieldValueStyle}>{activities}</Text>
              </>
            )}

            {medicalConditions && (
              <>
                <Text style={fieldLabelStyle}>Medical Conditions</Text>
                <Text style={fieldValueStyle}>{medicalConditions}</Text>
              </>
            )}

            {concerns && (
              <>
                <Text style={fieldLabelStyle}>Patient Concerns</Text>
                <Text style={fieldValueStyle}>{concerns}</Text>
              </>
            )}
          </Section>

          {/* Call Summary */}
          {callSummary && (
            <>
              <Hr style={dividerStyle} />
              <Section style={sectionStyle}>
                <Text style={sectionHeadingStyle}>Call Summary</Text>
                <Text style={fieldValueStyle}>{callSummary}</Text>
              </Section>
            </>
          )}

          {/* Evaluation Results */}
          {evaluationResults.length > 0 && (
            <>
              <Hr style={dividerStyle} />
              <Section style={sectionStyle}>
                <Text style={sectionHeadingStyle}>Evaluation Criteria</Text>
                {evaluationResults.map((item) => (
                  <Section key={item.criteriaId} style={criteriaItemStyle}>
                    <Text style={criteriaHeaderStyle}>
                      <span
                        style={{ color: criteriaColor(item.result) }}
                      >
                        [{item.result.toUpperCase()}]
                      </span>{" "}
                      {item.criteriaId.replace(/_/g, " ")}
                    </Text>
                    <Text style={criteriaRationaleStyle}>
                      {item.rationale}
                    </Text>
                  </Section>
                ))}
              </Section>
            </>
          )}

          {/* Footer */}
          <Hr style={dividerStyle} />
          <Text style={footerStyle}>
            This is an automated post-call summary from the Cataract Surgery
            Dashboard.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const containerStyle = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  maxWidth: "600px",
  borderRadius: "8px",
  overflow: "hidden" as const,
};

const headerStyle = {
  backgroundColor: "#1e3a5f",
  padding: "24px 32px",
};

const headerTitleStyle = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: "bold" as const,
  margin: "0 0 4px 0",
};

const headerSubtitleStyle = {
  color: "#c7d2e0",
  fontSize: "13px",
  margin: "0 0 8px 0",
};

const badgeStyle = {
  fontSize: "12px",
  fontWeight: "bold" as const,
  textTransform: "uppercase" as const,
  margin: "0",
};

const metricsContainerStyle = {
  padding: "16px 24px",
};

const metricBoxStyle = {
  padding: "8px",
  textAlign: "center" as const,
};

const metricLabelStyle = {
  fontSize: "10px",
  fontWeight: "bold" as const,
  textTransform: "uppercase" as const,
  color: "#6b7280",
  margin: "0 0 4px 0",
  letterSpacing: "0.5px",
};

const metricValueStyle = {
  fontSize: "28px",
  fontWeight: "bold" as const,
  margin: "0",
};

const metricValueSmallStyle = {
  fontSize: "14px",
  fontWeight: "600" as const,
  color: "#111827",
  margin: "0",
};

const dividerStyle = {
  borderColor: "#e5e7eb",
  margin: "0 24px",
};

const sectionStyle = {
  padding: "16px 32px",
};

const sectionHeadingStyle = {
  fontSize: "12px",
  fontWeight: "bold" as const,
  textTransform: "uppercase" as const,
  color: "#1e3a5f",
  letterSpacing: "0.5px",
  margin: "0 0 12px 0",
};

const fieldLabelStyle = {
  fontSize: "11px",
  fontWeight: "bold" as const,
  color: "#6b7280",
  margin: "8px 0 2px 0",
  textTransform: "uppercase" as const,
};

const fieldValueStyle = {
  fontSize: "14px",
  color: "#374151",
  margin: "0 0 8px 0",
  lineHeight: "1.5",
};

const criteriaItemStyle = {
  marginBottom: "12px",
  padding: "8px 12px",
  backgroundColor: "#f9fafb",
  borderRadius: "6px",
};

const criteriaHeaderStyle = {
  fontSize: "13px",
  fontWeight: "600" as const,
  color: "#111827",
  margin: "0 0 4px 0",
};

const criteriaRationaleStyle = {
  fontSize: "12px",
  color: "#6b7280",
  margin: "0",
  lineHeight: "1.4",
};

const footerStyle = {
  fontSize: "11px",
  color: "#9ca3af",
  textAlign: "center" as const,
  padding: "16px 32px",
};
