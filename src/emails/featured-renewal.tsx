import * as React from "react";
import { Text, Section } from "@react-email/components";
import { EmailButton } from "./components/email-button";
import { EmailCard, EmailCardTitle, EmailDataRow } from "./components/email-card";
import { EmailLayout } from "./components/email-layout";

interface FeaturedRenewalProps {
  clinicName: string;
  amount: string;
  paymentMethodLast4: string;
  nextBillingDate: string;
  invoiceUrl?: string | undefined;
  unsubscribeUrl?: string | undefined;
}

export function FeaturedRenewal({
  clinicName,
  amount,
  paymentMethodLast4,
  nextBillingDate,
  invoiceUrl,
  unsubscribeUrl,
}: FeaturedRenewalProps) {
  return (
    <EmailLayout
      previewText={`Payment received for ${clinicName} Featured Listing`}
      {...(unsubscribeUrl ? { unsubscribeUrl } : {})}
    >
      <Text style={headingStyle}>Payment Successful</Text>

      <Text style={paragraphStyle}>
        Thank you for your continued subscription! Your Featured listing payment
        for <strong>{clinicName}</strong> has been processed successfully.
      </Text>

      <EmailCard variant="default">
        <EmailCardTitle>Payment Details</EmailCardTitle>
        <EmailDataRow label="Clinic" value={clinicName} />
        <EmailDataRow label="Amount" value={amount} />
        <EmailDataRow label="Payment Method" value={`Card ending in ${paymentMethodLast4}`} />
        <EmailDataRow label="Next Billing Date" value={nextBillingDate} />
      </EmailCard>

      {invoiceUrl && (
        <Section style={buttonContainerStyle}>
          <EmailButton href={invoiceUrl} variant="secondary">
            View Invoice
          </EmailButton>
        </Section>
      )}

      <Text style={paragraphStyle}>
        Your Featured listing benefits will continue uninterrupted. If you have
        any questions about your subscription or need to update your payment
        information, please visit your account dashboard.
      </Text>

      <EmailCard variant="info">
        <EmailCardTitle>Need to make changes?</EmailCardTitle>
        <Text style={infoTextStyle}>
          You can manage your subscription, update payment methods, or cancel at
          any time from your clinic dashboard.
        </Text>
      </EmailCard>

      <Text style={signatureStyle}>
        Thank you for your business!
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

const infoTextStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#4b5563",
  margin: 0,
  lineHeight: "1.5",
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

export default FeaturedRenewal;
