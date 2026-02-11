import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Preview,
} from "@react-email/components";

interface PatientVideoReadyEmailProps {
  patientName: string;
  videoUrl: string;
}

export default function PatientVideoReadyEmail({
  patientName,
  videoUrl,
}: PatientVideoReadyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Your personalized surgery video is ready, {patientName}!
      </Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Text style={headerTitleStyle}>Your Video Is Ready</Text>
          </Section>

          <Section style={contentStyle}>
            <Text style={greetingStyle}>Hi {patientName},</Text>

            <Text style={paragraphStyle}>
              The personalized video we mentioned in our earlier email is now
              ready. This short animation was created specifically for you to
              help explain your upcoming cataract surgery procedure.
            </Text>

            <Section style={buttonContainerStyle}>
              <Link href={videoUrl} style={buttonStyle}>
                Watch Your Video
              </Link>
            </Section>

            <Text style={mutedStyle}>
              If you have any questions about what you see in the video,
              please bring them up at your pre-operative consultation.
            </Text>

            <Text style={signoffStyle}>
              Warm regards,
              {"\n"}Your Surgical Team
            </Text>
          </Section>

          <Section style={footerContainerStyle}>
            <Text style={footerStyle}>
              This video is for educational purposes only and does not replace
              medical advice from your surgical team.
            </Text>
          </Section>
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
  padding: "32px",
  textAlign: "center" as const,
};

const headerTitleStyle = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "bold" as const,
  margin: "0",
};

const contentStyle = {
  padding: "32px",
};

const greetingStyle = {
  fontSize: "18px",
  fontWeight: "600" as const,
  color: "#111827",
  margin: "0 0 16px 0",
};

const paragraphStyle = {
  fontSize: "15px",
  color: "#374151",
  lineHeight: "1.6",
  margin: "0 0 16px 0",
};

const mutedStyle = {
  fontSize: "13px",
  color: "#6b7280",
  lineHeight: "1.5",
  margin: "16px 0 0 0",
};

const buttonContainerStyle = {
  textAlign: "center" as const,
  padding: "16px 0",
};

const buttonStyle = {
  backgroundColor: "#1e3a5f",
  color: "#ffffff",
  padding: "14px 36px",
  borderRadius: "6px",
  fontSize: "16px",
  fontWeight: "600" as const,
  textDecoration: "none",
  display: "inline-block" as const,
};

const signoffStyle = {
  fontSize: "15px",
  color: "#374151",
  lineHeight: "1.6",
  margin: "24px 0 0 0",
  whiteSpace: "pre-line" as const,
};

const footerContainerStyle = {
  backgroundColor: "#f9fafb",
  padding: "16px 32px",
};

const footerStyle = {
  fontSize: "11px",
  color: "#9ca3af",
  textAlign: "center" as const,
  margin: "0",
};
