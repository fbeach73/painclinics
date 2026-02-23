import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DeferredAdSense } from "@/components/ads/deferred-adsense";
import { DeferredGTM } from "@/components/analytics/deferred-gtm";
import { PageTracker } from "@/components/analytics/page-tracker";
import { VercelAnalytics } from "@/components/analytics/vercel-analytics";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { StickyAnchorAd } from "@/components/ads/StickyAnchorAd";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Pain Management Near You: Painclinics.com - \u2695\uFE0F Local Pain Clinics",
    template: "%s | PainClinics.com",
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
    siteName: "PainClinics.com",
    title: "Pain Management Near You: Painclinics.com - \u2695\uFE0F Local Pain Clinics",
    description:
      "Find verified pain management clinics across the United States. Browse ratings, read patient reviews, and schedule appointments.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pain Management Near You: Painclinics.com - \u2695\uFE0F Local Pain Clinics",
    description:
      "Find verified pain management clinics across the United States. Browse ratings, read patient reviews, and schedule appointments.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect hints for faster resource loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://events.mapbox.com" />
        <link rel="preconnect" href="https://api.mapbox.com" />
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        {/* GTM and AdSense loaded via deferred components in body for better PageSpeed */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* GTM noscript fallback - iframe hidden for non-JS browsers */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-ZGCKNRS"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange
        >
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <SiteFooter />
          </div>
          <Toaster richColors position="top-right" />
          <StickyAnchorAd />
          <PageTracker />
        </ThemeProvider>
        <VercelAnalytics />
        {/* Deferred third-party scripts for better PageSpeed scores */}
        <DeferredGTM gtmId="GTM-ZGCKNRS" delayMs={2000} />
        {/* AdSense loads on scroll (or after 8s fallback) to improve PageSpeed */}
        <DeferredAdSense clientId="ca-pub-5028121986513144" strategy="scroll" />
      </body>
    </html>
  );
}
