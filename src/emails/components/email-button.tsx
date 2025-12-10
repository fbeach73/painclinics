import { Button } from "@react-email/components";
import * as React from "react";

interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "success" | "danger";
}

export function EmailButton({
  href,
  children,
  variant = "primary",
}: EmailButtonProps) {
  const style = getButtonStyle(variant);

  return (
    <Button href={href} style={style}>
      {children}
    </Button>
  );
}

function getButtonStyle(
  variant: "primary" | "secondary" | "success" | "danger"
): React.CSSProperties {
  const baseStyle: React.CSSProperties = {
    padding: "12px 24px",
    borderRadius: "6px",
    textDecoration: "none",
    display: "inline-block",
    fontWeight: "600",
    fontSize: "14px",
    textAlign: "center" as const,
    cursor: "pointer",
  };

  switch (variant) {
    case "primary":
      return {
        ...baseStyle,
        backgroundColor: "#2563eb",
        color: "#ffffff",
      };
    case "secondary":
      return {
        ...baseStyle,
        backgroundColor: "#f3f4f6",
        color: "#1f2937",
        border: "1px solid #d1d5db",
      };
    case "success":
      return {
        ...baseStyle,
        backgroundColor: "#16a34a",
        color: "#ffffff",
      };
    case "danger":
      return {
        ...baseStyle,
        backgroundColor: "#dc2626",
        color: "#ffffff",
      };
    default:
      return {
        ...baseStyle,
        backgroundColor: "#2563eb",
        color: "#ffffff",
      };
  }
}

export default EmailButton;
