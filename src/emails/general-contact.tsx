import * as React from "react";
import { Text, Section, Hr } from "@react-email/components";
import { EmailCard, EmailCardTitle, EmailDataRow } from "./components/email-card";
import { EmailLayout } from "./components/email-layout";

export interface GeneralContactProps {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
  submittedAt: string;
}

export function GeneralContact({
  firstName,
  lastName,
  email,
  subject,
  message,
  submittedAt,
}: GeneralContactProps) {
  return (
    <EmailLayout previewText={`New contact form submission: ${subject}`}>
      <Text style={headingStyle}>New Contact Form Submission</Text>

      <Text style={paragraphStyle}>
        You have received a new message through the Pain Clinics contact form.
      </Text>

      <EmailCard variant="highlight">
        <EmailCardTitle>Contact Information</EmailCardTitle>
        <Section style={dataRowsStyle}>
          <EmailDataRow label="Name" value={`${firstName} ${lastName}`} />
          <EmailDataRow label="Email" value={email} />
        </Section>
      </EmailCard>

      <EmailCard variant="info">
        <EmailCardTitle>Message Details</EmailCardTitle>
        <Section style={dataRowsStyle}>
          <EmailDataRow label="Subject" value={subject} />
        </Section>
        <Text style={messageStyle}>{message}</Text>
      </EmailCard>

      <Hr style={hrStyle} />

      <Text style={footerNoteStyle}>
        This message was submitted on {submittedAt} through the Pain Clinics
        website contact form. Please respond to {email} directly.
      </Text>

      <Text style={signatureStyle}>
        Best regards,
        <br />
        Pain Clinics Directory
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

export default GeneralContact;
