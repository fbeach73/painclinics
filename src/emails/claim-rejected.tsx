import * as React from "react";
import { Text, Section } from "@react-email/components";
import { EmailButton } from "./components/email-button";
import { EmailCard, EmailCardTitle, EmailCardText } from "./components/email-card";
import { EmailLayout } from "./components/email-layout";

interface ClaimRejectedProps {
  clinicName: string;
  reason: string;
  supportUrl?: string | undefined;
  unsubscribeUrl?: string | undefined;
}

export function ClaimRejected({
  clinicName,
  reason,
  supportUrl,
  unsubscribeUrl,
}: ClaimRejectedProps) {
  const defaultSupportUrl = supportUrl || `${process.env.NEXT_PUBLIC_APP_URL || "https://painclinics.com"}/contact`;

  return (
    <EmailLayout
      previewText={`Update on your claim for ${clinicName}`}
      {...(unsubscribeUrl ? { unsubscribeUrl } : {})}
    >
      <Text style={headingStyle}>Claim Not Approved</Text>

      <Text style={paragraphStyle}>
        We&apos;ve reviewed your ownership claim for <strong>{clinicName}</strong>,
        and unfortunately we were unable to verify your ownership at this time.
      </Text>

      <EmailCard variant="warning">
        <EmailCardTitle>Reason</EmailCardTitle>
        <EmailCardText>{reason}</EmailCardText>
      </EmailCard>

      <Text style={paragraphStyle}>
        If you believe this decision was made in error or if you can provide
        additional documentation to verify your ownership, please contact our
        support team.
      </Text>

      <Section style={buttonContainerStyle}>
        <EmailButton href={defaultSupportUrl} variant="secondary">
          Contact Support
        </EmailButton>
      </Section>

      <Text style={paragraphStyle}>
        Common documents that help verify ownership include:
      </Text>
      <Text style={listStyle}>
        • Business license or registration
        {"\n"}• Utility bills showing the clinic address
        {"\n"}• Professional medical licenses
        {"\n"}• Tax documents with clinic information
      </Text>

      <Text style={paragraphStyle}>
        You are welcome to submit a new claim with additional documentation at
        any time.
      </Text>

      <Text style={signatureStyle}>
        Best regards,
        <br />
        The Pain Clinics Directory Team
      </Text>
    </EmailLayout>
  );
}

const headingStyle: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#dc2626",
  margin: "0 0 16px 0",
};

const paragraphStyle: React.CSSProperties = {
  fontSize: "15px",
  color: "#374151",
  lineHeight: "1.6",
  margin: "0 0 16px 0",
};

const listStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#4b5563",
  lineHeight: "1.8",
  margin: "0 0 16px 0",
  paddingLeft: "8px",
  whiteSpace: "pre-line",
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

export default ClaimRejected;
