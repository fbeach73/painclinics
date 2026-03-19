import * as React from "react";
import { Text, Section, Hr } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";

export interface ConsultPdfPlanProps {
  firstName: string;
  condition: string;
  planContent: string;
  unsubscribeUrl?: string | undefined;
}

/**
 * Converts a simple subset of markdown to inline HTML-safe React nodes.
 * Handles: # headings, **bold**, bullet lists (- or *), and paragraphs.
 */
function renderMarkdown(content: string): React.ReactNode[] {
  const lines = content.split("\n");
  const nodes: React.ReactNode[] = [];
  let key = 0;

  function bold(text: string): React.ReactNode {
    const parts: React.ReactNode[] = [];
    const regex = /\*\*(.*?)\*\*/g;
    let last = 0;
    let match: RegExpExecArray | null;
    let k = 0;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > last) parts.push(text.slice(last, match.index));
      parts.push(<strong key={k++}>{match[1]}</strong>);
      last = match.index + match[0].length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : <>{parts}</>;
  }

  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";

    // H1
    if (line.startsWith("# ")) {
      nodes.push(
        <Text key={key++} style={h1Style}>{line.slice(2)}</Text>
      );
      i++;
      continue;
    }

    // H2
    if (line.startsWith("## ")) {
      nodes.push(
        <Text key={key++} style={h2Style}>{line.slice(3)}</Text>
      );
      i++;
      continue;
    }

    // H3
    if (line.startsWith("### ")) {
      nodes.push(
        <Text key={key++} style={h3Style}>{line.slice(4)}</Text>
      );
      i++;
      continue;
    }

    // Bullet list item
    if (/^[-*]\s/.test(line)) {
      const bullets: React.ReactNode[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i] ?? "")) {
        bullets.push(
          <li key={i} style={liStyle}>{bold((lines[i] ?? "").slice(2))}</li>
        );
        i++;
      }
      nodes.push(
        <ul key={key++} style={ulStyle}>{bullets}</ul>
      );
      continue;
    }

    // Bold-prefixed line (e.g., "**Week 1:**")
    if (line.startsWith("**") && line.trim()) {
      nodes.push(
        <Text key={key++} style={paragraphStyle}>{bold(line)}</Text>
      );
      i++;
      continue;
    }

    // Empty line — skip
    if (!line.trim()) {
      i++;
      continue;
    }

    // Regular paragraph
    nodes.push(
      <Text key={key++} style={paragraphStyle}>{bold(line)}</Text>
    );
    i++;
  }

  return nodes;
}

export function ConsultPdfPlan({
  firstName,
  condition,
  planContent,
  unsubscribeUrl,
}: ConsultPdfPlanProps) {
  const deliveredDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <EmailLayout
      previewText={`Your Personalized Pain Management Plan — ${condition}`}
      {...(unsubscribeUrl ? { unsubscribeUrl } : {})}
    >
      <Text style={headingStyle}>Your Personalized Pain Management Plan</Text>

      <Text style={subheadingStyle}>
        Prepared exclusively for {firstName} · {condition}
      </Text>

      <Section style={introBannerStyle}>
        <Text style={introBannerTextStyle}>
          Based on your PainConsult AI session, our medical writing team has prepared this
          comprehensive, evidence-based plan tailored to your condition. Print it out or save
          it as a PDF to bring to your specialist appointment.
        </Text>
      </Section>

      <Hr style={hrStyle} />

      {/* Render AI-generated plan */}
      <Section style={planBodyStyle}>
        {renderMarkdown(planContent)}
      </Section>

      <Hr style={hrStyle} />

      <Text style={disclaimerStyle}>
        <em>
          This plan was generated based on your PainConsult AI consultation on {deliveredDate}.
          It is for informational purposes only and does not constitute medical advice. Always
          consult with a qualified healthcare provider before starting any new treatment protocol.
          In case of emergency, call 911 immediately.
        </em>
      </Text>
    </EmailLayout>
  );
}

const headingStyle: React.CSSProperties = {
  fontSize: "26px",
  fontWeight: "bold",
  color: "#1e3a5f",
  margin: "0 0 6px 0",
  lineHeight: "1.3",
};

const subheadingStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "0 0 20px 0",
};

const introBannerStyle: React.CSSProperties = {
  backgroundColor: "#eff6ff",
  borderLeft: "4px solid #2563eb",
  padding: "14px 16px",
  borderRadius: "0 6px 6px 0",
  marginBottom: "20px",
};

const introBannerTextStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#1e40af",
  lineHeight: "1.6",
  margin: 0,
};

const planBodyStyle: React.CSSProperties = {
  padding: "0",
};

const h1Style: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: "bold",
  color: "#1e3a5f",
  margin: "24px 0 8px 0",
  borderBottom: "2px solid #dbeafe",
  paddingBottom: "6px",
};

const h2Style: React.CSSProperties = {
  fontSize: "17px",
  fontWeight: "bold",
  color: "#1e40af",
  margin: "18px 0 6px 0",
};

const h3Style: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: "bold",
  color: "#374151",
  margin: "14px 0 4px 0",
};

const paragraphStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#374151",
  lineHeight: "1.65",
  margin: "0 0 10px 0",
};

const ulStyle: React.CSSProperties = {
  margin: "4px 0 12px 0",
  paddingLeft: "20px",
};

const liStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#374151",
  lineHeight: "1.65",
  marginBottom: "4px",
};

const hrStyle: React.CSSProperties = {
  borderColor: "#e5e7eb",
  borderWidth: "1px",
  borderStyle: "solid",
  margin: "24px 0",
};

const disclaimerStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#9ca3af",
  lineHeight: "1.6",
  margin: "0 0 16px 0",
};

export default ConsultPdfPlan;
