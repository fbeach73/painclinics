/**
 * Batch AI content optimization for 20 branded clinic name queries.
 * SEO action items rows 14, 31-57: clinics ranking position 5-15.
 *
 * For each clinic:
 *   1. Fuzzy-match by title in DB
 *   2. Generate enhanced About content (newPostContent) via OpenRouter
 *   3. Generate FAQ questions via OpenRouter
 *   4. Save both to DB
 *
 * Run: npx tsx scripts/batch-optimize-clinics.ts
 * Dry run: npx tsx scripts/batch-optimize-clinics.ts --dry-run
 */
import { config } from "dotenv";
config({ path: ".env.local" });

// Target clinics from SEO audit rows 14, 31-57
// directId: use when fuzzy search can't match (special chars, abbreviations, etc.)
const TARGET_CLINICS: Array<{
  query: string;
  row: number;
  impressions: number;
  position: number;
  directId?: string;
}> = [
  { query: "jawad bhatti md", row: 14, impressions: 9800, position: 8.2 },
  { query: "clearway pain solutions", row: 31, impressions: 6346, position: 8.4 },
  { query: "knee pain centers of america", row: 32, impressions: 5775, position: 8.2 },
  { query: "sweetwater pain and spine", row: 34, impressions: 5027, position: 5.8 },
  { query: "dominion spine and pain", row: 36, impressions: 4869, position: 4.9 },
  { query: "commonwealth pain and spine", row: 38, impressions: 4674, position: 7.3 },
  { query: "access pain solutions", row: 44, impressions: 3601, position: 10.0 },
  { query: "summit pain management", row: 45, impressions: 3570, position: 9.7 },
  { query: "precision pain management", row: 46, impressions: 3382, position: 12.4 },
  // DB title uses "&" not "and" + different casing
  { query: "eastern utah spine and pain", row: 47, impressions: 3374, position: 5.3, directId: "o7jgt5j0fe22rex0u51mzwd0" },
  // DB title: "Patrick A. Oley, MD"
  { query: "patrick oley, md", row: 48, impressions: 3265, position: 11.3, directId: "n3990tkdwdzyfue60ui707ta" },
  { query: "consultants in pain management", row: 49, impressions: 3123, position: 9.7 },
  // iSpine Coon Rapids location not in DB — use closest iSpine (Delano, MN)
  { query: "ispine coon rapids", row: 50, impressions: 3075, position: 7.3, directId: "fffbvwgjpbiql49iurn6osdx" },
  // DB title: "Greenville Pain & Spine"
  { query: "greenville pain and spine", row: 51, impressions: 3044, position: 7.2, directId: "jcsgrfq6snlib5ikte03dfjn" },
  { query: "red rock neurology", row: 52, impressions: 3044, position: 8.4 },
  { query: "premier pain and spine", row: 53, impressions: 3042, position: 11.2 },
  { query: "pain management consultants of southwest florida", row: 54, impressions: 2994, position: 7.6 },
  { query: "superior pain management", row: 55, impressions: 2924, position: 6.3 },
  // DB title: "Water's Edge: Memorial's Pain Relief Institute"
  { query: "waters edge yakima", row: 56, impressions: 2611, position: 6.7, directId: "z6ewtk9xw6v4876gwkvgrfp0" },
  // DB title: "Texas Pain Intervention Clinic: Ankit Maheshwari, MD"
  { query: "texas pain clinic", row: 57, impressions: 2532, position: 14.4, directId: "ytxwuboion6q2efipwvs7z7m" },
];

// Delay between API calls to avoid rate limits
const DELAY_MS = 3000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Prompt builders (mirrored from API routes) ───

