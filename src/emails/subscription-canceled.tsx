import * as React from "react";
import { Text, Section } from "@react-email/components";
import { EmailButton } from "./components/email-button";
import { EmailCard, EmailCardTitle, EmailCardText, EmailDataRow } from "./components/email-card";
import { EmailLayout } from "./components/email-layout";

interface SubscriptionCanceledProps {
  clinicName: string;
  endDate: string;
  reactivateUrl?: string | undefined;
  unsubscribeUrl?: string | undefined;
}

export function SubscriptionCanceled({
  clinicName,
  endDate,
  reactivateUrl,
  unsubscribeUrl,
}: SubscriptionCanceledProps) {
  return (
    <EmailLayout
      previewText={`Your Featured subscription for ${clinicName} has been canceled`}
      {...(unsubscribeUrl ? { unsubscribeUrl } : {})}
    >
      <Text style={headingStyle}>Subscription Canceled</Text>

      <Text style={paragraphStyle}>
        Your Featured listing subscription for <strong>{clinicName}</strong> has
        been canceled as requested.
      </Text>

      <EmailCard variant="default">
        <EmailCardTitle>Subscription Details</EmailCardTitle>
        <EmailDataRow label="Clinic" value={clinicName} />
        <EmailDataRow label="Status" value="Canceled" />
        <EmailDataRow label="Benefits End" value={endDate} />
      </EmailCard>

      <Text style={paragraphStyle}>
        You will continue to have access to Featured listing benefits until{" "}
        <strong>{endDate}</strong>. After this date, your listing will revert to
        a standard listing.
      </Text>

      <EmailCard variant="info">
        <EmailCardTitle>What you&apos;ll lose</EmailCardTitle>
        <EmailCardText>
          • Featured badge on your listing
          {"\n"}• Priority placement in search results
          {"\n"}• Enhanced visibility to patients
          {"\n"}• Premium support
        </EmailCardText>
      </EmailCard>

      {reactivateUrl && (
        <>
          <Text style={paragraphStyle}>
            Changed your mind? You can reactivate your subscription at any time
            to continue enjoying Featured benefits.
          </Text>

          <Section style={buttonContainerStyle}>
            <EmailButton href={reactivateUrl} variant="primary">
              Reactivate Subscription
            </EmailButton>
          </Section>
        </>
      )}

      <Text style={paragraphStyle}>
        We&apos;re sorry to see you go. If you have any feedback about your
        experience or suggestions for improvement, we&apos;d love to hear from
        you.
      </Text>

      <Text style={signatureStyle}>
        Thank you for being a valued member,
        <br />
        The Painclinics.com Listings Team
      </Text>
    </EmailLayout>
  );
}

const headingStyle: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#6b7280",
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

export default SubscriptionCanceled;
