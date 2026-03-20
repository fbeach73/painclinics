import type { NextConfig } from "next";

// Build cache buster: 2026-01-03-v1 (forces full static regeneration)

// Blog post redirects from old WordPress URLs (/{slug}) to new Next.js URLs (/blog/{slug})
// Only KEEP posts — killed posts are in blogCleanupRedirects below
const blogRedirects = [
  "acl-injuries-and-knee-pain",
  "arthritis-in-the-knee",
  "bursitis-of-the-knee",
  "carpal-tunnel-syndrome",
  "cycling-and-knee-pain",
  "diet-and-knee-pain",
  "ergonomic-adjustments-for-knee-pain",
  "failed-back-surgery",
  "fibromyalgia",
  "heat-therapy-vs-cold-therapy-which-works-best-for-winter-pain",
  "how-to-sit-to-avoid-knee-pain",
  "injections-for-knee-pain-options",
  "interventional-pain-procedures",
  "knee-pain-after-running",
  "knee-pain-during-pregnancy",
  "knee-pain-in-cold-weather",
  "knee-pain-in-older-adults",
  "knee-pain-relief-products",
  "knee-pain-treatment-at-home",
  "knee-pain-while-driving-2",
  "knee-strengthening-exercises",
  "mattress-sleep-position-knee-pain",
  "meniscus-tears-knee-pain",
  "5-natural-ways-to-reduce-inflammation-during-cold-winter-months",
  "nonsurgical-procedures",
  "otc-medications-for-knee-pain",
  "physical-therapy",
  "poor-posture-and-knee-pain",
  "the-ultimate-guide-to-knee-pain",
  "types-of-pain",
  "understanding-chronic-knee-pain",
  "understanding-knee-braces",
  "visual-analog-scale",
  "when-to-see-a-doctor-for-knee-pain",
].map((slug) => ({
  source: `/${slug}`,
  destination: `/blog/${slug}`,
  permanent: true,
}));

