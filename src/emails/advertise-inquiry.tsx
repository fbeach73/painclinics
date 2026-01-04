import * as React from "react";
import { Text, Section, Hr } from "@react-email/components";
import { EmailCard, EmailCardTitle, EmailDataRow } from "./components/email-card";
import { EmailLayout } from "./components/email-layout";

export interface AdvertiseInquiryProps {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string | undefined;
  companyType: string;
  interestArea: string;
  budget?: string | undefined;
  message?: string | undefined;
  submittedAt: string;
}

export function AdvertiseInquiry({
  companyName,
  contactName,
  email,
  phone,
  companyType,
  interestArea,
  budget,
  message,
  submittedAt,
}: AdvertiseInquiryProps) {
  return (
    <EmailLayout previewText={`New advertising inquiry from ${companyName}`}>
      <Text style={headingStyle}>New Advertising Inquiry</Text>

      <Text style={paragraphStyle}>
        You have received a new advertising inquiry through the Pain Clinics website.
      </Text>

      <EmailCard variant="highlight">
        <EmailCardTitle>Contact Information</EmailCardTitle>
        <Section style={dataRowsStyle}>
          <EmailDataRow label="Company" value={companyName} />
          <EmailDataRow label="Contact Name" value={contactName} />
          <EmailDataRow label="Email" value={email} />
          {phone && <EmailDataRow label="Phone" value={phone} />}
        </Section>
      </EmailCard>

      <EmailCard variant="info">
        <EmailCardTitle>Advertising Interest</EmailCardTitle>
        <Section style={dataRowsStyle}>
          <EmailDataRow label="Company Type" value={companyType} />
          <EmailDataRow label="Interest Area" value={interestArea} />
          {budget && <EmailDataRow label="Budget Range" value={budget} />}
        </Section>
        {message && <Text style={messageStyle}>{message}</Text>}
      </EmailCard>

      <Hr style={hrStyle} />

      <Text style={footerNoteStyle}>
        This inquiry was submitted on {submittedAt} through the Pain Clinics
        advertising page. Please respond to {email} directly.
      </Text>

      <Text style={signatureStyle}>
        Best regards,
        <br />
        Painclinics.com Listings
      </Text>
    </EmailLayout>
  );
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

const messageStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#4b5563",
  margin: "12px 0 0 0",
  lineHeight: "1.6",
  whiteSpace: "pre-wrap",
  backgroundColor: "#f9fafb",
  padding: "12px",
  borderRadius: "6px",
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

export default AdvertiseInquiry;
