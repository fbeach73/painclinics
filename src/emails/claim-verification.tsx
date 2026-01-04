import * as React from "react";
import { Text, Section } from "@react-email/components";
import { EmailButton } from "./components/email-button";
import { EmailCard, EmailCardTitle, EmailCardText } from "./components/email-card";
import { EmailLayout } from "./components/email-layout";

interface ClaimVerificationProps {
  clinicName: string;
  verificationUrl?: string | undefined;
  unsubscribeUrl?: string | undefined;
}

export function ClaimVerification({
  clinicName,
  verificationUrl,
  unsubscribeUrl,
}: ClaimVerificationProps) {
  return (
    <EmailLayout
      previewText={`Verify your claim for ${clinicName}`}
      {...(unsubscribeUrl ? { unsubscribeUrl } : {})}
    >
      <Text style={headingStyle}>Claim Submitted Successfully</Text>

      <Text style={paragraphStyle}>
        Thank you for submitting a claim for <strong>{clinicName}</strong>. We
        have received your request and our team will review it shortly.
      </Text>

      <EmailCard variant="highlight">
        <EmailCardTitle>What happens next?</EmailCardTitle>
        <EmailCardText>
          Our team will verify your ownership information. This typically takes
          1-2 business days. You will receive an email once your claim has been
          reviewed.
        </EmailCardText>
      </EmailCard>

      {verificationUrl && (
        <Section style={buttonContainerStyle}>
          <EmailButton href={verificationUrl}>Verify Email Address</EmailButton>
        </Section>
      )}

      <Text style={paragraphStyle}>
        If you did not submit this claim, please disregard this email or contact
        our support team.
      </Text>

      <Text style={signatureStyle}>
        Best regards,
        <br />
        The Painclinics.com Listings Team
      </Text>
    </EmailLayout>
  );
}

const headingStyle: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#111827",
  margin: "0 0 16px 0",
};

const paragraphStyle: React.CSSProperties = {
  fontSize: "15px",
  color: "#374151",
  lineHeight: "1.6",
  margin: "0 0 16px 0",
};

const buttonContainerStyle: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const signatureStyle: React.CSSProperties = {
  fontSize: "15px",
  color: "#374151",
  lineHeight: "1.6",
  marginTop: "24px",
};

export default ClaimVerification;
