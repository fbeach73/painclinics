import * as React from "react";
import { Text, Section, Hr } from "@react-email/components";
import { EmailCard, EmailCardTitle, EmailDataRow } from "./components/email-card";
import { EmailLayout } from "./components/email-layout";

export interface LeadFollowUpEmailProps {
  clinicName: string;
  clinicCity: string;
  clinicState: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  submissionDate: string;
  customMessage: string;
}

export function LeadFollowUp({
  clinicName,
  clinicCity,
  clinicState,
  patientName,
  patientEmail,
  patientPhone,
  submissionDate,
  customMessage,
}: LeadFollowUpEmailProps) {
  return (
    <EmailLayout previewText={`Follow-up: Patient inquiry for ${clinicName}`}>
      <Text style={headingStyle}>Follow-up: Patient Inquiry</Text>

      <Text style={paragraphStyle}>
        Hello <strong>{clinicName}</strong>,
      </Text>

      <Text style={paragraphStyle}>
        We are following up regarding a patient inquiry submitted through
        PainClinics.com on <strong>{submissionDate}</strong>.
      </Text>

      <EmailCard variant="warning">
        <EmailCardTitle>Message from PainClinics.com</EmailCardTitle>
        <Text style={messageStyle}>{customMessage}</Text>
      </EmailCard>

      <EmailCard variant="info">
        <EmailCardTitle>Original Inquiry Details</EmailCardTitle>
        <Section style={dataRowsStyle}>
          <EmailDataRow label="Patient Name" value={patientName} />
          <EmailDataRow label="Email" value={patientEmail} />
          <EmailDataRow label="Phone" value={patientPhone} />
          <EmailDataRow label="Submitted" value={submissionDate} />
        </Section>
      </EmailCard>

      <Hr style={hrStyle} />

      <Text style={footerNoteStyle}>
        If you have already contacted this patient, please disregard this message.
        If you need any assistance or have questions, please reply to this email.
      </Text>

      <Text style={footerNoteStyle}>
        This follow-up was sent regarding a patient inquiry for {clinicName} in{" "}
        {clinicCity}, {clinicState}.
      </Text>

      <Text style={signatureStyle}>
        Best regards,
        <br />
        The PainClinics.com Team
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
  fontSize: "15px",
  color: "#374151",
  margin: 0,
  lineHeight: "1.6",
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

export default LeadFollowUp;
