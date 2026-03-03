import * as React from "react";
import { Text, Section } from "@react-email/components";
import { EmailButton } from "./components/email-button";
import { EmailCard, EmailCardTitle, EmailCardText } from "./components/email-card";
import { EmailLayout } from "./components/email-layout";

export interface ClaimInviteProps {
  clinicName: string;
  clinicUrl: string;
  claimUrl: string;
  unsubscribeUrl?: string | undefined;
}

export function ClaimInvite({
  clinicName,
  clinicUrl,
  claimUrl,
  unsubscribeUrl,
}: ClaimInviteProps) {
  return (
    <EmailLayout
      previewText={`Your clinic ${clinicName} is now live on PainClinics.com`}
      {...(unsubscribeUrl ? { unsubscribeUrl } : {})}
    >
      <Text style={headingStyle}>Your Clinic is Live!</Text>

      <Text style={paragraphStyle}>
        Great news! <strong>{clinicName}</strong> is now listed on
        PainClinics.com and visible to patients searching for pain management
        providers in your area.
      </Text>

      <Section style={buttonContainerStyle}>
        <EmailButton href={clinicUrl}>View Your Listing</EmailButton>
      </Section>

      <EmailCard variant="highlight">
        <EmailCardTitle>Claim your listing to:</EmailCardTitle>
        <EmailCardText>
          • Update your clinic information and contact details
          {"\n"}• Add photos and descriptions
          {"\n"}• Manage services and hours
          {"\n"}• Respond to patient inquiries
          {"\n"}• Upgrade to a Featured listing for more visibility
        </EmailCardText>
      </EmailCard>

      <Text style={paragraphStyle}>
        Click the button below to claim ownership of your listing. You will need
        to sign in with a Google account to verify your identity.
      </Text>

      <Section style={buttonContainerStyle}>
        <EmailButton href={claimUrl} variant="success">
          Claim Your Listing
        </EmailButton>
      </Section>

      <Text style={smallTextStyle}>
        This claim link expires in 30 days and can only be used once. If you did
        not submit this clinic, please disregard this email.
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
  color: "#16a34a",
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

const smallTextStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#6b7280",
  lineHeight: "1.5",
  margin: "16px 0",
};

const signatureStyle: React.CSSProperties = {
  fontSize: "15px",
  color: "#374151",
  lineHeight: "1.6",
  marginTop: "24px",
};

export default ClaimInvite;
