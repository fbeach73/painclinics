import * as React from "react";
import { Text, Section } from "@react-email/components";
import { EmailButton } from "./components/email-button";
import { EmailCard, EmailCardTitle, EmailCardText } from "./components/email-card";
import { EmailLayout } from "./components/email-layout";

interface PasswordResetProps {
  resetUrl: string;
  expiresIn?: string | undefined;
}

export function PasswordReset({
  resetUrl,
  expiresIn = "1 hour",
}: PasswordResetProps) {
  return (
    <EmailLayout
      previewText="Reset your Painclinics.com Listings password"
    >
      <Text style={headingStyle}>Reset Your Password</Text>

      <Text style={paragraphStyle}>
        We received a request to reset your password for your Pain Clinics
        Directory account. Click the button below to create a new password.
      </Text>

      <Section style={buttonContainerStyle}>
        <EmailButton href={resetUrl} variant="primary">
          Reset Password
        </EmailButton>
      </Section>

      <EmailCard variant="warning">
        <EmailCardTitle>Link Expires Soon</EmailCardTitle>
        <EmailCardText>
          This password reset link will expire in {expiresIn}. If you don&apos;t
          reset your password within this time, you&apos;ll need to request a new
          link.
        </EmailCardText>
      </EmailCard>

      <Text style={paragraphStyle}>
        If you didn&apos;t request a password reset, you can safely ignore this
        email. Your password will remain unchanged.
      </Text>

      <Text style={paragraphStyle}>
        For security reasons, we recommend:
      </Text>
      <Text style={listStyle}>
        • Using a strong, unique password
        {"\n"}• Not sharing your password with anyone
        {"\n"}• Enabling two-factor authentication if available
      </Text>

      <Text style={paragraphStyle}>
        If you&apos;re having trouble clicking the button, copy and paste this URL
        into your browser:
      </Text>
      <Text style={urlStyle}>{resetUrl}</Text>

      <Text style={signatureStyle}>
        Stay secure,
        <br />
        The Painclinics.com Listings Team
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

const listStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#4b5563",
  lineHeight: "1.8",
  margin: "0 0 16px 0",
  paddingLeft: "8px",
  whiteSpace: "pre-line",
};

const urlStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#6b7280",
  wordBreak: "break-all",
  backgroundColor: "#f3f4f6",
  padding: "12px",
  borderRadius: "4px",
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

export default PasswordReset;
