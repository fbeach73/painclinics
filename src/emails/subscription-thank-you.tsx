import * as React from "react";
import { Text, Section, Hr } from "@react-email/components";
import { EmailButton } from "./components/email-button";
import { EmailCard, EmailCardTitle, EmailCardText } from "./components/email-card";
import { EmailLayout } from "./components/email-layout";

export interface SubscriptionThankYouProps {
  clinicName: string;
  tier: "basic" | "premium";
  dashboardUrl: string;
  unsubscribeUrl?: string | undefined;
}

export function SubscriptionThankYou({
  clinicName,
  tier,
  dashboardUrl,
  unsubscribeUrl,
}: SubscriptionThankYouProps) {
  const tierLabel = tier === "premium" ? "Premium" : "Basic";

  return (
    <EmailLayout
      previewText={`Thank You for Subscribing! - Painclinics.com Listings`}
      {...(unsubscribeUrl ? { unsubscribeUrl } : {})}
    >
      <Text style={headingStyle}>Thank You for Subscribing!</Text>

      <Text style={paragraphStyle}>
        We truly appreciate your trust in Painclinics.com Listings. Your{" "}
        <strong>{tierLabel}</strong> subscription for <strong>{clinicName}</strong> is
        now active, and your listing is already getting enhanced visibility.
      </Text>

      <Text style={paragraphStyle}>
        Your support helps us continue to connect patients with quality pain
        management care across the country.
      </Text>

      <EmailCard variant="info">
        <EmailCardTitle>Your Dashboard is Ready</EmailCardTitle>
        <EmailCardText>
          Manage your listing, view analytics, and update your clinic information
          anytime from your personalized dashboard.
        </EmailCardText>
      </EmailCard>

      <Section style={buttonContainerStyle}>
        <EmailButton href={dashboardUrl} variant="primary">
          Go to My Clinics
        </EmailButton>
      </Section>

      <Hr style={dividerStyle} />

      <Text style={supportStyle}>
        <strong>Need help?</strong> Our team is here for you. Reach out anytime at{" "}
        <a href="mailto:hello@painclinics.com" style={linkStyle}>
          hello@painclinics.com
        </a>
      </Text>

      <Text style={signatureStyle}>
        Warm regards,
        <br />
        The Painclinics.com Listings Team
      </Text>
    </EmailLayout>
  );
}

const headingStyle: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#2563eb",
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

const dividerStyle: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

const supportStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#374151",
  lineHeight: "1.6",
  margin: "0 0 16px 0",
};

const linkStyle: React.CSSProperties = {
  color: "#2563eb",
  textDecoration: "underline",
};

const signatureStyle: React.CSSProperties = {
  fontSize: "15px",
  color: "#374151",
  lineHeight: "1.6",
  marginTop: "24px",
};

export default SubscriptionThankYou;
