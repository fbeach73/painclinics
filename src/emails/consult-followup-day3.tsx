import * as React from "react";
import { Text, Section } from "@react-email/components";
import { EmailButton } from "./components/email-button";
import { EmailCard, EmailCardTitle, EmailCardText } from "./components/email-card";
import { EmailLayout } from "./components/email-layout";

export interface ConsultFollowupDay3Props {
  firstName: string;
  condition: string;
  zipCode: string;
  clinicsUrl: string;
  unsubscribeUrl?: string | undefined;
}

// Map common condition phrases to a short self-care tip
function getSelfCareTip(condition: string): string {
  const lower = condition.toLowerCase();
  if (lower.includes("back") || lower.includes("spine") || lower.includes("lumbar")) {
    return "Gentle movement like short walks or stretching can reduce stiffness. Avoid prolonged sitting — try standing or shifting position every 30 minutes.";
  }
  if (lower.includes("neck") || lower.includes("cervical")) {
    return "Keep your screen at eye level to reduce neck strain. Apply a warm compress for 15–20 minutes to ease muscle tension.";
  }
  if (lower.includes("knee") || lower.includes("leg")) {
    return "Elevating your leg and applying ice for 15 minutes several times a day can help manage swelling and discomfort.";
  }
  if (lower.includes("hip")) {
    return "Avoid crossing your legs and use a firm chair with good support. Gentle hip circles and stretches can help maintain mobility.";
  }
  if (lower.includes("shoulder") || lower.includes("arm")) {
    return "Gentle pendulum exercises and avoiding overhead activities can help reduce strain while your shoulder recovers.";
  }
  if (lower.includes("neuropath") || lower.includes("nerve") || lower.includes("tingling") || lower.includes("numbness")) {
    return "Keep blood sugar stable if possible, and avoid tight footwear or clothing that can compress affected nerves. Consistent, gentle movement supports nerve health.";
  }
  if (lower.includes("headache") || lower.includes("migraine")) {
    return "Stay well-hydrated, maintain consistent sleep schedules, and limit screen time. Keeping a symptom diary can help identify your triggers.";
  }
  // Generic fallback
  return "Stay as gently active as your pain allows — rest is important, but movement helps healing. Keep notes on what worsens or improves your symptoms to share with your specialist.";
}

export function ConsultFollowupDay3({
  firstName,
  condition,
  zipCode,
  clinicsUrl,
  unsubscribeUrl,
}: ConsultFollowupDay3Props) {
  const selfCareTip = getSelfCareTip(condition);

  return (
    <EmailLayout
      previewText={`Checking in on your ${condition} — PainConsult AI`}
      {...(unsubscribeUrl ? { unsubscribeUrl } : {})}
    >
      <Text style={headingStyle}>Checking in on your recovery</Text>

      <Text style={paragraphStyle}>Hi {firstName},</Text>

      <Text style={paragraphStyle}>
        It&apos;s been a few days since your PainConsult AI consultation about{" "}
        <strong>{condition}</strong>. We wanted to check in and see how you&apos;re doing.
      </Text>

      <EmailCard variant="info">
        <EmailCardTitle>Have you been able to see a specialist yet?</EmailCardTitle>
        <EmailCardText>
          If yes — great. Bring your consultation summary to your appointment. It outlines
          your symptoms, duration, and the treatment options most relevant to your situation.
          {"\n\n"}
          If not yet — finding the right doctor is the most important first step.
        </EmailCardText>
        <Section style={buttonContainerStyle}>
          <EmailButton href={clinicsUrl} variant="primary">
            Find Clinics Near {zipCode}
          </EmailButton>
        </Section>
      </EmailCard>

      <EmailCard variant="highlight">
        <EmailCardTitle>In the meantime, remember:</EmailCardTitle>
        <EmailCardText>{selfCareTip}</EmailCardText>
      </EmailCard>

      <Text style={paragraphStyle}>
        <strong>Want a detailed treatment plan?</strong>
        <br />
        Your personalized pain management plan is still available — with a week-by-week
        recovery protocol, specialist questions, and evidence-based options tailored to
        your condition.
      </Text>

      <Section style={buttonContainerStyle}>
        <EmailButton href="https://painclinics.com/consult" variant="secondary">
          Get Your Plan — $19.99
        </EmailButton>
      </Section>

      <Text style={signatureStyle}>
        Take care,
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

const buttonContainerStyle: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "16px 0 4px 0",
};

const signatureStyle: React.CSSProperties = {
  fontSize: "15px",
  color: "#374151",
  lineHeight: "1.6",
  marginTop: "24px",
};

export default ConsultFollowupDay3;
