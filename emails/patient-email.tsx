import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Link,
  Preview,
} from "@react-email/components";

interface PatientEmailProps {
  patientName: string;
  callDate: string;
  videoUrl: string | null;
  videoReady: boolean;
}

export default function PatientEmail({
  patientName,
  callDate,
  videoUrl,
  videoReady,
}: PatientEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Your personalized cataract surgery guide is ready, {patientName}
      </Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={headerTitleStyle}>
              Your Cataract Surgery Guide
            </Text>
          </Section>

          {/* Body */}
          <Section style={contentStyle}>
            <Text style={greetingStyle}>Hi {patientName},</Text>

            <Text style={paragraphStyle}>
              Thank you for your recent conversation about your upcoming
              cataract surgery. We&apos;ve put together a personalized guide
              based on what we discussed during your call on {callDate}.
            </Text>

            <Text style={paragraphStyle}>
              <strong>Attached to this email</strong> you&apos;ll find a PDF
              that includes:
            </Text>

            <Text style={listStyle}>
              &bull; Your vision goals and preferences{"\n"}
              &bull; The procedure options we discussed{"\n"}
              &bull; Answers to your questions and concerns{"\n"}
              &bull; Next steps to prepare for your surgery
            </Text>

            {/* Video Section */}
            {videoReady && videoUrl ? (
              <>
                <Hr style={dividerStyle} />
                <Text style={paragraphStyle}>
                  We also created a short personalized video to help explain
                  your procedure:
                </Text>
                <Section style={videoButtonContainerStyle}>
                  <Link href={videoUrl} style={videoButtonStyle}>
                    Watch Your Personalized Video
                  </Link>
                </Section>
              </>
            ) : (
              <>
                <Hr style={dividerStyle} />
                <Text style={mutedParagraphStyle}>
                  We&apos;re also preparing a short personalized video to help
                  explain your procedure. We&apos;ll send it to you in a
                  separate email once it&apos;s ready.
                </Text>
              </>
            )}

            <Hr style={dividerStyle} />

            <Text style={paragraphStyle}>
              If you have any additional questions, please don&apos;t hesitate
              to reach out to our office. We&apos;re here to help make your
              experience as comfortable as possible.
            </Text>

            <Text style={signoffStyle}>
              Warm regards,
              {"\n"}Your Surgical Team
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footerContainerStyle}>
            <Text style={footerStyle}>
              This email was sent based on your pre-surgery consultation call.
              The attached guide is for informational purposes and does not
              replace medical advice.
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

const mutedParagraphStyle = {
  fontSize: "14px",
  color: "#6b7280",
  lineHeight: "1.6",
  margin: "0 0 16px 0",
  fontStyle: "italic" as const,
};

const listStyle = {
  fontSize: "14px",
  color: "#374151",
  lineHeight: "1.8",
  margin: "0 0 16px 0",
  whiteSpace: "pre-line" as const,
  paddingLeft: "8px",
};

const dividerStyle = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

const videoButtonContainerStyle = {
  textAlign: "center" as const,
  padding: "8px 0",
};

const videoButtonStyle = {
  backgroundColor: "#1e3a5f",
  color: "#ffffff",
  padding: "12px 32px",
  borderRadius: "6px",
  fontSize: "15px",
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
  lineHeight: "1.5",
};
