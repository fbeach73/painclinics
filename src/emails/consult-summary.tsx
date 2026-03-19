import * as React from "react";
import { Text, Section, Link, Hr } from "@react-email/components";
import { EmailButton } from "./components/email-button";
import { EmailCard, EmailCardTitle, EmailCardText, EmailDataRow } from "./components/email-card";
import { EmailLayout } from "./components/email-layout";

export interface ConsultSummaryProps {
  firstName: string;
  condition: string;
  consultDate: string;
  zipCode: string;
  age?: string | undefined;
  assessmentSummary: string;
  clinics?: Array<{
    title: string;
    permalink: string;
    city: string;
    stateAbbreviation: string | null;
    rating: number | null;
    reviewCount: number | null;
  }> | undefined;
  unsubscribeUrl?: string | undefined;
  deleteDataUrl?: string | undefined;
}

const BASE_URL = "https://painclinics.com";

export function ConsultSummary({
  firstName,
  condition,
  consultDate,
  zipCode,
  age,
  assessmentSummary,
  clinics,
  unsubscribeUrl,
  deleteDataUrl,
}: ConsultSummaryProps) {
  const hasClinics = clinics && clinics.length > 0;

  return (
    <EmailLayout
      previewText="Your PainConsult AI Summary — PainClinics.com"
      {...(unsubscribeUrl ? { unsubscribeUrl } : {})}
    >
      <Text style={headingStyle}>Your PainConsult AI Summary</Text>

      <Text style={paragraphStyle}>Hi {firstName},</Text>

      <Text style={paragraphStyle}>
        Thank you for using PainConsult AI. Here&apos;s a summary of your consultation.
      </Text>

      {/* Consultation Details */}
      <EmailCard variant="highlight">
        <EmailCardTitle>Consultation Details</EmailCardTitle>
        <Section style={dataRowsStyle}>
          <EmailDataRow label="Condition" value={condition} />
          <EmailDataRow label="Date" value={consultDate} />
          <EmailDataRow label="Zip Code" value={zipCode} />
          {age ? <EmailDataRow label="Age" value={age} /> : null}
        </Section>
      </EmailCard>

      {/* AI Assessment */}
      <EmailCard variant="default">
        <EmailCardTitle>Key Insights from Your Consultation</EmailCardTitle>
        <Text
          style={assessmentStyle}
          dangerouslySetInnerHTML={{
            __html: assessmentSummary
              .replace(/^### (.*$)/gm, '<h3 style="font-size:15px;font-weight:600;color:#111827;margin:16px 0 6px 0;">$1</h3>')
              .replace(/^## (.*$)/gm, '<h2 style="font-size:17px;font-weight:600;color:#111827;margin:18px 0 8px 0;">$1</h2>')
              .replace(/^# (.*$)/gm, '<h2 style="font-size:17px;font-weight:600;color:#111827;margin:18px 0 8px 0;">$1</h2>')
              .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
              .replace(/^[-–] (.*$)/gm, '• $1')
              .replace(/\n\n/g, "</p><p style=\"margin:0 0 12px 0;line-height:1.6;\">")
              .replace(/\n/g, "<br/>"),
          }}
        />
      </EmailCard>

      {/* Matched Clinics */}
      {hasClinics && (
        <EmailCard variant="default">
          <EmailCardTitle>Clinics Near You</EmailCardTitle>
          {clinics.map((clinic, i) => (
            <Section key={i} style={clinicRowStyle}>
              <Link
                href={`${BASE_URL}/pain-management/${clinic.permalink}`}
                style={clinicLinkStyle}
              >
                {clinic.title}
              </Link>
              <Text style={clinicMetaStyle}>
                {[clinic.city, clinic.stateAbbreviation].filter(Boolean).join(", ")}
                {clinic.rating
                  ? ` · ${clinic.rating.toFixed(1)}★${clinic.reviewCount ? ` (${clinic.reviewCount} reviews)` : ""}`
                  : ""}
              </Text>
            </Section>
          ))}
        </EmailCard>
      )}

      {/* Browse CTA */}
      <Section style={buttonContainerStyle}>
        <EmailButton href={`${BASE_URL}/pain-management`} variant="primary">
          Browse All Clinics Near You
        </EmailButton>
      </Section>

      <Hr style={hrStyle} />

      {/* PDF Upsell */}
      <EmailCard variant="info">
        <EmailCardTitle>Want a detailed, personalized pain management plan?</EmailCardTitle>
        <EmailCardText>
          Based on your consultation, we can generate a comprehensive document with treatment
          protocols, specialist questions, self-care routines, and more.
        </EmailCardText>
        <Text style={upsellPriceStyle}>$19.99 — Instant PDF delivery</Text>
        <Section style={buttonContainerStyle}>
          <EmailButton href={`${BASE_URL}/consult`} variant="secondary">
            Get Your Personalized Plan
          </EmailButton>
        </Section>
      </EmailCard>

      <Text style={signatureStyle}>
        Wishing you relief and answers,
        <br />
        The PainClinics.com Team
      </Text>

      {deleteDataUrl && (
        <Text style={deleteDataStyle}>
          Want to delete your consultation data?{" "}
          <Link href={deleteDataUrl} style={deleteDataLinkStyle}>
            Delete my data
          </Link>
        </Text>
      )}
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

const assessmentStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#374151",
  lineHeight: "1.6",
  margin: "0",
  whiteSpace: "pre-wrap" as const,
};

const dataRowsStyle: React.CSSProperties = {
  marginTop: "8px",
};

const clinicRowStyle: React.CSSProperties = {
  marginBottom: "10px",
  paddingBottom: "10px",
  borderBottom: "1px solid #e5e7eb",
};

const clinicLinkStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#2563eb",
  textDecoration: "none",
  display: "block",
};

const clinicMetaStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#6b7280",
  margin: "2px 0 0 0",
};

const buttonContainerStyle: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "16px 0 8px 0",
};

const hrStyle: React.CSSProperties = {
  borderColor: "#e5e7eb",
  borderWidth: "1px",
  borderStyle: "solid",
  margin: "24px 0",
};

const upsellPriceStyle: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: "700",
  color: "#111827",
  margin: "12px 0 4px 0",
};

const signatureStyle: React.CSSProperties = {
  fontSize: "15px",
  color: "#374151",
  lineHeight: "1.6",
  marginTop: "24px",
};

const deleteDataStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#9ca3af",
  textAlign: "center" as const,
  marginTop: "16px",
};

const deleteDataLinkStyle: React.CSSProperties = {
  color: "#9ca3af",
  textDecoration: "underline",
};

export default ConsultSummary;
