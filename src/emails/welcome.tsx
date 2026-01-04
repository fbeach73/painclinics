import * as React from "react";
import { Text, Section } from "@react-email/components";
import { EmailButton } from "./components/email-button";
import { EmailCard, EmailCardTitle, EmailCardText } from "./components/email-card";
import { EmailLayout } from "./components/email-layout";

interface WelcomeProps {
  userName: string;
  dashboardUrl?: string | undefined;
  unsubscribeUrl?: string | undefined;
}

export function Welcome({
  userName,
  dashboardUrl,
  unsubscribeUrl,
}: WelcomeProps) {
  const defaultDashboardUrl = dashboardUrl || `${process.env.NEXT_PUBLIC_APP_URL || "https://painclinics.com"}/dashboard`;

  return (
    <EmailLayout
      previewText="Welcome to Painclinics.com Listings!"
      {...(unsubscribeUrl ? { unsubscribeUrl } : {})}
    >
      <Text style={headingStyle}>Welcome to Painclinics.com Listings!</Text>

      <Text style={paragraphStyle}>
        Hi {userName},
      </Text>

      <Text style={paragraphStyle}>
        Thank you for joining Painclinics.com Listings! We&apos;re excited to have
        you as part of our community dedicated to connecting patients with
        quality pain management care.
      </Text>

      <EmailCard variant="highlight">
        <EmailCardTitle>Getting Started</EmailCardTitle>
        <EmailCardText>
          • Browse our directory of pain management clinics
          {"\n"}• Search by location, services, or specialty
          {"\n"}• Save clinics to your favorites
          {"\n"}• Own a clinic? Claim your listing to manage it
        </EmailCardText>
      </EmailCard>

      <Section style={buttonContainerStyle}>
        <EmailButton href={defaultDashboardUrl} variant="primary">
          Explore Your Dashboard
        </EmailButton>
      </Section>

      <Text style={paragraphStyle}>
        <strong>Are you a clinic owner?</strong>
        <br />
        Claim your clinic listing to manage your information, respond to
        patients, and upgrade to a Featured listing for enhanced visibility.
      </Text>

      <EmailCard variant="info">
        <EmailCardTitle>Need Help?</EmailCardTitle>
        <EmailCardText>
          Our support team is here to help! If you have any questions or need
          assistance, don&apos;t hesitate to reach out.
        </EmailCardText>
      </EmailCard>

      <Text style={paragraphStyle}>
        We&apos;re committed to helping you find the best pain management care.
        If there&apos;s anything we can do to improve your experience, please let
        us know.
      </Text>

      <Text style={signatureStyle}>
        Welcome aboard!
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

const signatureStyle: React.CSSProperties = {
  fontSize: "15px",
  color: "#374151",
  lineHeight: "1.6",
  marginTop: "24px",
};

export default Welcome;
