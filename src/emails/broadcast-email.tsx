import * as React from "react";
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

export interface BroadcastEmailProps {
  htmlContent: string;
  previewText?: string | undefined;
  unsubscribeUrl: string;
}

export function BroadcastEmail({
  htmlContent,
  previewText,
  unsubscribeUrl,
}: BroadcastEmailProps) {
  return (
    <Html>
      <Head>
        <style>
          {`
            /* Reset styles for email clients */
            body, table, td, div, p, a {
              -webkit-text-size-adjust: 100%;
              -ms-text-size-adjust: 100%;
            }
            table, td {
              mso-table-lspace: 0pt;
              mso-table-rspace: 0pt;
            }
            img {
              -ms-interpolation-mode: bicubic;
            }
            /* Content styles */
            .broadcast-content {
              font-size: 15px;
              color: #374151;
              line-height: 1.6;
            }
            .broadcast-content h1 {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
              margin: 0 0 16px 0;
            }
            .broadcast-content h2 {
              font-size: 20px;
              font-weight: bold;
              color: #1f2937;
              margin: 0 0 12px 0;
            }
            .broadcast-content h3 {
              font-size: 16px;
              font-weight: bold;
              color: #1f2937;
              margin: 0 0 8px 0;
            }
            .broadcast-content p {
              margin: 0 0 16px 0;
            }
            .broadcast-content ul, .broadcast-content ol {
              margin: 0 0 16px 0;
              padding-left: 24px;
            }
            .broadcast-content li {
              margin-bottom: 8px;
            }
            .broadcast-content a {
              color: #2563eb;
              text-decoration: underline;
            }
            .broadcast-content blockquote {
              margin: 16px 0;
              padding: 12px 16px;
              background-color: #f3f4f6;
              border-left: 4px solid #2563eb;
            }
            .broadcast-content img {
              max-width: 100%;
              height: auto;
            }
            .broadcast-content hr {
              border: none;
              border-top: 1px solid #e5e7eb;
              margin: 24px 0;
            }
          `}
        </style>
      </Head>
      {previewText && <Preview>{previewText}</Preview>}
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Link href="https://painclinics.com" style={logoStyle}>Painclinics.com</Link>
          </Section>

          {/* Main Content - Dynamic HTML from Tiptap editor */}
          <Section style={contentStyle}>
            <div
              className="broadcast-content"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </Section>

          {/* Footer */}
          <Hr style={hrStyle} />
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              Painclinics.com Listings
              <br />
              Connecting patients with quality pain management care
            </Text>
            <Text style={unsubscribeTextStyle}>
              You&apos;re receiving this because your clinic is listed on Painclinics.com Listings.
            </Text>
            <Link href={unsubscribeUrl} style={unsubscribeLinkStyle}>
              Unsubscribe from marketing emails
            </Link>
            <Text style={copyrightStyle}>
              &copy; {new Date().getFullYear()} Painclinics.com Listings. All
              rights reserved.
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
  padding: "20px 8px",
};

const headerStyle: React.CSSProperties = {
  backgroundColor: "#2563eb",
  padding: "24px 16px",
  borderRadius: "8px 8px 0 0",
  textAlign: "center" as const,
};

const logoStyle: React.CSSProperties = {
  color: "white",
  fontSize: "24px",
  fontWeight: "bold",
  margin: 0,
  textDecoration: "none",
};

const contentStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  padding: "24px 16px",
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
  padding: "0 12px",
};

const footerTextStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#6b7280",
  lineHeight: "1.6",
  margin: "0 0 12px 0",
};

const unsubscribeTextStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#9ca3af",
  margin: "0 0 8px 0",
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

export default BroadcastEmail;
