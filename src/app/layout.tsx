import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Pain Clinics Directory - Find Pain Management Near You",
    template: "%s | Pain Clinics Directory",
  },
  description:
    "Find verified pain management clinics across the United States. Browse ratings, read patient reviews, and schedule appointments.",
  keywords: [
    "pain management",
    "pain clinic",
    "chronic pain treatment",
    "pain specialist",
    "pain doctor near me",
    "pain management doctor",
    "back pain treatment",
    "pain relief clinic",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Pain Clinics Directory",
    title: "Pain Clinics Directory - Find Pain Management Near You",
    description:
      "Find verified pain management clinics across the United States. Browse ratings, read patient reviews, and schedule appointments.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pain Clinics Directory - Find Pain Management Near You",
    description:
      "Find verified pain management clinics across the United States. Browse ratings, read patient reviews, and schedule appointments.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

// JSON-LD structured data for SEO (WebSite and Organization schemas are on homepage)
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Pain Clinics Directory",
  description:
    "Find verified pain management clinics across the United States. Browse ratings, read patient reviews, and schedule appointments.",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://painclinics.com",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SiteHeader />
          <main id="main-content">{children}</main>
          <SiteFooter />
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
