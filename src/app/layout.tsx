import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { VercelAnalytics } from "@/components/analytics/vercel-analytics";
import "./globals.css";
import { PageTracker } from "@/components/analytics/page-tracker";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";

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
        {/* Preconnect hints for faster font loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-ZGCKNRS');`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-ZGCKNRS"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* Google AdSense - Auto Ads */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5028121986513144"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
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
          <PageTracker />
        </ThemeProvider>
        <VercelAnalytics />
      </body>
    </html>
  );
}
