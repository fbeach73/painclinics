import type { NextConfig } from "next";

// Blog post redirects from old WordPress URLs (/{slug}) to new Next.js URLs (/blog/{slug})
const blogRedirects = [
  "abdominal-pain",
  "acl-injuries-and-knee-pain",
  "alcoholic-neuropathy",
  "alcoholic-neuropathy-2",
  "arthritis-in-the-knee",
  "autonomic-neuropathy",
  "autonomic-neuropathy-2",
  "avoid-knee-pain-during-workouts",
  "back-pain",
  "benefits-of-cbd-for-menstrual-cramps",
  "best-injections-for-back-pain-5-critical-decisions-to-make",
  "best-shoes-for-knee-pain-relief",
  "bursitis-of-the-knee",
  "carpal-tunnel-syndrome",
  "carpal-tunnel-syndrome-2",
  "cbd-education",
  "cbd-for-chronic-back-pain-relief",
  "cbd-for-chronic-back-pain-relief-2024",
  "cbd-for-chronic-back-pain-relief-3",
  "cbd-for-post-surgery-pain-recovery",
  "cbd-for-post-surgery-pain-recovery-2",
  "cbd-for-post-surgery-pain-recovery-3",
  "cbd-in-recovery",
  "cbd-oil-benefits-for-migraines",
  "cbd-oil-benefits-for-migraines-2",
  "cbd-oil-benefits-for-migraines-3",
  "cbd-vs-traditional-pain-medications",
  "cbd-vs-traditional-pain-medications-2",
  "chemotherapy-induced-neuropathy",
  "chemotherapy-induced-neuropathy-2",
  "chronic-diseases",
  "chronic-pain-apps",
  "chronic-pain-types",
  "clinical-trial-associate-jobs",
  "clinical-trial-coordinator",
  "cycling-and-knee-pain",
  "diabetic-neuropathy",
  "diabetic-neuropathy-2",
  "diet-and-knee-pain",
  "entrapment-neuropathy",
  "entrapment-neuropathy-2",
  "ergonomic-adjustments-for-knee-pain",
  "exploring-cbd-for-fibromyalgia-relief",
  "exploring-cbd-for-fibromyalgia-relief-2",
  "exploring-cbd-for-fibromyalgia-relief-3",
  "failed-back-surgery",
  "femoral-neuropathy",
  "femoral-neuropathy-2",
  "fibromyalgia",
  "focal-neuropathy",
  "focal-neuropathy-2",
  "guillain-barre-syndrome",
  "guillain-barre-syndrome-2",
  "hereditary-neuropathies",
  "hereditary-neuropathies-2",
  "how-to-sit-to-avoid-knee-pain",
  "how-to-stretch-to-avoid-knee-pain",
  "idiopathic-neuropathy",
  "idiopathic-neuropathy-2",
  "injections-for-knee-pain-options",
  "injury",
  "interventional-pain-procedures",
  "is-cbd-effective-for-arthritis-pain",
  "is-cbd-effective-for-arthritis-pain-2",
  "is-cbd-effective-for-arthritis-pain-3",
  "it-band-syndrome-knee-pain",
  "knee-pain-2",
  "knee-pain-after-running",
  "knee-pain-during-pregnancy",
  "knee-pain-in-cold-weather",
  "knee-pain-in-older-adults",
  "knee-pain-relief-products",
  "knee-pain-treatment-at-home",
  "knee-pain-while-driving",
  "knee-pain-while-driving-2",
  "knee-strengthening-exercises",
  "labor",
  "maintaining-your-health-as-you-age",
  "mastering-post-operative-pain",
  "mattress-sleep-position-knee-pain",
  "meniscus-tears-knee-pain",
  "migraine-headache-prequels",
  "myofascial-pain-syndrome",
  "natural-remedies-for-knee-pain",
  "nonsurgical-procedures",
  "obesity-and-knee-pain",
  "opioid-abuse",
  "opioid-treatment",
  "otc-medications-for-knee-pain",
  "pain-center-of-west-virginia",
  "pain-management-clinics",
  "painful-treatments",
  "patellar-tendonitis-explained",
  "peripheral-neuropathy",
  "peripheral-neuropathy-2",
  "pethidine-pain-relief",
  "physical-therapy",
  "physical-therapy-exercises-for-knee-pain",
  "poor-posture-and-knee-pain",
  "post-op",
  "postherpetic-neuralgia",
  "postherpetic-neuralgia-2",
  "ppd-las-vegas",
  "prevent-knee-pain-during-long-drives",
  "proximal-neuropathy",
  "proximal-neuropathy-2",
  "radial-neuropathy",
  "radial-neuropathy-2",
  "reduce-back-pain",
  "rheumatoid-arthritis-symptoms-and-treatments",
  "shoulder-joint",
  "snris-neuropathic-pain-management",
  "the-ultimate-guide-to-knee-pain",
  "top-exercises-to-strengthen-your-knees",
  "trigeminal-neuralgia",
  "trigeminal-neuralgia-2",
  "types-of-cbd-products",
  "types-of-pain",
  "ulnar-neuropathy",
  "ulnar-neuropathy-2",
  "understanding-chronic-knee-pain",
  "understanding-knee-braces",
  "using-cbd-for-neuropathic-pain-management",
  "using-cbd-for-neuropathic-pain-management-2",
  "using-cbd-for-neuropathic-pain-management-3",
  "visual-analog-scale",
  "what-are-opioids",
  "when-is-knee-surgery-necessary",
  "when-to-see-a-doctor-for-knee-pain",
  "why-does-my-knee-hurt-common-causes",
  "youth-sports",
].map((slug) => ({
  source: `/${slug}`,
  destination: `/blog/${slug}`,
  permanent: true,
}));

