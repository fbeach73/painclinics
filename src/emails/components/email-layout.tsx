import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
} from "@react-email/components";
import * as React from "react";

interface EmailLayoutProps {
  previewText: string;
  unsubscribeUrl?: string;
  children: React.ReactNode;
}

export function EmailLayout({
  previewText,
  unsubscribeUrl,
  children,
}: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={logoStyle}>Pain Clinics Directory</Text>
          </Section>

          {/* Main Content */}
          <Section style={contentStyle}>{children}</Section>

          {/* Footer */}
          <Hr style={hrStyle} />
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              Pain Clinics Directory
              <br />
              Connecting patients with quality pain management care
            </Text>
            {unsubscribeUrl && (
              <Link href={unsubscribeUrl} style={unsubscribeLinkStyle}>
                Unsubscribe from marketing emails
              </Link>
            )}
            <Text style={copyrightStyle}>
              &copy; {new Date().getFullYear()} Pain Clinics Directory. All
              rights reserved.
            </Text>
            <Text style={footerNoteStyle}>
              You are receiving this email because of your activity on Pain
              Clinics Directory.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const bodyStyle: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: 0,
  padding: 0,
};

const containerStyle: React.CSSProperties = {
  maxWidth: "600px",
  margin: "0 auto",
  padding: "20px",
};

const headerStyle: React.CSSProperties = {
  backgroundColor: "#2563eb",
  padding: "24px 20px",
  borderRadius: "8px 8px 0 0",
  textAlign: "center" as const,
};

const logoStyle: React.CSSProperties = {
  color: "white",
  fontSize: "24px",
  fontWeight: "bold",
  margin: 0,
};

const contentStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  padding: "32px 24px",
  borderRadius: "0 0 8px 8px",
};

const hrStyle: React.CSSProperties = {
  borderColor: "#e5e7eb",
  borderWidth: "1px",
  borderStyle: "solid",
  margin: "24px 0",
};

const footerStyle: React.CSSProperties = {
  textAlign: "center" as const,
  padding: "0 20px",
};

const footerTextStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#6b7280",
  lineHeight: "1.6",
  margin: "0 0 12px 0",
};

const unsubscribeLinkStyle: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "12px",
  textDecoration: "underline",
};

const copyrightStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#9ca3af",
  marginTop: "16px",
  marginBottom: "8px",
};

const footerNoteStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#9ca3af",
  margin: 0,
};

export default EmailLayout;