// Killed blog posts: redirect both /{slug} and /blog/{slug} to final destination
// Each entry produces two redirects to catch both old WordPress URLs and existing /blog/ URLs
const blogCleanupRedirects = [
  // CBD content
  { slug: "using-cbd-for-neuropathic-pain-management", to: "/treatment-options" },
  { slug: "cbd-for-chronic-back-pain-relief-3", to: "/blog" },
  { slug: "cbd-for-chronic-back-pain-relief", to: "/blog" },
  { slug: "cbd-for-chronic-back-pain-relief-2024", to: "/blog" },
  { slug: "cbd-vs-traditional-pain-medications", to: "/blog" },
  { slug: "cbd-vs-traditional-pain-medications-2", to: "/blog" },
  { slug: "is-cbd-effective-for-arthritis-pain", to: "/blog" },
  { slug: "is-cbd-effective-for-arthritis-pain-2", to: "/blog" },
  { slug: "is-cbd-effective-for-arthritis-pain-3", to: "/blog" },
  { slug: "exploring-cbd-for-fibromyalgia-relief", to: "/blog" },
  { slug: "exploring-cbd-for-fibromyalgia-relief-2", to: "/blog" },
  { slug: "exploring-cbd-for-fibromyalgia-relief-3", to: "/blog" },
  { slug: "cbd-oil-benefits-for-migraines", to: "/blog" },
  { slug: "cbd-oil-benefits-for-migraines-2", to: "/blog" },
  { slug: "cbd-oil-benefits-for-migraines-3", to: "/blog" },
  { slug: "cbd-for-post-surgery-pain-recovery", to: "/blog" },
  { slug: "cbd-for-post-surgery-pain-recovery-2", to: "/blog" },
  { slug: "cbd-for-post-surgery-pain-recovery-3", to: "/blog" },
  { slug: "using-cbd-for-neuropathic-pain-management-2", to: "/blog" },
  { slug: "using-cbd-for-neuropathic-pain-management-3", to: "/blog" },
  { slug: "cbd-education", to: "/blog" },
  { slug: "cbd-in-recovery", to: "/blog" },
  { slug: "types-of-cbd-products", to: "/blog" },
  { slug: "benefits-of-cbd-for-menstrual-cramps", to: "/blog" },
  // Neuropathy thin pages
  { slug: "alcoholic-neuropathy", to: "/treatment-options" },
  { slug: "alcoholic-neuropathy-2", to: "/treatment-options" },
  { slug: "autonomic-neuropathy", to: "/treatment-options" },
  { slug: "autonomic-neuropathy-2", to: "/treatment-options" },
  { slug: "chemotherapy-induced-neuropathy", to: "/treatment-options" },
  { slug: "chemotherapy-induced-neuropathy-2", to: "/treatment-options" },
  { slug: "diabetic-neuropathy", to: "/treatment-options" },
  { slug: "diabetic-neuropathy-2", to: "/treatment-options" },
  { slug: "entrapment-neuropathy", to: "/treatment-options" },
  { slug: "entrapment-neuropathy-2", to: "/treatment-options" },
  { slug: "femoral-neuropathy", to: "/treatment-options" },
  { slug: "femoral-neuropathy-2", to: "/treatment-options" },
  { slug: "focal-neuropathy", to: "/treatment-options" },
  { slug: "focal-neuropathy-2", to: "/treatment-options" },
  { slug: "guillain-barre-syndrome", to: "/treatment-options" },
  { slug: "guillain-barre-syndrome-2", to: "/treatment-options" },
  { slug: "hereditary-neuropathies", to: "/treatment-options" },
  { slug: "hereditary-neuropathies-2", to: "/treatment-options" },
  { slug: "idiopathic-neuropathy", to: "/treatment-options" },
  { slug: "idiopathic-neuropathy-2", to: "/treatment-options" },
  { slug: "peripheral-neuropathy", to: "/treatment-options" },
  { slug: "peripheral-neuropathy-2", to: "/treatment-options" },
  { slug: "postherpetic-neuralgia", to: "/treatment-options" },
  { slug: "postherpetic-neuralgia-2", to: "/treatment-options" },
  { slug: "proximal-neuropathy", to: "/treatment-options" },
  { slug: "proximal-neuropathy-2", to: "/treatment-options" },
  { slug: "radial-neuropathy", to: "/treatment-options" },
  { slug: "radial-neuropathy-2", to: "/treatment-options" },
  { slug: "trigeminal-neuralgia", to: "/treatment-options" },
  { slug: "trigeminal-neuralgia-2", to: "/treatment-options" },
  { slug: "ulnar-neuropathy", to: "/treatment-options" },
  { slug: "ulnar-neuropathy-2", to: "/treatment-options" },
  { slug: "carpal-tunnel-syndrome-2", to: "/treatment-options" },
  // Off-topic posts
  { slug: "labor", to: "/blog" },
  { slug: "clinical-trial-associate-jobs", to: "/blog" },
  { slug: "clinical-trial-coordinator", to: "/blog" },
  { slug: "ppd-las-vegas", to: "/blog" },
  { slug: "pain-center-of-west-virginia", to: "/pain-management/wv" },
  { slug: "pain-management-clinics", to: "/clinics" },
  { slug: "chronic-diseases", to: "/blog" },
  { slug: "youth-sports", to: "/blog" },
  { slug: "maintaining-your-health-as-you-age", to: "/blog" },
  { slug: "injury", to: "/blog" },
  { slug: "pethidine-pain-relief", to: "/blog" },
  { slug: "shoulder-joint", to: "/treatment-options" },
  { slug: "abdominal-pain", to: "/treatment-options" },
  { slug: "what-are-opioids", to: "/blog" },
  { slug: "opioid-treatment", to: "/blog" },
  { slug: "opioid-abuse", to: "/blog" },
  { slug: "snris-neuropathic-pain-management", to: "/treatment-options" },
  { slug: "chronic-pain-types", to: "/blog/types-of-pain" },
  { slug: "chronic-pain-apps", to: "/blog" },
  { slug: "back-pain", to: "/treatment-options" },
  { slug: "reduce-back-pain", to: "/treatment-options" },
  { slug: "best-injections-for-back-pain-5-critical-decisions-to-make", to: "/treatment-options/pain-management-injections" },
  { slug: "painful-treatments", to: "/blog" },
  { slug: "rheumatoid-arthritis-symptoms-and-treatments", to: "/treatment-options" },
  { slug: "migraine-headache-prequels", to: "/blog" },
  { slug: "myofascial-pain-syndrome", to: "/treatment-options" },
  { slug: "mastering-post-operative-pain", to: "/blog" },
  { slug: "post-op", to: "/blog" },
  // Knee content consolidation
  { slug: "obesity-and-knee-pain", to: "/blog/diet-and-knee-pain" },
  { slug: "knee-pain-2", to: "/blog/the-ultimate-guide-to-knee-pain" },
  { slug: "knee-pain-while-driving", to: "/blog/knee-pain-while-driving-2" },
  { slug: "prevent-knee-pain-during-long-drives", to: "/blog/knee-pain-while-driving-2" },
  { slug: "avoid-knee-pain-during-workouts", to: "/blog/knee-strengthening-exercises" },
  { slug: "top-exercises-to-strengthen-your-knees", to: "/blog/knee-strengthening-exercises" },
  { slug: "physical-therapy-exercises-for-knee-pain", to: "/blog/knee-strengthening-exercises" },
  { slug: "when-is-knee-surgery-necessary", to: "/blog/the-ultimate-guide-to-knee-pain" },
  { slug: "why-does-my-knee-hurt-common-causes", to: "/blog/the-ultimate-guide-to-knee-pain" },
  { slug: "how-to-stretch-to-avoid-knee-pain", to: "/blog/knee-strengthening-exercises" },
  { slug: "natural-remedies-for-knee-pain", to: "/blog/knee-pain-treatment-at-home" },
  { slug: "it-band-syndrome-knee-pain", to: "/blog/the-ultimate-guide-to-knee-pain" },
  { slug: "patellar-tendonitis-explained", to: "/blog/the-ultimate-guide-to-knee-pain" },
  { slug: "best-shoes-for-knee-pain-relief", to: "/blog/knee-pain-relief-products" },
].flatMap(({ slug, to }) => [
  { source: `/${slug}`, destination: to, permanent: true },
  { source: `/blog/${slug}`, destination: to, permanent: true },
]);