const nextConfig: NextConfig = {
  // Allow larger body sizes for file uploads (50MB)
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.ggpht.com",
      },
      {
        protocol: "https",
        hostname: "streetviewpixels-pa.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "maps.googleapis.com",
        pathname: "/maps/api/place/photo/**",
      },
      {
        protocol: "https",
        hostname: "painclinics.com",
      },
    ],
  },

  // Enable compression
  compress: true,

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
    ];
  },

  // 301 redirects from old WordPress blog URLs to new /blog/ paths
  async redirects() {
    return [
      ...blogRedirects,

      // ===========================================
      // Old WordPress URL structure redirects
      // ===========================================

      // Old overview page to homepage
      {
        source: "/pain-clinics-the-complete-overview",
        destination: "/",
        permanent: true,
      },

      // Old /managing-pain page to treatment options
      {
        source: "/managing-pain",
        destination: "/treatment-options",
        permanent: true,
      },

      // Old /state/{abbrev} URLs to new /pain-management/{abbrev}
      {
        source: "/state/:state",
        destination: "/pain-management/:state",
        permanent: true,
      },
      {
        source: "/state/:state/",
        destination: "/pain-management/:state",
        permanent: true,
      },

      // Old /city-name/{city} URLs - redirect to homepage (can't map without state)
      {
        source: "/city-name/:path*",
        destination: "/",
        permanent: true,
      },

      // Old /clinic-type/{type} URLs - redirect to homepage
      {
        source: "/clinic-type/:path*",
        destination: "/",
        permanent: true,
      },

      // Old /tag/{tag}/ URLs (with trailing slash) to /blog/tag/{tag}
      {
        source: "/tag/:tag/",
        destination: "/blog/tag/:tag",
        permanent: true,
      },
      {
        source: "/tag/:tag",
        destination: "/blog/tag/:tag",
        permanent: true,
      },

      // Old /glossary/ and /glossary-cat/ pages - redirect to homepage
      {
        source: "/glossary/:path*",
        destination: "/",
        permanent: true,
      },
      {
        source: "/glossary-cat/:path*",
        destination: "/",
        permanent: true,
      },

      // Old /painful-conditions/ pages to treatment options
      {
        source: "/painful-conditions/:path*",
        destination: "/treatment-options",
        permanent: true,
      },

      // Old static pages
      {
        source: "/contact-us",
        destination: "/",
        permanent: true,
      },
      {
        source: "/cbd-pain-relief-education",
        destination: "/blog",
        permanent: true,
      },
      {
        source: "/paid-clinical-trials",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