function buildEnhancementPrompt(clinic: Record<string, unknown>): string {
  const services = Array.isArray(clinic.checkboxFeatures)
    ? (clinic.checkboxFeatures as string[]).join(", ")
    : "Not specified";
  const amenities = Array.isArray(clinic.amenities)
    ? (clinic.amenities as string[]).join(", ")
    : "Not specified";
  const reviewKeywords = Array.isArray(clinic.reviewKeywords)
    ? (clinic.reviewKeywords as string[]).join(", ")
    : "Not available";

  return `You are enhancing a pain management clinic's description. Create professional, well-formatted HTML content.

CONTENT RULES:
- Remove any addresses, phone numbers, or email addresses (displayed elsewhere on page)
- Fix formatting, punctuation, and grammar issues
- Keep it informative (200-350 words total)
- Naturally incorporate the clinic's services and amenities if provided
- Mention positive themes from review keywords if available
- Do NOT invent information not present in the data
- Write in third person
- Do NOT use phrases like "this clinic" repeatedly - vary the language
- Use the clinic name in the first sentence
- Focus on what makes the clinic unique and valuable to patients
- If the original content is very short or empty, create content based on available data

HTML FORMATTING REQUIREMENTS:
- Use <h2> for main section headings (e.g., "About", "Our Approach", "Why Choose Us")
- Use <h3> for subsection headings if needed
- Use <p> tags for paragraphs
- Use <strong> or <b> to emphasize key phrases (2-4 per section)
- Use <ul> and <li> for listing services, specialties, or benefits (when appropriate)
- Structure the content with 2-3 sections using headings
- Do NOT include <html>, <head>, <body>, or <style> tags - just the content HTML

CLINIC DATA:
Name: ${clinic.title}
City: ${clinic.city}, ${clinic.stateAbbreviation}
Services: ${services}
Amenities: ${amenities}
Review Keywords: ${reviewKeywords}
Rating: ${clinic.rating ? `${clinic.rating}/5 stars` : "Not available"}
Original Content: ${(clinic.content as string) || (clinic.businessDescription as string) || "No content available"}

OUTPUT: Well-formatted HTML content only. No markdown, no code blocks, no explanations - just clean HTML.`;
}

function formatClinicHours(hours: unknown): string {
  if (!hours || typeof hours !== "object") return "Hours not available";
  const hoursObj = hours as Record<string, { day?: string; time?: string }>;
  const formatted: string[] = [];
  for (const [, value] of Object.entries(hoursObj)) {
    if (value && typeof value === "object" && value.day && value.time) {
      formatted.push(`${value.day}: ${value.time}`);
    }
  }
  return formatted.length > 0 ? formatted.join(", ") : "Hours not available";
}

function formatFeaturedReviews(reviews: unknown): string {
  if (!reviews || !Array.isArray(reviews)) return "No featured reviews available";
  const reviewTexts = reviews
    .slice(0, 3)
    .filter((r: { text?: string; review_text?: string }) => r && (r.text || r.review_text))
    .map((r: { text?: string; review_text?: string }) => {
      const text = r.text || r.review_text || "";
      return text.length > 200 ? text.substring(0, 200) + "..." : text;
    });
  return reviewTexts.length > 0 ? reviewTexts.join("\n- ") : "No featured reviews available";
}

function buildFAQPrompt(clinic: Record<string, unknown>): string {
  const services = Array.isArray(clinic.checkboxFeatures)
    ? (clinic.checkboxFeatures as string[]).join(", ")
    : "Not specified";
  const amenities = Array.isArray(clinic.amenities)
    ? (clinic.amenities as string[]).join(", ")
    : "Not specified";
  const reviewKeywords = Array.isArray(clinic.reviewKeywords)
    ? (clinic.reviewKeywords as string[]).join(", ")
    : "Not available";
  const hours = formatClinicHours(clinic.clinicHours);
  const hasValidHours = hours !== "Hours not available";
  const featuredReviews = formatFeaturedReviews(clinic.featuredReviews);

  const phoneInfo = (clinic.phone as string) || null;
  const websiteInfo = (clinic.website as string) || null;
  const hasContactInfo = phoneInfo || websiteInfo;

  const aboutContent =
    (clinic.newPostContent as string) || (clinic.content as string) || "No detailed description available";
  const truncatedAbout = aboutContent.length > 500 ? aboutContent.substring(0, 500) + "..." : aboutContent;

  const faqTopics: string[] = [
    "1. What pain management services/treatments does this clinic offer? (REQUIRED - always include)",
    "2. What pain conditions does this clinic treat? (REQUIRED - always include)",
  ];

  if (hasContactInfo) {
    const contactDetails = phoneInfo ? `phone: ${phoneInfo}` : "";
    const websiteDetails = websiteInfo ? `website: ${websiteInfo}` : "";
    faqTopics.push(
      `3. How do I schedule an appointment? (Include ${[contactDetails, websiteDetails].filter(Boolean).join(" and ")})`
    );
  }

  faqTopics.push("4. What should I expect at my first visit?");

  if (amenities !== "Not specified") {
    faqTopics.push("5. Is parking and accessibility available? (Use amenities data)");
  }

  if (hasValidHours) {
    faqTopics.push(`6. What are the clinic's hours? (Hours: ${hours})`);
  }

  const ratingInfo = clinic.rating ? `${clinic.rating}/5 rating` : null;
  const reviewCountInfo = clinic.reviewCount ? `${clinic.reviewCount} reviews` : null;
  faqTopics.push(
    `7. What makes this clinic stand out? (${[ratingInfo, reviewCountInfo].filter(Boolean).join(", ") || "Use review insights"} - write authentically, not promotional)`
  );

  return `You are a healthcare content writer creating FAQ content for a pain management clinic website. Write like a helpful human, not a marketing brochure.

GOAL: Create 5-6 FAQs that a real patient would find genuinely helpful when researching this clinic.

WRITING STYLE:
- Natural, conversational tone
- Warm and informative, not robotic or overly promotional
- Use "you" and "your" to speak directly to the patient
- Keep answers 50-80 words - concise but complete
- Write like you're explaining to a friend, not selling to a customer

WHAT TO AVOID:
- Don't stuff every answer with contact info (only include phone/website in 1-2 answers MAX)
- Don't repeat the clinic name in every sentence
- Don't use superlatives like "best" or "leading" or "premier"
- Don't create an "hours of operation" question if hours aren't available
- Don't make the "stand out" answer sound like an advertisement

CLINIC DATA:
Name: ${clinic.title}
Address: ${clinic.streetAddress || ""}, ${clinic.city}, ${clinic.stateAbbreviation} ${clinic.postalCode}
Phone: ${phoneInfo || "Not available"}
Website: ${websiteInfo || "Not available"}

About:
${truncatedAbout}

Services: ${services}
Amenities: ${amenities}
Hours: ${hours}

Rating: ${clinic.rating ? `${clinic.rating}/5` : "Not available"} (${clinic.reviewCount || 0} reviews)
Review Keywords: ${reviewKeywords}

Sample Reviews:
- ${featuredReviews}

FAQ TOPICS TO COVER (generate in this order, skip if data unavailable):
${faqTopics.join("\n")}

OUTPUT FORMAT:
Return ONLY a valid JSON array with 5-6 FAQs. No markdown, no explanation:
[
  {"question": "What pain management services does ${clinic.title} offer?", "answer": "..."},
  {"question": "What pain conditions does ${clinic.title} treat?", "answer": "..."},
  ...
]`;
}