const nextConfig: NextConfig = {
  // Do NOT add trailingSlash: true — it 308-redirects API POST requests
  // (including Better Auth OAuth) which strips request bodies.

  // Allow larger body sizes for file uploads (50MB)
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
    // Optimize CSS to reduce render-blocking
    optimizeCss: true,
    // Limit concurrent static page generation to avoid DB connection exhaustion
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

  // 301 redirects
  async redirects() {
    return [
      ...blogRedirects,
      ...blogCleanupRedirects,

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

      // Neuropathy → treatment-options (peripheral-neuropathy is being killed and redirects there)
      {
        source: "/neuropathy",
        destination: "/treatment-options",
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

      // ===========================================
      // 404 log fixes (Mar 2026)
      // ===========================================

      // Blog slugs — renamed or long-tail variations
      {
        source: "/blog/wong-baker-faces-pain-scale",
        destination: "/blog/wong-baker-faces",
        permanent: true,
      },
      {
        source: "/blog/how-pain-doctors-assess-your-pain",
        destination: "/blog/doctors-assess-your-pain",
        permanent: true,
      },
      {
        source: "/blog/numeric-pain-rating-scale-nrs-how-the-0-10-pain-scale-works",
        destination: "/blog/numeric-pain-rating-scale",
        permanent: true,
      },
      {
        source: "/numeric-pain-rating-scale-nrs-how-the-0-10-pain-scale-works",
        destination: "/blog/numeric-pain-rating-scale",
        permanent: true,
      },
      {
        source: "/blog/pain-clinics-near-me",
        destination: "/clinics",
        permanent: true,
      },
      {
        source: "/blog/neuropathy",
        destination: "/treatment-options",
        permanent: true,
      },

      // Guides → blog or treatment pages
      {
        source: "/guides/:path*",
        destination: "/pain-management-guide",
        permanent: true,
      },

      // /add suffix URLs — old claim form links indexed by Google
      {
        source: "/pain-management/:slug/add",
        destination: "/pain-management/:slug",
        permanent: true,
      },

      // Legacy clinic slugs without state/zip
      {
        source: "/pain-management/pain-and-spine-specialists-of-maryland-pikesville",
        destination: "/pain-management/md",
        permanent: true,
      },
      {
        source: "/pain-management/texas-pain-physicians-uptown",
        destination: "/pain-management/tx",
        permanent: true,
      },

      // Pages that exist at different paths
      {
        source: "/pain-symptoms/:path*",
        destination: "/treatment-options",
        permanent: true,
      },
      {
        source: "/online-pain-assessment",
        destination: "/consult",
        permanent: true,
      },
      {
        source: "/pricing",
        destination: "/for-clinics",
        permanent: true,
      },
      {
        source: "/about-us/:path*",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/treatment-options/physical-therapy",
        destination: "/treatment-options",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
