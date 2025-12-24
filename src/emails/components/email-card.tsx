import * as React from "react";
import { Section, Text, Row, Column } from "@react-email/components";

interface EmailCardProps {
  children: React.ReactNode;
  variant?: "default" | "highlight" | "warning" | "success" | "info";
}

export function EmailCard({ children, variant = "default" }: EmailCardProps) {
  const style = getCardStyle(variant);

  return <Section style={style}>{children}</Section>;
}

function getCardStyle(
  variant: "default" | "highlight" | "warning" | "success" | "info"
): React.CSSProperties {
  const baseStyle: React.CSSProperties = {
    padding: "16px 12px", // Reduced padding for mobile
    borderRadius: "8px",
    marginBottom: "16px",
  };

  switch (variant) {
    case "highlight":
      return {
        ...baseStyle,
        backgroundColor: "#eff6ff",
        border: "1px solid #bfdbfe",
      };
    case "warning":
      return {
        ...baseStyle,
        backgroundColor: "#fffbeb",
        border: "1px solid #fcd34d",
      };
    case "success":
      return {
        ...baseStyle,
        backgroundColor: "#f0fdf4",
        border: "1px solid #86efac",
      };
    case "info":
      return {
        ...baseStyle,
        backgroundColor: "#f0f9ff",
        border: "1px solid #7dd3fc",
      };
    case "default":
    default:
      return {
        ...baseStyle,
        backgroundColor: "#f9fafb",
        border: "1px solid #e5e7eb",
      };
  }
}

// Card Title Component
interface EmailCardTitleProps {
  children: React.ReactNode;
}

export function EmailCardTitle({ children }: EmailCardTitleProps) {
  return <Text style={titleStyle}>{children}</Text>;
}

const titleStyle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#111827",
  margin: "0 0 8px 0",
};

// Card Text Component
interface EmailCardTextProps {
  children: React.ReactNode;
}

export function EmailCardText({ children }: EmailCardTextProps) {
  return <Text style={textStyle}>{children}</Text>;
}

const textStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#4b5563",
  margin: 0,
  lineHeight: "1.5",
};

// Data Row Component for key-value displays
interface EmailDataRowProps {
  label: string;
  value: string;
}

export function EmailDataRow({ label, value }: EmailDataRowProps) {
  return (
    <Row style={dataRowStyle}>
      <Column style={labelColumnStyle}>
        <Text style={labelStyle}>{label}</Text>
      </Column>
      <Column style={valueColumnStyle}>
        <Text style={valueStyle}>{value}</Text>
      </Column>
    </Row>
  );
}

const dataRowStyle: React.CSSProperties = {
  marginBottom: "8px",
};

const labelColumnStyle: React.CSSProperties = {
  width: "30%", // Narrower label for more value space on mobile
};

const valueColumnStyle: React.CSSProperties = {
  width: "70%", // More space for values/links on mobile
};

const labelStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#6b7280",
  margin: 0,
};

const valueStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#111827",
  fontWeight: "500",
  margin: 0,
};

export default EmailCard;