function parseFAQResponse(text: string): Array<{ question: string; answer: string }> {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }

  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error("Response is not an array");

  const faqs: Array<{ question: string; answer: string }> = [];
  for (const item of parsed) {
    if (typeof item?.question === "string" && typeof item?.answer === "string") {
      faqs.push({ question: item.question.trim(), answer: item.answer.trim() });
    }
  }
  if (faqs.length === 0) throw new Error("No valid FAQ items found");
  return faqs;
}

// ─── Main ───

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  if (dryRun) console.log("🔍 DRY RUN — no DB writes\n");

  const { db } = await import("../src/lib/db");
  const { clinics } = await import("../src/lib/schema");
  const { ilike, eq } = await import("drizzle-orm");
  const { createOpenRouter } = await import("@openrouter/ai-sdk-provider");
  const { generateText } = await import("ai");

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("OPENROUTER_API_KEY not set");
    process.exit(1);
  }
  const model = process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4.5";
  console.log(`Model: ${model}\n`);

  const openrouter = createOpenRouter({ apiKey });

  let processed = 0;
  let skipped = 0;
  let errors = 0;
  let totalCost = 0;

  for (const target of TARGET_CLINICS) {
    console.log(`\n[$${(processed + skipped + errors + 1).toString().padStart(2, "0")}] Row ${target.row}: "${target.query}" (pos ${target.position}, ${target.impressions} imp)`);

    // ── Step 1: Find clinic ──
    const selectFields = {
      id: clinics.id,
      title: clinics.title,
      city: clinics.city,
      stateAbbreviation: clinics.stateAbbreviation,
      permalink: clinics.permalink,
      content: clinics.content,
      newPostContent: clinics.newPostContent,
      questions: clinics.questions,
      businessDescription: clinics.businessDescription,
      checkboxFeatures: clinics.checkboxFeatures,
      amenities: clinics.amenities,
      reviewKeywords: clinics.reviewKeywords,
      rating: clinics.rating,
      reviewCount: clinics.reviewCount,
      phone: clinics.phone,
      website: clinics.website,
      streetAddress: clinics.streetAddress,
      postalCode: clinics.postalCode,
      clinicHours: clinics.clinicHours,
      featuredReviews: clinics.featuredReviews,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let matches: any[];

    if (target.directId) {
      // Use direct ID for clinics that can't be found by fuzzy search
      matches = await db.select(selectFields).from(clinics).where(eq(clinics.id, target.directId)).limit(1);
    } else {
      // Fuzzy search by title
      const searchTerm = `%${target.query.replace(/,/g, "").trim()}%`;
      matches = await db.select(selectFields).from(clinics).where(ilike(clinics.title, searchTerm)).limit(5);

      // Fallback: try replacing "and" with "&"
      if (matches.length === 0) {
        const altSearch = `%${target.query.replace(/,/g, "").replace(/ and /gi, " & ").trim()}%`;
        matches = await db.select(selectFields).from(clinics).where(ilike(clinics.title, altSearch)).limit(5);
      }

      // Fallback: broad word-based search
      if (matches.length === 0) {
        const words = target.query.replace(/,/g, "").trim().split(/\s+/);
        const broadSearch = `%${words.slice(0, 3).join("%")}%`;
        matches = await db.select(selectFields).from(clinics).where(ilike(clinics.title, broadSearch)).limit(5);
      }
    }

    if (matches.length === 0) {
      console.log(`  ❌ No match found for "${target.query}"`);
      errors++;
      continue;
    }

    // If multiple matches, show them and pick first
    if (matches.length > 1) {
      console.log(`  📋 Multiple matches (using first):`);
      for (const m of matches) {
        console.log(`    - ${m.title} (${m.city}, ${m.stateAbbreviation})`);
      }
    }

    const clinic = matches[0];
    console.log(`  ✓ Matched: ${clinic.title} (${clinic.city}, ${clinic.stateAbbreviation})`);

    const hasContent = !!clinic.newPostContent;
    const hasFAQs = Array.isArray(clinic.questions) && (clinic.questions as unknown[]).length > 0;

    if (hasContent && hasFAQs) {
      console.log(`  ⏭️  Already has enhanced content + FAQs — skipping`);
      skipped++;
      continue;
    }

    if (dryRun) {
      console.log(`  [DRY RUN] Would generate: ${!hasContent ? "content" : ""} ${!hasFAQs ? "FAQ" : ""}`);
      skipped++;
      continue;
    }

    // ── Step 2: Generate enhanced content ──
    if (!hasContent) {
      try {
        console.log(`  📝 Generating enhanced content...`);
        const prompt = buildEnhancementPrompt(clinic);
        const { text, usage } = await generateText({
          model: openrouter(model),
          prompt,
        });

        const cleanedContent = text.trim();
        const wordCount = cleanedContent.split(/\s+/).length;

        await db
          .update(clinics)
          .set({ newPostContent: cleanedContent, updatedAt: new Date() })
          .where(eq(clinics.id, clinic.id));

        const tokens = (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0);
        const cost = tokens * 0.000005; // rough estimate for Sonnet
        totalCost += cost;
        console.log(`  ✓ Content saved (${wordCount} words, ${tokens} tokens, ~$${cost.toFixed(4)})`);

        await sleep(DELAY_MS);
      } catch (err) {
        console.error(`  ❌ Content generation failed:`, (err as Error).message);
        errors++;
        continue;
      }
    } else {
      console.log(`  ⏭️  Already has enhanced content`);
    }

    // ── Step 3: Generate FAQs ──
    if (!hasFAQs) {
      try {
        console.log(`  ❓ Generating FAQs...`);

        // Re-read clinic to get the just-saved newPostContent for FAQ prompt
        const freshClinic = !hasContent
          ? (
              await db
                .select({
                  newPostContent: clinics.newPostContent,
                })
                .from(clinics)
                .where(eq(clinics.id, clinic.id))
                .limit(1)
            )[0]
          : null;

        const clinicForFaq = {
          ...clinic,
          ...(freshClinic ? { newPostContent: freshClinic.newPostContent } : {}),
        };

        const prompt = buildFAQPrompt(clinicForFaq);
        const { text, usage } = await generateText({
          model: openrouter(model),
          prompt,
        });

        const faqs = parseFAQResponse(text);

        await db
          .update(clinics)
          .set({ questions: faqs, updatedAt: new Date() })
          .where(eq(clinics.id, clinic.id));

        const tokens = (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0);
        const cost = tokens * 0.000005;
        totalCost += cost;
        console.log(`  ✓ ${faqs.length} FAQs saved (${tokens} tokens, ~$${cost.toFixed(4)})`);

        await sleep(DELAY_MS);
      } catch (err) {
        console.error(`  ❌ FAQ generation failed:`, (err as Error).message);
        errors++;
        continue;
      }
    } else {
      console.log(`  ⏭️  Already has FAQs`);
    }

    processed++;
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Done. Processed: ${processed} | Skipped: ${skipped} | Errors: ${errors}`);
  console.log(`Estimated cost: ~$${totalCost.toFixed(4)}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
