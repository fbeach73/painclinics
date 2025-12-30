import * as React from "react";
import { Text, Section, Hr } from "@react-email/components";
import { EmailCard, EmailCardTitle, EmailDataRow } from "./components/email-card";
import { EmailLayout } from "./components/email-layout";

export interface SubmitClinicProps {
  clinicName: string;
  contactName: string;
  contactEmail: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  website?: string | undefined;
  services?: string | undefined;
  additionalInfo?: string | undefined;
  submittedAt: string;
}

export function SubmitClinic({
  clinicName,
  contactName,
  contactEmail,
  address,
  city,
  state,
  zip,
  phone,
  website,
  services,
  additionalInfo,
  submittedAt,
}: SubmitClinicProps) {
  const fullAddress = `${address}, ${city}, ${state} ${zip}`;

  return (
    <EmailLayout previewText={`New clinic submission: ${clinicName}`}>
      <Text style={headingStyle}>New Clinic Submission</Text>

      <Text style={paragraphStyle}>
        A new clinic has been submitted for review through the Pain Clinics directory.
      </Text>

      <EmailCard variant="highlight">
        <EmailCardTitle>Clinic Information</EmailCardTitle>
        <Section style={dataRowsStyle}>
          <EmailDataRow label="Clinic Name" value={clinicName} />
          <EmailDataRow label="Address" value={fullAddress} />
          <EmailDataRow label="Phone" value={phone} />
          {website && <EmailDataRow label="Website" value={website} />}
        </Section>
      </EmailCard>

      <EmailCard variant="info">
        <EmailCardTitle>Contact Information</EmailCardTitle>
        <Section style={dataRowsStyle}>
          <EmailDataRow label="Contact Name" value={contactName} />
          <EmailDataRow label="Email" value={contactEmail} />
        </Section>
      </EmailCard>

      {(services || additionalInfo) && (
        <EmailCard>
          <EmailCardTitle>Additional Details</EmailCardTitle>
          {services && (
            <>
              <Text style={labelStyle}>Services Offered:</Text>
              <Text style={messageStyle}>{services}</Text>
            </>
          )}
          {additionalInfo && (
            <>
              <Text style={labelStyle}>Additional Information:</Text>
              <Text style={messageStyle}>{additionalInfo}</Text>
            </>
          )}
        </EmailCard>
      )}

      <Hr style={hrStyle} />

      <Text style={footerNoteStyle}>
        This clinic was submitted on {submittedAt} through the Pain Clinics
        website. Please review and verify the information before adding to the directory.
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

const labelStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#374151",
  margin: "12px 0 4px 0",
};

const messageStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#4b5563",
  margin: "0",
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

export default SubmitClinic;
