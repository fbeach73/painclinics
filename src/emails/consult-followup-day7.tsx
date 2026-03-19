import * as React from "react";
import { Text, Section } from "@react-email/components";
import { EmailButton } from "./components/email-button";
import { EmailCard, EmailCardTitle, EmailCardText } from "./components/email-card";
import { EmailLayout } from "./components/email-layout";

export interface ConsultFollowupDay7Props {
  firstName: string;
  condition: string;
  zipCode: string;
  clinicsUrl: string;
  unsubscribeUrl?: string | undefined;
}

export function ConsultFollowupDay7({
  firstName,
  condition,
  zipCode,
  clinicsUrl,
  unsubscribeUrl,
}: ConsultFollowupDay7Props) {
  return (
    <EmailLayout
      previewText={`Your personalized pain plan is ready — PainConsult AI`}
      {...(unsubscribeUrl ? { unsubscribeUrl } : {})}
    >
      <Text style={headingStyle}>Your personalized pain plan is ready</Text>

      <Text style={paragraphStyle}>Hi {firstName},</Text>

      <Text style={paragraphStyle}>
        It&apos;s been a week since we talked about your <strong>{condition}</strong>. If
        you&apos;re still dealing with pain, a personalized plan can make a real difference
        in how you approach treatment and communicate with your care team.
      </Text>

      <EmailCard variant="highlight">
        <EmailCardTitle>What&apos;s in your plan:</EmailCardTitle>
        <EmailCardText>
          {"→ Week-by-week recovery protocol"}
          {"\n"}
          {"→ Specific questions to ask your specialist"}
          {"\n"}
          {"→ Evidence-based treatment options for your condition"}
          {"\n"}
          {"→ Red flags to watch for"}
        </EmailCardText>
      </EmailCard>

      <Text style={priceStyle}>$19.99 — delivered instantly to your inbox</Text>

      <Section style={buttonContainerStyle}>
        <EmailButton href="https://painclinics.com/consult" variant="primary">
          Get Your Personalized Plan
        </EmailButton>
      </Section>

      <Text style={softCloseStyle}>
        Not ready yet? That&apos;s okay. You can always come back to PainConsult AI
        anytime — your consultation history is still there when you need it.
      </Text>

      <EmailCard variant="info">
        <EmailCardTitle>Still looking for a specialist?</EmailCardTitle>
        <EmailCardText>
          Browse 5,000+ pain management clinics near {zipCode} — filter by specialty,
          insurance, and more.
        </EmailCardText>
        <Section style={buttonContainerStyle}>
          <EmailButton href={clinicsUrl} variant="secondary">
            Browse Clinics Near {zipCode}
          </EmailButton>
        </Section>
      </EmailCard>

      <Text style={signatureStyle}>
        Wishing you relief,
        <br />
        The PainConsult AI Team
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

const priceStyle: React.CSSProperties = {
  fontSize: "17px",
  fontWeight: "bold",
  color: "#111827",
  textAlign: "center" as const,
  margin: "16px 0 4px 0",
};

const buttonContainerStyle: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "16px 0 4px 0",
};

const softCloseStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#6b7280",
  lineHeight: "1.6",
  margin: "20px 0 16px 0",
  textAlign: "center" as const,
};

const signatureStyle: React.CSSProperties = {
  fontSize: "15px",
  color: "#374151",
  lineHeight: "1.6",
  marginTop: "24px",
};

export default ConsultFollowupDay7;
