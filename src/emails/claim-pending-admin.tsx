import * as React from "react";
import { Text, Section, Hr } from "@react-email/components";
import { EmailButton } from "./components/email-button";
import { EmailCard, EmailCardTitle } from "./components/email-card";
import { EmailLayout } from "./components/email-layout";

export interface ClaimPendingAdminProps {
  clinicName: string;
  claimantName: string;
  claimantEmail: string;
  claimantRole: string;
  submittedAt: string;
  reviewUrl?: string | undefined;
}

export function ClaimPendingAdmin({
  clinicName,
  claimantName,
  claimantEmail,
  claimantRole,
  submittedAt,
  reviewUrl,
}: ClaimPendingAdminProps) {
  const roleLabels: Record<string, string> = {
    owner: "Owner",
    manager: "Manager",
    authorized_representative: "Authorized Representative",
  };

  return (
    <EmailLayout previewText={`New claim pending review - ${clinicName}`}>
      <Text style={headingStyle}>New Claim Pending Review</Text>

      <Text style={paragraphStyle}>
        A new claim has been submitted for <strong>{clinicName}</strong> and requires your review.
      </Text>

      <EmailCard variant="highlight">
        <EmailCardTitle>Claim Details</EmailCardTitle>
        <Section style={detailsStyle}>
          <Text style={detailRowStyle}>
            <strong>Clinic:</strong> {clinicName}
          </Text>
          <Text style={detailRowStyle}>
            <strong>Claimant Name:</strong> {claimantName}
          </Text>
          <Text style={detailRowStyle}>
            <strong>Email:</strong> {claimantEmail}
          </Text>
          <Text style={detailRowStyle}>
            <strong>Role:</strong> {roleLabels[claimantRole] || claimantRole}
          </Text>
          <Text style={detailRowStyle}>
            <strong>Submitted:</strong> {submittedAt}
          </Text>
        </Section>
      </EmailCard>

      {reviewUrl && (
        <Section style={buttonContainerStyle}>
          <EmailButton href={reviewUrl}>Review Claim</EmailButton>
        </Section>
      )}

      <Hr style={dividerStyle} />

      <Text style={footerTextStyle}>
        Please review this claim in the admin panel and approve or reject it based on the provided information.
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

const detailsStyle: React.CSSProperties = {
  margin: "0",
};

const detailRowStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#374151",
  lineHeight: "1.6",
  margin: "4px 0",
};

const buttonContainerStyle: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const dividerStyle: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

const footerTextStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#6b7280",
  lineHeight: "1.6",
  margin: "0",
};

export default ClaimPendingAdmin;
