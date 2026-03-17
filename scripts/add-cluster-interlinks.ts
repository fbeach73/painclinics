/**
 * Add internal links:
 * 1. From the VAS post to all new pain assessment cluster posts
 * 2. From all 50 state guides to the hub page
 *
 * Usage: export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/add-cluster-interlinks.ts
 */

import { db } from "@/lib/db";
import { blogPosts, guides } from "@/lib/schema";
import { eq, and, isNotNull } from "drizzle-orm";

async function addVasLinks() {
  console.log("=== Adding links from VAS post to cluster posts ===");

  const [vas] = await db
    .select({ id: blogPosts.id, content: blogPosts.content })
    .from(blogPosts)
    .where(eq(blogPosts.slug, "visual-analog-scale"));

  if (!vas) {
    console.log("VAS post not found!");
    return;
  }

  let content = vas.content;
  let linksAdded = 0;

  // Check if links already exist to avoid duplicates
  if (content.includes("/blog/numeric-pain-rating-scale")) {
    console.log("  Links already present, skipping VAS update");
    return;
  }

  // 1. In the intro/first paragraph, link "pain intensity" to the hub page
  // Find the "Advantages and Limitations" section — add a paragraph before the FAQ
  // linking to related assessment tools

  // Add a "Related Pain Assessment Tools" section before the FAQ
  const faqIdx = content.indexOf("<h2>Frequently Asked Questions</h2>");
  if (faqIdx === -1) {
    console.log("  Could not find FAQ section in VAS post");
    return;
  }

  const relatedSection = `<h2>Related Pain Assessment Tools</h2>
<p>The VAS is one of several standardized tools used in clinical pain assessment. Each measures a different aspect of the pain experience:</p>
<ul>
<li><p><strong><a href="/blog/numeric-pain-rating-scale">Numeric Pain Rating Scale (NRS)</a></strong> — a verbal 0–10 rating that correlates strongly with VAS (r = 0.86–0.95) and is preferred in most clinical settings for its speed and simplicity.</p></li>
<li><p><strong><a href="/blog/wong-baker-faces-pain-scale">Wong-Baker FACES Pain Scale</a></strong> — uses facial expressions to rate pain, designed for children and patients with cognitive or language barriers.</p></li>
<li><p><strong><a href="/blog/oswestry-disability-index">Oswestry Disability Index (ODI)</a></strong> — measures how low back pain affects daily function across 10 activity domains.</p></li>
<li><p><strong><a href="/blog/brief-pain-inventory">Brief Pain Inventory (BPI)</a></strong> — captures both pain intensity and functional interference across seven life domains.</p></li>
</ul>
<p>For a complete overview of how pain specialists use these tools together, see our guide to <a href="/blog/how-pain-doctors-assess-your-pain">how pain doctors assess your pain</a>.</p>
`;

  content = content.slice(0, faqIdx) + relatedSection + content.slice(faqIdx);
  linksAdded = 5;

  await db
    .update(blogPosts)
    .set({ content })
    .where(eq(blogPosts.id, vas.id));

  console.log(`  ✓ Added ${linksAdded} internal links to VAS post`);
}

async function addGuideLinks() {
  console.log("\n=== Adding hub page link to all state guides ===");

  const allGuides = await db
    .select({
      id: guides.id,
      slug: guides.slug,
      content: guides.content,
      stateAbbreviation: guides.stateAbbreviation,
    })
    .from(guides)
    .where(
      and(
        eq(guides.status, "published"),
        isNotNull(guides.stateAbbreviation)
      )
    );

  console.log(`  Found ${allGuides.length} published state guides`);

  let updated = 0;
  let skipped = 0;

  for (const guide of allGuides) {
    // Skip if link already exists
    if (guide.content.includes("/blog/how-pain-doctors-assess-your-pain")) {
      skipped++;
      continue;
    }

    let content = guide.content;

    // Find "When to See a Pain Management Specialist" section
    const specialistIdx = content.indexOf("When to See a Pain Management Specialist");

    if (specialistIdx === -1) {
      // Try alternate heading patterns
      const altIdx = content.indexOf("When to See a Pain");
      if (altIdx === -1) {
        console.log(`  ⚠ No specialist section found in ${guide.slug}, skipping`);
        skipped++;
        continue;
      }
    }

    // Find the end of the specialist section (next <h2> or end of content)
    const sectionStart = content.indexOf("</h2>", specialistIdx) + 5;
    const nextH2 = content.indexOf("<h2>", sectionStart);
    const insertPoint = nextH2 !== -1 ? nextH2 : content.length;

    // Add a paragraph with the link before the next section
    const linkParagraph = `\n<p>Before your appointment, it helps to understand the tools your doctor will use to evaluate your pain. Our guide to <a href="/blog/how-pain-doctors-assess-your-pain">how pain doctors assess your pain</a> explains every assessment tool — from the 0–10 pain scale to functional questionnaires — so you know what to expect.</p>\n`;

    content =
      content.slice(0, insertPoint) + linkParagraph + content.slice(insertPoint);

    await db
      .update(guides)
      .set({ content })
      .where(eq(guides.id, guide.id));

    updated++;
  }

  console.log(`  ✓ Updated ${updated} guides`);
  console.log(`  ⏭ Skipped ${skipped} (already linked or no section found)`);
}

async function main() {
  await addVasLinks();
  await addGuideLinks();
  console.log("\nDone!");
  process.exit(0);
}

main();
