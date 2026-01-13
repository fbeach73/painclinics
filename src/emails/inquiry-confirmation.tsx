import * as React from "react";
import { Text, Section } from "@react-email/components";
import { EmailButton } from "./components/email-button";
import { EmailCard, EmailCardTitle, EmailCardText } from "./components/email-card";
import { EmailLayout } from "./components/email-layout";

interface InquiryConfirmationProps {
  patientName: string;
  clinicName: string;
  clinicCity: string;
  clinicState: string;
  submittedAt: string;
}

export function InquiryConfirmation({
  patientName,
  clinicName,
  clinicCity,
  clinicState,
  submittedAt,
}: InquiryConfirmationProps) {
  return (
    <EmailLayout previewText={`Your inquiry to ${clinicName} has been received`}>
      <Section style={logoContainerStyle}>
        <Text style={medicalIconStyle}>⚕️</Text>
        <Text style={brandTextStyle}>Painclinics.com Listings</Text>
      </Section>

      <Text style={headingStyle}>We Received Your Inquiry!</Text>

      <Text style={paragraphStyle}>Hi {patientName},</Text>

      <Text style={paragraphStyle}>
        Thank you for reaching out through Painclinics.com Listings. Your inquiry
        has been successfully submitted to{" "}
        <strong>
          {clinicName}
        </strong>{" "}
        in {clinicCity}, {clinicState}.
      </Text>

      <EmailCard variant="success">
        <EmailCardTitle>What Happens Next?</EmailCardTitle>
        <EmailCardText>
          The clinic has received your information and will contact you at your
          preferred time. Most clinics respond within 1-2 business days.
        </EmailCardText>
      </EmailCard>

      <Text style={paragraphStyle}>
        <strong>Submitted on:</strong> {submittedAt}
      </Text>

      <EmailCard variant="info">
        <EmailCardTitle>While You Wait</EmailCardTitle>
        <EmailCardText>
          Browse other pain management clinics in your area to compare services
          and find the best fit for your needs.
        </EmailCardText>
      </EmailCard>

      <Section style={buttonContainerStyle}>
        <EmailButton href="https://www.painclinics.com" variant="primary">
          Browse More Clinics
        </EmailButton>
      </Section>

      <Text style={paragraphStyle}>
        If you have any questions or need to update your inquiry, please don&apos;t
        hesitate to contact us.
      </Text>

      <Text style={signatureStyle}>
        Wishing you well on your journey to better pain management,
        <br />
        <strong>The Painclinics.com Listings Team</strong>
      </Text>
    </EmailLayout>
  );
}

const logoContainerStyle: React.CSSProperties = {
  textAlign: "center" as const,
  marginBottom: "24px",
};

const medicalIconStyle: React.CSSProperties = {
  fontSize: "48px",
  margin: "0 0 8px 0",
  lineHeight: "1",
};

const brandTextStyle: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: "bold",
  color: "#0d9488",
  margin: "0",
};

const headingStyle: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#0d9488", // teal-600 to match the site's accent
  margin: "0 0 16px 0",
  textAlign: "center" as const,
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

export default InquiryConfirmation;
