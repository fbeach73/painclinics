import type { NextConfig } from "next";

// Build cache buster: 2026-01-03-v1 (forces full static regeneration)

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
    // Optimize CSS to reduce render-blocking
    optimizeCss: true,
    // Limit concurrent static page generation to avoid Neon DB OOM
    staticGenerationMaxConcurrency: 8,
  },

  // Remove console.log in production for smaller bundles
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
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
        hostname: "images.unsplash.com",
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

      // Author pages to about
      {
        source: "/author/:author",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/author/:author/",
        destination: "/about",
        permanent: true,
      },

      // About page variations
      {
        source: "/about-us",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/about-us/",
        destination: "/about",
        permanent: true,
      },

      // Old WordPress listing pages to clinics
      {
        source: "/pain-management-clinics-mega-listing",
        destination: "/clinics",
        permanent: true,
      },
      {
        source: "/pain-clinics-experts-2024",
        destination: "/clinics",
        permanent: true,
      },
      {
        source: "/pain-clinics-near-me",
        destination: "/clinics",
        permanent: true,
      },
      {
        source: "/pain-clinics-near-me-sort",
        destination: "/clinics",
        permanent: true,
      },
      {
        source: "/local-pain-clinics",
        destination: "/clinics",
        permanent: true,
      },
      {
        source: "/pain-management-listings",
        destination: "/clinics",
        permanent: true,
      },

      // Neuropathy content to blog
      {
        source: "/neuropathy",
        destination: "/blog/peripheral-neuropathy",
        permanent: true,
      },

      // Managing pain sections
      {
        source: "/managing-pain/:path*",
        destination: "/treatment-options",
        permanent: true,
      },

      // ===========================================
      // Legacy clinic URLs missing state/zip suffix (indexed by Google pre-migration)
      // ===========================================
      {
        source: "/pain-management/harbin-clinic-spine-pain-management-rome",
        destination: "/pain-management/harbin-clinic-spine-pain-management-rome-ga-30165",
        permanent: true,
      },
      {
        source: "/pain-management/palmetto-pain-center",
        destination: "/pain-management/palmetto-pain-center-sc-29902",
        permanent: true,
      },
      {
        source: "/pain-management/chicago-pain-medicine-center",
        destination: "/pain-management/chicago-pain-medicine-center-il-60622",
        permanent: true,
      },
      {
        source: "/pain-management/neuropathy-and-pain-solutions-south-st-louis-county",
        destination: "/pain-management/mo",
        permanent: true,
      },
      {
        source: "/pain-management/pain-management-ascension-columbia-st-marys-milwaukee-bay-view",
        destination: "/pain-management/ascension-columbia-st-marys-bay-view-pain-management-wi-53207",
        permanent: true,
      },
      {
        source: "/pain-management/pain-management-ia-51401",
        destination: "/pain-management/iowa-neuropathy-and-pain-clinic-ia-51401",
        permanent: true,
      },
      {
        source: "/pain-management/ohio-valley-pain-medicine",
        destination: "/pain-management/ohio-valley-pain-institute-ky-40217",
        permanent: true,
      },
      {
        source: "/pain-management/arrowhead-endoscopy-pain-management-center",
        destination: "/pain-management/arizona-pain-arrowhead-az-85381",
        permanent: true,
      },
      // No DB match — redirect to relevant state browse pages
      {
        source: "/pain-management/meridian-pain-management",
        destination: "/pain-management/ms",
        permanent: true,
      },
      {
        source: "/pain-management/mercy-clinic-pain-management-and-neurology-rolla",
        destination: "/pain-management/mo",
        permanent: true,
      },
      {
        source: "/pain-management/revere-health-southern-utah-spine-rehabilitation-st-george",
        destination: "/pain-management/ut",
        permanent: true,
      },
      {
        source: "/pain-management/able-physical-therapy",
        destination: "/clinics",
        permanent: true,
      },
      {
        source: "/pain-management/dr-eric-hayden-d-c",
        destination: "/clinics",
        permanent: true,
      },

      // ===========================================
      // Static page aliases
      // ===========================================
      {
        source: "/privacy-policy",
        destination: "/privacy",
        permanent: true,
      },
      {
        source: "/terms-and-conditions",
        destination: "/terms",
        permanent: true,
      },
      {
        source: "/find-clinics/:path*",
        destination: "/clinics",
        permanent: true,
      },
      {
        source: "/knee-pain",
        destination: "/blog/the-ultimate-guide-to-knee-pain",
        permanent: true,
      },
      {
        source: "/scoliosis",
        destination: "/treatment-options",
        permanent: true,
      },

      // ===========================================
      // Old WordPress /:state/:city/:clinic format
      // ===========================================
      {
        source: "/new-mexico/:city/:clinic",
        destination: "/pain-management/nm/:city",
        permanent: true,
      },
      {
        source: "/arkansas/:city/:clinic",
        destination: "/pain-management/ar/:city",
        permanent: true,
      },
      {
        source: "/oklahoma/:city/:clinic",
        destination: "/pain-management/ok/:city",
        permanent: true,
      },

      // ===========================================
      // Clinic 404s from Feb 2026 logs — no DB match
      // ===========================================
      {
        source: "/pain-management/total-pain-care-ms-39272",
        destination: "/pain-management/ms",
        permanent: true,
      },
      {
        source: "/pain-management/northern-arizona-pain-institutes-2",
        destination: "/pain-management/az",
        permanent: true,
      },
      {
        source: "/pain-management/pain-relief-center-of-st-louis",
        destination: "/pain-management/mo",
        permanent: true,
      },
      {
        source: "/pain-management/knox-pain-management-pllc-ny-10589",
        destination: "/pain-management/ny",
        permanent: true,
      },
      {
        source: "/pain-management/muhammad-khan-me-40732642",
        destination: "/clinics",
        permanent: true,
      },
      {
        source: "/pain-management/hastings-pain-relief-center-p-c-2",
        destination: "/clinics",
        permanent: true,
      },
      {
        source: "/pain-management/center-for-advanced-pain-management-and-rehabilitation",
        destination: "/clinics",
        permanent: true,
      },
      {
        source: "/pain-management/dunes-pain-specialists-3",
        destination: "/clinics",
        permanent: true,
      },
      {
        source: "/pain-management/west-philadelphia-injury-center",
        destination: "/pain-management/pa",
        permanent: true,
      },
      {
        source: "/pain-management/advanced-pain-management-of-elwood-in-46036",
        destination: "/pain-management/in",
        permanent: true,
      },
      {
        source: "/pain-management/emmanuel-sakla-sc-293021912",
        destination: "/pain-management/sc",
        permanent: true,
      },
      {
        source: "/pain-management/hendrickson-hunt-pain-management",
        destination: "/clinics",
        permanent: true,
      },
      {
        source: "/pain-management/momenta-pain-care-2",
        destination: "/clinics",
        permanent: true,
      },
      {
        source: "/pain-management/aspen-falls-spinal-care-center",
        destination: "/clinics",
        permanent: true,
      },
      {
        source: "/pain-management/arilex-medical-dr-gary-g-theofilis-anesthesiology-ga-30534",
        destination: "/pain-management/ga",
        permanent: true,
      },
      {
        source: "/pain-management/laurel-back-and-pain-clinic",
        destination: "/clinics",
        permanent: true,
      },
      {
        source: "/pain-management/athens-spine-center-pc",
        destination: "/pain-management/ga",
        permanent: true,
      },
      {
        source: "/pain-management/thomas-g-klein-do-iowa-ortho-2",
        destination: "/pain-management/ia",
        permanent: true,
      },
      {
        source: "/pain-management/inland-pain-medicine",
        destination: "/clinics",
        permanent: true,
      },
      {
        source: "/pain-management/three-rivers-pain-management",
        destination: "/clinics",
        permanent: true,
      },
      {
        source: "/pain-management/cuyuna-regional-medical-center-crosby",
        destination: "/pain-management/mn",
        permanent: true,
      },
      {
        source: "/pain-management/chris-malinky-co-809091177",
        destination: "/pain-management/co",
        permanent: true,
      },
      {
        source: "/pain-management/central-pain-clinic",
        destination: "/clinics",
        permanent: true,
      },
      {
        source: "/pain-management/unc-pain-clinic",
        destination: "/pain-management/nc",
        permanent: true,
      },
      {
        source: "/pain-management/dr-william-tham-md",
        destination: "/clinics",
        permanent: true,
      },
      {
        source: "/pain-management/cypress-pointe-pain-management",
        destination: "/clinics",
        permanent: true,
      },
      {
        source: "/pain-management/aurora-baycare-pain-rehab-medicine",
        destination: "/pain-management/wi",
        permanent: true,
      },
      {
        source: "/pain-management/maine-medical-partners-neurosurgery-spine",
        destination: "/pain-management/me",
        permanent: true,
      },
      {
        source: "/pain-management/rex-pain-management-center",
        destination: "/pain-management/nc",
        permanent: true,
      },
      {
        source: "/pain-management/austell-comprehensive-pain-management-center",
        destination: "/pain-management/ga",
        permanent: true,
      },
      {
        source: "/pain-management/pain-management-of-tampa",
        destination: "/pain-management/fl",
        permanent: true,
      },
      {
        source: "/pain-management/rex-pain-management-center-a-department-of-unc-rex-hospital",
        destination: "/pain-management/nc",
        permanent: true,
      },
      {
        source: "/pain-management/dr-james-rainville-md",
        destination: "/clinics",
        permanent: true,
      },
      {
        source: "/pain-management/zafeer-b-baber-md",
        destination: "/clinics",
        permanent: true,
      },
      {
        source: "/pain-management/pat-french-fnp-bc",
        destination: "/clinics",
        permanent: true,
      },
      {
        source: "/pain-management/health-psychotherapy-maine-borkum-jonathan-phd",
        destination: "/pain-management/me",
        permanent: true,
      },
      {
        source: "/pain-management/lawrenceville-comprehensive-pain-management-center",
        destination: "/pain-management/ga",
        permanent: true,
      },
      {
        source: "/pain-management/valley-view-pain-center",
        destination: "/clinics",
        permanent: true,
      },
      {
        source: "/pain-management/back-pain-doctor-middlesex-county",
        destination: "/clinics",
        permanent: true,
      },
      {
        source: "/pain-management/guzman-camp-interventional-pain-associates-ar-72712",
        destination: "/pain-management/ar",
        permanent: true,
      },
      {
        source: "/pain-management.com",
        destination: "/pain-management",
        permanent: true,
      },

      // ===========================================
      // Malformed /clinic/ prefix URLs (from old sitemap or email templates)
      // ===========================================
      {
        source: "/clinic/pain-management/:path*",
        destination: "/pain-management/:path*",
        permanent: true,
      },
      {
        source: "/clinic/:path*",
        destination: "/pain-management/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
