import * as React from "react";
import { Text, Section, Link } from "@react-email/components";
import { EmailButton } from "./components/email-button";
import { EmailCard, EmailCardTitle, EmailCardText } from "./components/email-card";
import { EmailLayout } from "./components/email-layout";

interface FeaturedWelcomeProps {
  clinicName: string;
  tier: "basic" | "premium";
  dashboardUrl: string;
  unsubscribeUrl?: string | undefined;
}

export function FeaturedWelcome({
  clinicName,
  tier,
  dashboardUrl,
  unsubscribeUrl,
}: FeaturedWelcomeProps) {
  const tierBenefits = tier === "premium"
    ? [
        "Priority placement at the top of search results",
        "Featured badge displayed on your listing",
        "Highlighted listing with enhanced visibility",
        "Premium support from our team",
        "Analytics and insights dashboard",
        "Unlimited photo uploads",
      ]
    : [
        "Featured badge displayed on your listing",
        "Highlighted listing in search results",
        "Enhanced visibility to patients",
        "Priority support",
      ];

  return (
    <EmailLayout
      previewText={`Welcome to Featured Listing - ${clinicName}`}
      {...(unsubscribeUrl ? { unsubscribeUrl } : {})}
    >
      <Text style={headingStyle}>Welcome to Featured Listing!</Text>

      <Text style={paragraphStyle}>
        Congratulations! Your <strong>{tier === "premium" ? "Premium" : "Basic"}</strong>{" "}
        Featured subscription for <strong>{clinicName}</strong> is now active.
      </Text>

      <EmailCard variant="highlight">
        <EmailCardTitle>Your {tier === "premium" ? "Premium" : "Basic"} Benefits</EmailCardTitle>
        <EmailCardText>
          {tierBenefits.map((benefit, index) => (
            <React.Fragment key={index}>
              • {benefit}
              {index < tierBenefits.length - 1 && "\n"}
            </React.Fragment>
          ))}
        </EmailCardText>
      </EmailCard>

      <Text style={paragraphStyle}>
        Your listing will now appear with a Featured badge and receive
        priority placement, helping more patients discover your clinic.{" "}
        <Link href={dashboardUrl} style={linkStyle}>
          Visit your clinic dashboard
        </Link>{" "}
        to manage your listing.
      </Text>

      <Section style={buttonContainerStyle}>
        <EmailButton href={dashboardUrl} variant="primary">
          Manage Your Clinics
        </EmailButton>
      </Section>

      <EmailCard variant="info">
        <EmailCardTitle>Tips to maximize your listing</EmailCardTitle>
        <EmailCardText>
          • Keep your clinic information up to date
          {"\n"}• Add high-quality photos of your facility
          {"\n"}• List all services you offer
          {"\n"}• Respond promptly to patient inquiries
        </EmailCardText>
      </EmailCard>

      <Text style={paragraphStyle}>
        Thank you for choosing Pain Clinics Directory to grow your practice.
        If you have any questions, our support team is here to help.
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
  color: "#2563eb",
  margin: "0 0 16px 0",
};

const paragraphStyle: React.CSSProperties = {
  fontSize: "15px",
  color: "#374151",
  lineHeight: "1.6",
  margin: "0 0 16px 0",
};

const linkStyle: React.CSSProperties = {
  color: "#2563eb",
  textDecoration: "underline",
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

export default FeaturedWelcome;
