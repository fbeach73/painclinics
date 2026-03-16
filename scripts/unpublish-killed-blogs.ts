/**
 * Unpublish killed blog posts by setting status = 'draft'.
 *
 * Run with:
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/unpublish-killed-blogs.ts
 */

import { db } from "@/lib/db";
import { blogPosts } from "@/lib/schema";
import { inArray } from "drizzle-orm";

const KILLED_SLUGS = [
  // CBD content
  "using-cbd-for-neuropathic-pain-management",
  "cbd-for-chronic-back-pain-relief-3",
  "cbd-for-chronic-back-pain-relief",
  "cbd-for-chronic-back-pain-relief-2024",
  "cbd-vs-traditional-pain-medications",
  "cbd-vs-traditional-pain-medications-2",
  "is-cbd-effective-for-arthritis-pain",
  "is-cbd-effective-for-arthritis-pain-2",
  "is-cbd-effective-for-arthritis-pain-3",
  "exploring-cbd-for-fibromyalgia-relief",
  "exploring-cbd-for-fibromyalgia-relief-2",
  "exploring-cbd-for-fibromyalgia-relief-3",
  "cbd-oil-benefits-for-migraines",
  "cbd-oil-benefits-for-migraines-2",
  "cbd-oil-benefits-for-migraines-3",
  "cbd-for-post-surgery-pain-recovery",
  "cbd-for-post-surgery-pain-recovery-2",
  "cbd-for-post-surgery-pain-recovery-3",
  "using-cbd-for-neuropathic-pain-management-2",
  "using-cbd-for-neuropathic-pain-management-3",
  "cbd-education",
  "cbd-in-recovery",
  "types-of-cbd-products",
  "benefits-of-cbd-for-menstrual-cramps",
  // Neuropathy thin pages
  "alcoholic-neuropathy",
  "alcoholic-neuropathy-2",
  "autonomic-neuropathy",
  "autonomic-neuropathy-2",
  "chemotherapy-induced-neuropathy",
  "chemotherapy-induced-neuropathy-2",
  "diabetic-neuropathy",
  "diabetic-neuropathy-2",
  "entrapment-neuropathy",
  "entrapment-neuropathy-2",
  "femoral-neuropathy",
  "femoral-neuropathy-2",
  "focal-neuropathy",
  "focal-neuropathy-2",
  "guillain-barre-syndrome",
  "guillain-barre-syndrome-2",
  "hereditary-neuropathies",
  "hereditary-neuropathies-2",
  "idiopathic-neuropathy",
  "idiopathic-neuropathy-2",
  "peripheral-neuropathy",
  "peripheral-neuropathy-2",
  "postherpetic-neuralgia",
  "postherpetic-neuralgia-2",
  "proximal-neuropathy",
  "proximal-neuropathy-2",
  "radial-neuropathy",
  "radial-neuropathy-2",
  "trigeminal-neuralgia",
  "trigeminal-neuralgia-2",
  "ulnar-neuropathy",
  "ulnar-neuropathy-2",
  "carpal-tunnel-syndrome-2",
  // Off-topic posts
  "labor",
  "clinical-trial-associate-jobs",
  "clinical-trial-coordinator",
  "ppd-las-vegas",
  "pain-center-of-west-virginia",
  "pain-management-clinics",
  "chronic-diseases",
  "youth-sports",
  "maintaining-your-health-as-you-age",
  "injury",
  "pethidine-pain-relief",
  "shoulder-joint",
  "abdominal-pain",
  "what-are-opioids",
  "opioid-treatment",
  "opioid-abuse",
  "snris-neuropathic-pain-management",
  "chronic-pain-types",
  "chronic-pain-apps",
  "back-pain",
  "reduce-back-pain",
  "best-injections-for-back-pain-5-critical-decisions-to-make",
  "painful-treatments",
  "rheumatoid-arthritis-symptoms-and-treatments",
  "migraine-headache-prequels",
  "myofascial-pain-syndrome",
  "mastering-post-operative-pain",
  "post-op",
  // Knee content consolidation
  "obesity-and-knee-pain",
  "knee-pain-2",
  "knee-pain-while-driving",
  "prevent-knee-pain-during-long-drives",
  "avoid-knee-pain-during-workouts",
  "top-exercises-to-strengthen-your-knees",
  "physical-therapy-exercises-for-knee-pain",
  "when-is-knee-surgery-necessary",
  "why-does-my-knee-hurt-common-causes",
  "how-to-stretch-to-avoid-knee-pain",
  "natural-remedies-for-knee-pain",
  "it-band-syndrome-knee-pain",
  "patellar-tendonitis-explained",
  "best-shoes-for-knee-pain-relief",
];

async function main() {
  console.log(`Unpublishing ${KILLED_SLUGS.length} killed blog posts...`);

  // First, check which slugs actually exist in the DB
  const existing = await db
    .select({ slug: blogPosts.slug, status: blogPosts.status })
    .from(blogPosts)
    .where(inArray(blogPosts.slug, KILLED_SLUGS));

  const existingSlugs = new Set(existing.map((r) => r.slug));
  const missingSlugs = KILLED_SLUGS.filter((s) => !existingSlugs.has(s));

  if (missingSlugs.length > 0) {
    console.log(`\nWarning: ${missingSlugs.length} slugs not found in DB:`);
    missingSlugs.forEach((s) => console.log(`  - ${s}`));
  }

  const alreadyDraft = existing.filter((r) => r.status === "draft");
  if (alreadyDraft.length > 0) {
    console.log(`\n${alreadyDraft.length} posts already draft (will be skipped by update):`);
    alreadyDraft.forEach((r) => console.log(`  - ${r.slug}`));
  }

  // Update all matching posts to draft in a single query
  await db
    .update(blogPosts)
    .set({ status: "draft" })
    .where(inArray(blogPosts.slug, KILLED_SLUGS));

  console.log(`\nDone. Updated ${existingSlugs.size} posts to draft status.`);

  // Log final state for verification
  const updated = await db
    .select({ slug: blogPosts.slug, status: blogPosts.status })
    .from(blogPosts)
    .where(inArray(blogPosts.slug, KILLED_SLUGS));

  const stillPublished = updated.filter((r) => r.status !== "draft");
  if (stillPublished.length > 0) {
    console.log(`\nWarning: ${stillPublished.length} posts still not draft:`);
    stillPublished.forEach((r) => console.log(`  - ${r.slug} (${r.status})`));
  } else {
    console.log("All found posts are now draft.");
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
