import * as React from "react";
import { Text, Section, Hr } from "@react-email/components";
import { EmailButton } from "./components/email-button";
import { EmailCard, EmailCardTitle } from "./components/email-card";
import { EmailLayout } from "./components/email-layout";

export interface SubscriptionAdminProps {
  clinicName: string;
  clinicSlug: string;
  tier: "basic" | "premium";
  billingCycle: "monthly" | "annual";
  userEmail: string;
  submittedAt: string;
  clinicUrl: string;
  adsenseExclusionUrl: string;
}

export function SubscriptionAdmin({
  clinicName,
  clinicSlug: _clinicSlug,
  tier,
  billingCycle,
  userEmail,
  submittedAt,
  clinicUrl,
  adsenseExclusionUrl,
}: SubscriptionAdminProps) {
  // clinicSlug is available in props for reference but clinic URL is pre-constructed
  void _clinicSlug;
  const tierLabel = tier === "premium" ? "Premium" : "Basic";
  const billingLabel = billingCycle === "annual" ? "Annual" : "Monthly";

  return (
    <EmailLayout previewText={`New Featured Subscription - ${clinicName} (${tierLabel})`}>
      <Text style={headingStyle}>New Featured Subscription</Text>

      <Text style={paragraphStyle}>
        A new featured subscription has been created for <strong>{clinicName}</strong>.
      </Text>

      <EmailCard variant="highlight">
        <EmailCardTitle>Subscription Details</EmailCardTitle>
        <Section style={detailsStyle}>
          <Text style={detailRowStyle}>
            <strong>Clinic:</strong> {clinicName}
          </Text>
          <Text style={detailRowStyle}>
            <strong>Tier:</strong> {tierLabel}
          </Text>
          <Text style={detailRowStyle}>
            <strong>Billing:</strong> {billingLabel}
          </Text>
          <Text style={detailRowStyle}>
            <strong>Customer Email:</strong> {userEmail}
          </Text>
          <Text style={detailRowStyle}>
            <strong>Clinic URL:</strong> {clinicUrl}
          </Text>
          <Text style={detailRowStyle}>
            <strong>Created:</strong> {submittedAt}
          </Text>
        </Section>
      </EmailCard>

      <Section style={buttonContainerStyle}>
        <EmailButton href={clinicUrl}>View Clinic</EmailButton>
      </Section>

      <Section style={buttonContainerStyle}>
        <EmailButton href={adsenseExclusionUrl} variant="secondary">
          Remove from Adsense
        </EmailButton>
      </Section>

      <Hr style={dividerStyle} />

      <Text style={footerTextStyle}>
        <strong>Reminder:</strong> Featured listings should be excluded from Adsense.
        Click the button above to add the clinic URL to your Adsense exclusions list.
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
  margin: "16px 0",
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

export default SubscriptionAdmin;
