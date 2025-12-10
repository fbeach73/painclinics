import { Text, Section } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/email-layout";
import { EmailButton } from "./components/email-button";
import { EmailCard, EmailCardTitle, EmailCardText } from "./components/email-card";

interface ClaimApprovedProps {
  clinicName: string;
  dashboardUrl: string;
  unsubscribeUrl?: string | undefined;
}

export function ClaimApproved({
  clinicName,
  dashboardUrl,
  unsubscribeUrl,
}: ClaimApprovedProps) {
  return (
    <EmailLayout
      previewText={`Your claim for ${clinicName} has been approved!`}
      {...(unsubscribeUrl ? { unsubscribeUrl } : {})}
    >
      <Text style={headingStyle}>Claim Approved!</Text>

      <Text style={paragraphStyle}>
        Great news! Your ownership claim for <strong>{clinicName}</strong> has
        been approved. You now have full access to manage your clinic listing.
      </Text>

      <EmailCard variant="success">
        <EmailCardTitle>You can now:</EmailCardTitle>
        <EmailCardText>
          • Update your clinic information and contact details
          {"\n"}• Add photos and descriptions
          {"\n"}• Manage services offered
          {"\n"}• Respond to patient inquiries
          {"\n"}• Upgrade to Featured listing for more visibility
        </EmailCardText>
      </EmailCard>

      <Section style={buttonContainerStyle}>
        <EmailButton href={dashboardUrl} variant="success">
          Go to My Clinics Dashboard
        </EmailButton>
      </Section>

      <Text style={paragraphStyle}>
        If you have any questions about managing your listing or upgrading to a
        Featured listing, please don&apos;t hesitate to contact our support team.
      </Text>

      <Text style={signatureStyle}>
        Congratulations!
        <br />
        The Pain Clinics Directory Team
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

const signatureStyle: React.CSSProperties = {
  fontSize: "15px",
  color: "#374151",
  lineHeight: "1.6",
  marginTop: "24px",
};

export default ClaimApproved;
