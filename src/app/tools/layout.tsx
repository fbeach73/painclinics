import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Free AI Tools for Pain Clinics",
    default: "Free AI Tools for Pain Clinics | PainClinics.com",
  },
  description:
    "Free AI-powered tools built specifically for pain management clinics. Generate patient education content, social media posts, and more.",
};

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
