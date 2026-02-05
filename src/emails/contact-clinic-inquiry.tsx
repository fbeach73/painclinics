import * as React from "react";
import { Text, Section, Hr } from "@react-email/components";
import { EmailCard, EmailCardTitle, EmailDataRow } from "./components/email-card";
import { EmailLayout } from "./components/email-layout";

export interface ContactClinicInquiryProps {
  clinicName: string;
  clinicCity: string;
  clinicState: string;
  clinicPhone?: string;
  clinicWebsite?: string;
  clinicPermalink?: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  preferredContactTime: string;
  additionalInfo?: string;
  painType: string;
  painDuration: string;
  previousTreatment: string;
  insuranceStatus: string;
  submittedAt: string;
}

export function ContactClinicInquiry({
  clinicName,
  clinicCity,
  clinicState,
  clinicPhone,
  clinicWebsite,
  clinicPermalink,
  patientName,
  patientEmail,
  patientPhone,
  preferredContactTime,
  additionalInfo,
  painType,
  painDuration,
  previousTreatment,
  insuranceStatus,
  submittedAt,
}: ContactClinicInquiryProps) {
  const baseUrl = "https://www.painclinics.com";
  const clinicUrl = clinicPermalink ? `${baseUrl}/${clinicPermalink}` : undefined;

  return (
    <EmailLayout previewText={`New patient inquiry for ${clinicName}`}>
      <Text style={headingStyle}>New Patient Inquiry</Text>

      <Text style={paragraphStyle}>
        A potential patient has submitted an inquiry for{" "}
        <strong>{clinicName}</strong> in {clinicCity}, {clinicState}.
      </Text>

      {/* Clinic Contact Info - for admin reference when forwarding */}
      <EmailCard variant="default">
        <EmailCardTitle>Clinic Contact Info</EmailCardTitle>
        <Section style={dataRowsStyle}>
          <EmailDataRow label="Clinic" value={clinicName} />
          <EmailDataRow label="Location" value={`${clinicCity}, ${clinicState}`} />
          {clinicPhone && <EmailDataRow label="Phone" value={clinicPhone} />}
          {clinicWebsite && <EmailDataRow label="Website" value={clinicWebsite} />}
          {clinicUrl && <EmailDataRow label="Directory Listing" value={clinicUrl} />}
        </Section>
      </EmailCard>

      <EmailCard variant="highlight">
        <EmailCardTitle>Contact Information</EmailCardTitle>
        <Section style={dataRowsStyle}>
          <EmailDataRow label="Name" value={patientName} />
          <EmailDataRow label="Email" value={patientEmail} />
          <EmailDataRow label="Phone" value={patientPhone} />
          <EmailDataRow label="Best Time to Call" value={formatContactTime(preferredContactTime)} />
        </Section>
      </EmailCard>

      <EmailCard variant="info">
        <EmailCardTitle>Patient Information</EmailCardTitle>
        <Section style={dataRowsStyle}>
          <EmailDataRow label="Pain Type" value={painType} />
          <EmailDataRow label="Duration" value={painDuration} />
          <EmailDataRow label="Previous Treatment" value={previousTreatment} />
          <EmailDataRow label="Insurance" value={insuranceStatus} />
        </Section>
      </EmailCard>

      {additionalInfo && (
        <EmailCard variant="default">
          <EmailCardTitle>Additional Information</EmailCardTitle>
          <Text style={additionalInfoStyle}>{additionalInfo}</Text>
        </EmailCard>
      )}

      <Hr style={hrStyle} />

      <Text style={footerNoteStyle}>
        This inquiry was submitted on {submittedAt} through Painclinics.com Listings.
        Please respond to the patient within 24-48 hours for best results.
      </Text>

      <Text style={signatureStyle}>
        Best regards,
        <br />
        The Painclinics.com Listings Team
      </Text>
    </EmailLayout>
  );
}

function formatContactTime(time: string): string {
  const timeMap: Record<string, string> = {
    morning: "Morning (8am - 12pm)",
    afternoon: "Afternoon (12pm - 5pm)",
    evening: "Evening (5pm - 8pm)",
    anytime: "Anytime",
  };
  return timeMap[time] || time;
}

const headingStyle: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#111827",
  margin: "0 0 16px 0",
};

const paragraphStyle: React.CSSProperties = {
  fontSize: "15px",
  color: "#374151",
  lineHeight: "1.6",
  margin: "0 0 16px 0",
};

const dataRowsStyle: React.CSSProperties = {
  marginTop: "8px",
};

const additionalInfoStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#4b5563",
  margin: 0,
  lineHeight: "1.5",
  whiteSpace: "pre-wrap",
};

const hrStyle: React.CSSProperties = {
  borderColor: "#e5e7eb",
  borderWidth: "1px",
  borderStyle: "solid",
  margin: "24px 0",
};

const footerNoteStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#6b7280",
  lineHeight: "1.6",
  margin: "0 0 16px 0",
};

const signatureStyle: React.CSSProperties = {
  fontSize: "15px",
  color: "#374151",
  lineHeight: "1.6",
  marginTop: "24px",
};

export default ContactClinicInquiry;
