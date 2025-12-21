/**
 * Import a single clinic from WordPress data
 * Run: pnpm tsx src/scripts/import-single-clinic.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { db } from "@/lib/db";
import { clinics } from "@/lib/schema";

const clinicData = {
  wpId: 53985,
  placeId: "ChIJce2vlLxPE4cR-RjRUggeW0I",
  title: "Open Arms Pain Clinic",
  permalink: "co/colorado-springs/open-arms-pain-clinic",
  postType: "pain-management",
  clinicType: "Pain Management Physician",

  // Location
  streetAddress: "685 Citadel Dr E Suite 505",
  city: "Colorado Springs",
  state: "Colorado",
  stateAbbreviation: "CO",
  postalCode: "80909",
  mapLatitude: 38.8426135,
  mapLongitude: -104.758293,

  // Contact
  phone: "+1 719-265-4412",
  website: "http://openarmspainclinic.com/",

  // Reviews & Ratings
  reviewCount: 93,
  rating: 3.5,
  reviewsPerScore: [
    { score: 1, count: 33 },
    { score: 2, count: 3 },
    { score: 3, count: 0 },
    { score: 4, count: 1 },
    { score: 5, count: 56 },
  ],
  reviewKeywords: [
    { keyword: "office", count: 10 },
    { keyword: "feel", count: 10 },
    { keyword: "medication", count: 7 },
    { keyword: "chronic pain", count: 7 },
    { keyword: "communication", count: 5 },
    { keyword: "insurance", count: 5 },
    { keyword: "understanding", count: 5 },
    { keyword: "people", count: 4 },
    { keyword: "medicaid", count: 3 },
    { keyword: "judgement", count: 3 },
  ],
  featuredReviews: [
    {
      username: "Matthew Fabris",
      profileUrl: "https://www.google.com/maps/contrib/104430191115120272167?hl=en-US",
      review: "I'm very happy with the clinic where I go for trigger point injections and medication to treat degenerative disc disease in my neck. Shannon is a caring and competent provider. I'm seen within 5 to 10 minutes of arrival.",
      dateReviewLeft: "2025-01-20",
      rating: 5,
    },
    {
      username: "Debbie Myers",
      profileUrl: "https://www.google.com/maps/contrib/115901319923789503247?hl=en-US",
      review: "I love Vicki and Shannon.! They are very intelligent and knowledgeable about what they do! I would highly recommend them to anyone that is in need of the best care!! The other Doctors are great as well! The staff here has always been so professional and has always answered any questions that i may have. When you walk into Open Arms the waiting room it is very clean and comfortable and i love the way it is decorated!! Very welcoming! Highly Recommend!!",
      dateReviewLeft: "2024-03-28",
      rating: 5,
    },
    {
      username: "Andrea Phillips",
      profileUrl: "https://www.google.com/maps/contrib/114780919568336879893?hl=en-US",
      review: "Open Arms Pain Clinic is by far the best Pain Clinic I have worked with. Shannon is so knowledgeable and thorough. Without Shannon I wouldn't be starting to finally get my life back. Thank you so much for what you do! I highly recommend this Clinic and especially Shannon!",
      dateReviewLeft: "2024-10-22",
      rating: 5,
    },
  ],

  // Business Hours
  clinicHours: [
    { day: "Monday", hours: "9 a.m.-5 p.m." },
    { day: "Tuesday", hours: "9 a.m.-5 p.m." },
    { day: "Wednesday", hours: "9 a.m.-5 p.m." },
    { day: "Thursday", hours: "9 a.m.-5 p.m." },
    { day: "Friday", hours: "9 a.m.-5 p.m." },
    { day: "Saturday", hours: "Closed" },
    { day: "Sunday", hours: "Closed" },
  ],
  closedOn: "Saturday, Sunday",
  popularTimes: [
    { hourOfDay: "10 a.m.", averagePopularity: 74.4 },
    { hourOfDay: "2 p.m.", averagePopularity: 74.2 },
    { hourOfDay: "11 a.m.", averagePopularity: 73 },
  ],

  // Content
  content: `<h3>Comprehensive Pain Management in Colorado Springs</h3>
<p>At Open Arms Pain Clinic, we provide <b>whole body pain management care</b> designed to help patients regain control of their lives. Our dedicated team of pain management physicians offers personalized treatment plans that include medication management and various injection therapies to address chronic and acute pain conditions. We understand that pain affects every aspect of your life, which is why we take a holistic approach to your care.</p>
<h3>Our Services Include:</h3>
<ul>
<li>Comprehensive pain evaluations</li>
<li>Medication management</li>
<li>Therapeutic injections</li>
<li>Trigger point injections</li>
<li>Treatment for degenerative disc disease</li>
</ul>
<p>We believe quality pain management should be accessible to everyone, which is why we proudly <b>accept Medicare, Medicaid, and cash pay options</b> for our patients.</p>`,

  // Images
  imageFeatured: "https://lh3.ggpht.com/p/AF1QipOkQWDLb1q46slNGfRvWdyNuliTht2eH3CngMuV=s1024",
  clinicImageUrls: [
    "https://lh3.ggpht.com/p/AF1QipOkQWDLb1q46slNGfRvWdyNuliTht2eH3CngMuV=s1024",
    "https://lh3.ggpht.com/p/AF1QipOQ_6I8HGRACcZEnLnNDOeBBLhTB29B3YFwgeBM=s1024",
    "https://lh3.ggpht.com/p/AF1QipPVZfZczRLN8To_4C6k8w9Hl6CxqfwA0G1JQipb=s1024",
  ],

  // Amenities & Features
  amenities: [
    "Wheelchair-accessible entrance",
    "Wheelchair-accessible parking lot",
    "Wheelchair-accessible washroom",
    "Washroom",
    "Appointment required",
    "Appointments recommended",
  ],
  checkboxFeatures: [
    "short_wait_times",
    "long_wait_times",
    "insurance_accepted",
    "pain_management_services",
    "surgery_services",
    "injection_treatments",
    "diagnostic_services",
    "thorough_care",
  ],

  // Q&A
  questions: [
    {
      question: "is cannabis ok?",
      answer: "Yes as long as it's from a dispensary",
    },
  ],
};

async function importClinic() {
  console.log("Starting import of Open Arms Pain Clinic...");

  try {
    const result = await db
      .insert(clinics)
      .values(clinicData)
      .onConflictDoNothing()
      .returning({ id: clinics.id, title: clinics.title });

    const imported = result[0];
    if (imported) {
      console.log("✅ Successfully imported clinic:");
      console.log(`   ID: ${imported.id}`);
      console.log(`   Title: ${imported.title}`);
      console.log(`   URL: /pain-management/${clinicData.permalink}`);
    } else {
      console.log("⚠️ Clinic already exists (skipped due to conflict)");
    }
  } catch (error) {
    console.error("❌ Error importing clinic:", error);
  }

  process.exit(0);
}

importClinic();
