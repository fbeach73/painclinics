import * as React from "react";
import { Text, Section } from "@react-email/components";
import { EmailButton } from "./components/email-button";
import { EmailCard, EmailCardTitle, EmailCardText } from "./components/email-card";
import { EmailLayout } from "./components/email-layout";

interface PaymentFailedProps {
  clinicName: string;
  updatePaymentUrl: string;
  unsubscribeUrl?: string | undefined;
}

export function PaymentFailed({
  clinicName,
  updatePaymentUrl,
  unsubscribeUrl,
}: PaymentFailedProps) {
  return (
    <EmailLayout
      previewText={`Action required: Payment failed for ${clinicName}`}
      {...(unsubscribeUrl ? { unsubscribeUrl } : {})}
    >
      <Text style={headingStyle}>Payment Failed</Text>

      <Text style={paragraphStyle}>
        We were unable to process your payment for the Featured listing
        subscription for <strong>{clinicName}</strong>.
      </Text>

      <EmailCard variant="warning">
        <EmailCardTitle>Action Required</EmailCardTitle>
        <EmailCardText>
          Please update your payment method to continue enjoying Featured
          listing benefits. Your listing will revert to a standard listing if
          payment is not received within 7 days.
        </EmailCardText>
      </EmailCard>

      <Section style={buttonContainerStyle}>
        <EmailButton href={updatePaymentUrl} variant="danger">
          Update Payment Method
        </EmailButton>
      </Section>

      <Text style={paragraphStyle}>
        Common reasons for payment failure include:
      </Text>
      <Text style={listStyle}>
        • Expired credit card
        {"\n"}• Insufficient funds
        {"\n"}• Card declined by issuer
        {"\n"}• Outdated billing information
      </Text>

      <Text style={paragraphStyle}>
        If you believe this is an error or need assistance, please contact our
        support team. We&apos;re here to help ensure your listing stays active.
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

export default PaymentFailed;
