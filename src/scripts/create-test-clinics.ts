/**
 * Script to create test clinics for admin/owner testing
 * These clinics have status="draft" so they won't appear in public queries
 * Run with: POSTGRES_URL="..." npx tsx src/scripts/create-test-clinics.ts
 */

import { createId } from "@paralleldrive/cuid2";
import { db } from "../lib/db";
import { clinics } from "../lib/schema";

const TEST_USER_ID = "5FMbFvOdftkJAdgTDtwng5iNm6XX63HZ"; // kyle.sweezey@gmail.com

const testClinics = [
  {
    id: createId(),
    placeId: `test_place_${createId()}`,
    title: "Lake George Addiction Relief",
    slug: "lake-george-addiction-relief",
    permalink: "pain-management/lake-george-addiction-relief",
    postType: "pain-management",
    clinicType: "Pain Management & Addiction Treatment Center",

    // Location - Lake George, NY (real location)
    streetAddress: "2847 Route 9",
    city: "Lake George",
    state: "New York",
    stateAbbreviation: "NY",
    postalCode: "12845",
    mapLatitude: 43.4233,
    mapLongitude: -73.7118,
    detailedAddress: "2847 Route 9, Lake George, NY 12845",

    // Contact
    phone: "(518) 555-0123",
    phones: ["(518) 555-0123", "(518) 555-0124"],
    website: "https://lakegeorgeaddictionrelief.example.com",
    emails: ["info@lakegeorgeaddictionrelief.example.com", "appointments@lakegeorgeaddictionrelief.example.com"],

    // Reviews & Ratings
    reviewCount: 47,
    rating: 4.7,
    reviewsPerScore: [
      { count: 2, score: 1 },
      { count: 1, score: 2 },
      { count: 3, score: 3 },
      { count: 8, score: 4 },
      { count: 33, score: 5 },
    ],
    reviewKeywords: [
      { count: 12, keyword: "compassionate care" },
      { count: 9, keyword: "recovery" },
      { count: 7, keyword: "addiction treatment" },
      { count: 6, keyword: "supportive staff" },
      { count: 5, keyword: "life changing" },
    ],
    featuredReviews: [
      {
        date: "2025-01-15",
        rating: 5,
        review: "The team at Lake George Addiction Relief saved my life. Their comprehensive approach to pain management and addiction recovery gave me the tools I needed to reclaim my health. Dr. Thompson and the nursing staff are incredibly supportive.",
        username: "Michael R.",
        profileUrl: "https://example.com/profile/1",
      },
      {
        date: "2025-01-10",
        rating: 5,
        review: "Finally found a clinic that treats the whole person, not just the symptoms. The integrated approach to chronic pain and addiction is exactly what I needed. Highly recommend to anyone struggling with both issues.",
        username: "Sarah K.",
        profileUrl: "https://example.com/profile/2",
      },
      {
        date: "2024-12-20",
        rating: 5,
        review: "After years of struggling with opioid dependency from a back injury, this clinic helped me find alternative pain management solutions. The staff is non-judgmental and truly cares about your recovery journey.",
        username: "David M.",
        profileUrl: "https://example.com/profile/3",
      },
    ],

    // Business Info
    priceRange: "$$",
    businessDescription: "Lake George Addiction Relief is a comprehensive pain management and addiction treatment center serving the Adirondack region. We specialize in helping patients break free from opioid dependency while providing effective, non-addictive pain management solutions. Our team of board-certified physicians, addiction specialists, and mental health professionals work together to create personalized treatment plans.",

    // Business Hours
    clinicHours: [
      { day: "Sunday", hours: "Closed" },
      { day: "Monday", hours: "7:30 a.m.-6:00 p.m." },
      { day: "Tuesday", hours: "7:30 a.m.-6:00 p.m." },
      { day: "Wednesday", hours: "7:30 a.m.-6:00 p.m." },
      { day: "Thursday", hours: "7:30 a.m.-6:00 p.m." },
      { day: "Friday", hours: "7:30 a.m.-4:00 p.m." },
      { day: "Saturday", hours: "9:00 a.m.-1:00 p.m." },
    ],
    closedOn: "Major Holidays",

    // Content
    content: "<p>Lake George Addiction Relief provides comprehensive pain management and addiction recovery services in the heart of the Adirondacks. Our evidence-based treatment programs combine medical intervention with counseling and holistic therapies.</p><h3>Our Services</h3><ul><li>Medication-Assisted Treatment (MAT)</li><li>Non-opioid pain management</li><li>Interventional procedures</li><li>Individual and group counseling</li><li>Physical therapy</li></ul>",

    // Images (using placeholder URLs that look realistic)
    imageUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800",
    imageFeatured: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800",
    featImage: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800",
    clinicImageUrls: [
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800",
      "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800",
      "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800",
    ],

    // Amenities
    amenities: [
      "Wheelchair-accessible entrance",
      "Wheelchair-accessible parking lot",
      "Free parking",
      "Restrooms",
      "Appointments recommended",
      "Private consultation rooms",
      "Telehealth available",
    ],

    // Q&A
    questions: [
      {
        question: "Do you accept insurance?",
        answer: "Yes, we accept most major insurance plans including Medicare, Medicaid, and private insurance. Please call to verify your coverage.",
      },
      {
        question: "What is your approach to pain management?",
        answer: "We use a multi-modal approach combining interventional procedures, physical therapy, and when appropriate, carefully monitored medication management with an emphasis on non-opioid alternatives.",
      },
    ],

    // Social Media
    facebook: "https://facebook.com/lakegeorgeaddictionrelief",
    instagram: "https://instagram.com/lakegeorgeaddictionrelief",
    twitter: null,
    youtube: null,
    linkedin: "https://linkedin.com/company/lakegeorgeaddictionrelief",

    // Metadata - KEY: status is "draft" to hide from public
    status: "draft" as const,
    ownerUserId: TEST_USER_ID,
    isVerified: true,
    claimedAt: new Date(),
    isFeatured: true,
    featuredTier: "premium" as const,
    featuredUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
  },
  {
    id: createId(),
    placeId: `test_place_${createId()}`,
    title: "Harvey Station Pain Clinic",
    slug: "harvey-station-pain-clinic",
    permalink: "pain-management/harvey-station-pain-clinic",
    postType: "pain-management",
    clinicType: "Pain Management Clinic",

    // Location - Using a fictional "Harvey Station" in Maine
    streetAddress: "145 Main Street",
    city: "Harvey Station",
    state: "Maine",
    stateAbbreviation: "ME",
    postalCode: "04401",
    mapLatitude: 44.8012,
    mapLongitude: -68.7778,
    detailedAddress: "145 Main Street, Harvey Station, ME 04401",

    // Contact
    phone: "(207) 555-0456",
    phones: ["(207) 555-0456"],
    website: "https://harveystationpain.example.com",
    emails: ["contact@harveystationpain.example.com"],

    // Reviews & Ratings
    reviewCount: 89,
    rating: 4.9,
    reviewsPerScore: [
      { count: 1, score: 1 },
      { count: 0, score: 2 },
      { count: 2, score: 3 },
      { count: 10, score: 4 },
      { count: 76, score: 5 },
    ],
    reviewKeywords: [
      { count: 18, keyword: "excellent care" },
      { count: 15, keyword: "pain relief" },
      { count: 12, keyword: "professional staff" },
      { count: 10, keyword: "injections" },
      { count: 8, keyword: "chronic pain" },
      { count: 7, keyword: "life changing" },
    ],
    featuredReviews: [
      {
        date: "2025-01-20",
        rating: 5,
        review: "Dr. Hartwell and his team at Harvey Station Pain Clinic are absolutely wonderful. After suffering from chronic back pain for over a decade, they finally helped me find relief through a combination of nerve blocks and physical therapy. I can now enjoy activities I thought I'd never do again.",
        username: "Jennifer L.",
        profileUrl: "https://example.com/profile/4",
      },
      {
        date: "2025-01-05",
        rating: 5,
        review: "The staff here genuinely cares about their patients. They take the time to listen and create a treatment plan that works for your specific situation. The facility is clean and modern, and wait times are minimal.",
        username: "Robert T.",
        profileUrl: "https://example.com/profile/5",
      },
      {
        date: "2024-12-28",
        rating: 5,
        review: "I've been to many pain clinics over the years, and Harvey Station Pain Clinic is by far the best. They focus on finding the root cause of your pain rather than just masking symptoms. Highly recommend!",
        username: "Patricia W.",
        profileUrl: "https://example.com/profile/6",
      },
      {
        date: "2024-12-15",
        rating: 5,
        review: "Five stars isn't enough! The whole team from the front desk to the medical staff treats you like family. They worked with my insurance company to get my treatments approved when others wouldn't.",
        username: "Thomas B.",
        profileUrl: "https://example.com/profile/7",
      },
    ],

    // Business Info
    priceRange: "$$$",
    businessDescription: "Harvey Station Pain Clinic is a leading pain management facility in central Maine, offering advanced interventional procedures and comprehensive treatment plans. Our board-certified pain specialists use the latest techniques including epidural steroid injections, nerve blocks, radiofrequency ablation, and spinal cord stimulation to help patients find lasting relief from chronic pain.",

    // Business Hours
    clinicHours: [
      { day: "Sunday", hours: "Closed" },
      { day: "Monday", hours: "8:00 a.m.-5:00 p.m." },
      { day: "Tuesday", hours: "8:00 a.m.-5:00 p.m." },
      { day: "Wednesday", hours: "8:00 a.m.-5:00 p.m." },
      { day: "Thursday", hours: "8:00 a.m.-5:00 p.m." },
      { day: "Friday", hours: "8:00 a.m.-3:00 p.m." },
      { day: "Saturday", hours: "Closed" },
    ],
    closedOn: "Weekends and Major Holidays",

    // Content
    content: "<p>Harvey Station Pain Clinic provides expert pain management services using state-of-the-art technology and evidence-based treatments. Our mission is to help patients regain their quality of life through personalized care.</p><h3>Treatment Options</h3><ul><li>Epidural steroid injections</li><li>Facet joint injections</li><li>Nerve blocks</li><li>Radiofrequency ablation</li><li>Spinal cord stimulation</li><li>Regenerative medicine</li></ul><h3>Conditions We Treat</h3><ul><li>Lower back pain</li><li>Neck pain</li><li>Sciatica</li><li>Arthritis</li><li>Neuropathy</li><li>Post-surgical pain</li></ul>",

    // Images
    imageUrl: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800",
    imageFeatured: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800",
    featImage: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800",
    clinicImageUrls: [
      "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800",
      "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=800",
      "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800",
      "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=800",
    ],

    // Amenities
    amenities: [
      "Wheelchair-accessible entrance",
      "Wheelchair-accessible parking lot",
      "Wheelchair-accessible restroom",
      "Free parking",
      "Appointments recommended",
      "Same-day appointments available",
      "On-site imaging",
      "Telehealth available",
    ],

    // Q&A
    questions: [
      {
        question: "What should I bring to my first appointment?",
        answer: "Please bring your photo ID, insurance card, a list of current medications, and any relevant imaging (X-rays, MRIs, CT scans) or medical records related to your pain condition.",
      },
      {
        question: "How long before I feel relief from injections?",
        answer: "Results vary by patient and procedure. Some patients feel relief within a few days, while others may take 1-2 weeks. We typically schedule a follow-up to assess your response and adjust treatment as needed.",
      },
      {
        question: "Do you offer payment plans?",
        answer: "Yes, we offer flexible payment plans for patients without insurance or for procedures not covered by insurance. Please speak with our billing department for details.",
      },
    ],

    // Social Media
    facebook: "https://facebook.com/harveystationpain",
    instagram: null,
    twitter: "https://twitter.com/harveystationpain",
    youtube: "https://youtube.com/@harveystationpain",
    linkedin: null,

    // Metadata - KEY: status is "draft" to hide from public
    status: "draft" as const,
    ownerUserId: TEST_USER_ID,
    isVerified: true,
    claimedAt: new Date(),
    isFeatured: true,
    featuredTier: "basic" as const,
    featuredUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
  },
];

async function main() {
  console.log("Creating test clinics...\n");

  for (const clinic of testClinics) {
    try {
      await db.insert(clinics).values(clinic);
      console.log(`✓ Created: ${clinic.title}`);
      console.log(`  ID: ${clinic.id}`);
      console.log(`  Permalink: /${clinic.permalink}`);
      console.log(`  Status: ${clinic.status} (hidden from public)`);
      console.log(`  Owner: ${clinic.ownerUserId}`);
      console.log("");
    } catch (error) {
      console.error(`✗ Failed to create ${clinic.title}:`, error);
    }
  }

  console.log("Done! These clinics are:");
  console.log("  - Visible to admins in the admin panel");
  console.log("  - Visible to kyle.sweezey@gmail.com in My Clinics");
  console.log("  - NOT visible in public search or directory pages");

  process.exit(0);
}

main().catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});
