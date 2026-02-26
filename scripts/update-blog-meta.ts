/**
 * One-off script to update meta titles and descriptions for high-impression blog posts.
 * SEO action items rows 2 and 4.
 *
 * Run: npx tsx scripts/update-blog-meta.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

const updates = [
  {
    slug: "ergonomic-adjustments-for-knee-pain",
    // 29,384 impressions, 0.4% CTR, position 25.7
    metaTitle: "Ergonomic Adjustments for Knee Pain: 10 Evidence-Based Tips",
    metaDescription:
      "Relieve knee pain with ergonomic adjustments at work and home. Learn desk setup, seating, and movement tips from pain management experts.",
  },
  {
    slug: "visual-analog-scale",
    // 17,140 impressions, 0.2% CTR, position 32.4
    metaTitle: "Visual Analog Scale (VAS): How Doctors Measure Your Pain",
    metaDescription:
      "Learn how the Visual Analog Scale works to measure pain intensity. Understand VAS scoring, when it's used, and how it guides your treatment plan.",
  },
];

async function main() {
  // Dynamic import after env is loaded
  const { db } = await import("../src/lib/db");
  const { blogPosts } = await import("../src/lib/schema");
  const { eq } = await import("drizzle-orm");

  for (const { slug, metaTitle, metaDescription } of updates) {
    const [post] = await db
      .select({
        slug: blogPosts.slug,
        title: blogPosts.title,
        metaTitle: blogPosts.metaTitle,
        metaDescription: blogPosts.metaDescription,
      })
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug));

    if (!post) {
      console.error(`Blog post not found: ${slug}`);
      continue;
    }

    console.log(`\n--- ${slug} ---`);
    console.log(`  Title: ${post.title}`);
    console.log(`  Old metaTitle: ${post.metaTitle || "(null)"}`);
    console.log(`  Old metaDescription: ${post.metaDescription || "(null)"}`);
    console.log(`  New metaTitle: ${metaTitle}`);
    console.log(`  New metaDescription: ${metaDescription}`);

    await db
      .update(blogPosts)
      .set({ metaTitle, metaDescription })
      .where(eq(blogPosts.slug, slug));

    console.log(`  ✓ Updated`);
  }

  console.log("\nDone.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
