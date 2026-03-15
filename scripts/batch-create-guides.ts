/**
 * Batch Create State Guides
 *
 * Generates guides for all US states that don't already have one.
 * For each state:
 *   1. Generates content via OpenRouter (Claude Sonnet)
 *   2. Generates featured image with title text via Gemini 3 Pro
 *   3. Generates 2 inline images (random H2 selection) via Gemini 3 Pro
 *   4. Inserts inline images into content at the chosen H2 positions
 *   5. Saves to database as "published"
 *
 * Usage:
 *   npx tsx scripts/batch-create-guides.ts
 *   npx tsx scripts/batch-create-guides.ts --states TX,FL,NY
 *   npx tsx scripts/batch-create-guides.ts --dry-run
 */

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { GoogleGenAI } from "@google/genai";
import { db } from "@/lib/db";
import { guides } from "@/lib/schema";
import { createGuide } from "@/lib/guides/guide-admin-queries";
import { processImage, generateImageFilename } from "@/lib/blog/image-processing";
import { upload } from "@/lib/storage";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina",
  ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

const INLINE_IMAGE_PROMPTS: Record<string, string> = {
  "Treatment Types": "A warm, realistic photograph showing a pain management treatment session. A physical therapist helps a middle-aged patient with a guided stretch in a bright, modern clinic room. Medical equipment visible in the background. Natural window lighting, shallow depth of field. No text, no logos. Photorealistic editorial photography, 16:9 ratio.",
  "Specialist Consultation": "A warm photograph of a pain management doctor in a white coat having a reassuring consultation with a patient in a modern clinic office. They are reviewing results on a tablet together. Natural lighting, professional but approachable. No text, no logos. Photorealistic editorial photography, 16:9 ratio.",
  "Insurance Coverage": "A realistic photograph of a patient and a clinic administrator reviewing insurance paperwork together at a reception desk in a modern medical office. Warm natural lighting, shallow depth of field on the documents. Professional and reassuring atmosphere. No text, no logos. Photorealistic editorial photography, 16:9 ratio.",
  "Finding a Clinic": "A realistic photograph of the welcoming entrance of a modern pain management clinic. Clean single-story medical building with a covered entryway, potted plants, and natural stone accents. Morning light, no people. No text, no signage, no logos. Photorealistic architectural photography, 16:9 ratio.",
};

// H2 patterns to match for inline image insertion
const H2_INLINE_CANDIDATES = [
  { pattern: /insurance|medicaid|medicare|coverage/i, prompt: "Insurance Coverage" },
  { pattern: /treatment|types|available/i, prompt: "Treatment Types" },
  { pattern: /find|choose|clinic/i, prompt: "Finding a Clinic" },
  { pattern: /specialist|primary care|when to see/i, prompt: "Specialist Consultation" },
  { pattern: /regulation|law|patient.*know/i, prompt: "Specialist Consultation" },
  { pattern: /cities|top cities/i, prompt: "Finding a Clinic" },
];

// ---------------------------------------------------------------------------
// Content generation
// ---------------------------------------------------------------------------

function buildPrompt(_stateAbbrev: string, stateName: string): string {
  return `You are a healthcare content writer creating a comprehensive state-level guide to pain management for PainClinics.com — a directory of 5,000+ pain management clinics across the US.

Write a guide titled "Guide to Pain Management in ${stateName}" targeting patients searching for pain management information and clinics in ${stateName}.

REQUIREMENTS:

1. CONTENT (HTML format, use <h2>, <h3>, <p>, <ul>, <li> tags):
   - Overview of the pain management landscape in ${stateName}
   - State-specific regulations patients should know (PDMP, prescribing laws, telehealth rules)
   - Insurance and Medicaid/Medicare coverage for pain treatments in ${stateName}
   - Common treatment types available (injections, physical therapy, nerve blocks, medication management, spinal cord stimulation, regenerative medicine)
   - How to find and choose a pain clinic in ${stateName}
   - Top cities for pain management in ${stateName} (5-8 cities)
   - When to see a pain specialist vs primary care

   Keep it factual, helpful, and patient-focused. 1500-2500 words. Do NOT invent specific statistics or cite fake studies. Use general, publicly known facts about ${stateName}'s healthcare landscape.

2. EXCERPT (1-2 sentences, plain text):
   Brief summary for the guides index page.

3. META TITLE (under 60 chars):
   SEO-optimized page title.

4. META DESCRIPTION (under 160 chars):
   Compelling meta description with a call-to-action.

5. ABOUT TOPICS (comma-separated):
   5-8 medical topics for structured data, e.g. "Chronic Pain, Pain Management, Opioid Prescribing"

6. FAQs (5-7 Q&A pairs):
   Common questions patients in ${stateName} would have about pain management. Answers should be 50-100 words each.

Return your response as JSON in exactly this format:
{
  "content": "<h2>...</h2><p>...</p>...",
  "excerpt": "...",
  "metaTitle": "...",
  "metaDescription": "...",
  "aboutTopics": ["topic1", "topic2", ...],
  "faqs": [{"question": "...", "answer": "..."}, ...]
}

Return ONLY the JSON object, no markdown code fences, no extra text.`;
}

async function generateContent(stateAbbrev: string, stateName: string, attempt = 1): Promise<Record<string, unknown>> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const openrouter = createOpenRouter({ apiKey });
  const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

  const { text } = await generateText({
    model: openrouter(model),
    prompt: buildPrompt(stateAbbrev, stateName),
    maxOutputTokens: 8192,
    temperature: 0.7,
  });

  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    if (attempt < 3) {
      console.warn(`    JSON parse failed (attempt ${attempt}), retrying...`);
      await new Promise((r) => setTimeout(r, 2000));
      return generateContent(stateAbbrev, stateName, attempt + 1);
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Image generation
// ---------------------------------------------------------------------------

async function generateImage(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: prompt,
    config: {
      responseModalities: ["IMAGE", "TEXT"],
      imageConfig: { imageSize: "1K" },
    },
  });

  let imageBytes: string | null = null;
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData?.data) {
        imageBytes = part.inlineData.data;
        break;
      }
    }
  }

  if (!imageBytes) throw new Error("No image generated");

  const rawBuffer = Buffer.from(imageBytes, "base64");
  const processedBuffer = await processImage(rawBuffer);
  const filename = generateImageFilename("guide-ai.png");
  const result = await upload(processedBuffer, filename, "guides");

  return result.url;
}

function getFeaturedImagePrompt(stateName: string): string {
  return `A warm, cinematic aerial photograph of a modern pain management clinic in ${stateName} at golden hour. A clean stone-and-glass medical building in a setting that reflects ${stateName}'s signature landscape and terrain. Bold white text reading "GUIDE TO PAIN MANAGEMENT IN ${stateName.toUpperCase()}" is overlaid across the center of the image in a clean, modern sans-serif font. No other text, no logos. Photorealistic editorial photography, 16:9 aspect ratio.`;
}

// ---------------------------------------------------------------------------
// Inline image insertion
// ---------------------------------------------------------------------------

function pickInlineH2s(content: string): { h2Text: string; promptKey: string }[] {
  const h2Matches = content.match(/<h2[^>]*>(.*?)<\/h2>/gi) || [];
  const candidates: { h2Text: string; promptKey: string; index: number }[] = [];

  for (const h2 of h2Matches) {
    const text = h2.replace(/<[^>]+>/g, "");
    for (const candidate of H2_INLINE_CANDIDATES) {
      if (candidate.pattern.test(text)) {
        candidates.push({
          h2Text: h2,
          promptKey: candidate.prompt,
          index: content.indexOf(h2),
        });
        break;
      }
    }
  }

  // Pick 2 with different prompt keys for variety
  const selected: typeof candidates = [];
  const usedPrompts = new Set<string>();

  for (const c of candidates) {
    if (!usedPrompts.has(c.promptKey) && selected.length < 2) {
      selected.push(c);
      usedPrompts.add(c.promptKey);
    }
  }

  // If we only got 1 unique, just take the first 2
  if (selected.length < 2) {
    for (const c of candidates) {
      if (!selected.includes(c) && selected.length < 2) {
        selected.push(c);
      }
    }
  }

  return selected.map((s) => ({ h2Text: s.h2Text, promptKey: s.promptKey }));
}

function insertImageBeforeH2(content: string, h2Text: string, imageUrl: string): string {
  const imgTag = `<img class="rounded-lg max-w-full" src="${imageUrl}" alt="Pain management guide illustration" />`;
  return content.replace(h2Text, `${imgTag}\n${h2Text}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const statesArg = args.find((a) => a.startsWith("--states="));
  const targetStates = statesArg
    ? statesArg.replace("--states=", "").split(",").map((s) => s.trim().toUpperCase())
    : Object.keys(STATE_NAMES);

  // Get existing guides
  const existing = await db
    .select({ stateAbbreviation: guides.stateAbbreviation })
    .from(guides);
  const existingStates = new Set(existing.map((g) => g.stateAbbreviation).filter(Boolean));

  const statesToCreate = targetStates.filter(
    (s) => STATE_NAMES[s] && !existingStates.has(s)
  );

  console.log(`\nStates to create: ${statesToCreate.length}`);
  console.log(`Already exist: ${existingStates.size}`);
  console.log(`Skipping: ${targetStates.length - statesToCreate.length}`);

  if (dryRun) {
    console.log("\n[DRY RUN] Would create guides for:");
    for (const abbrev of statesToCreate) {
      console.log(`  - ${STATE_NAMES[abbrev]} (${abbrev})`);
    }
    process.exit(0);
  }

  if (statesToCreate.length === 0) {
    console.log("\nNo new guides to create. Done.");
    process.exit(0);
  }

  let created = 0;
  let failed = 0;

  for (const abbrev of statesToCreate) {
    const stateName = STATE_NAMES[abbrev]!;
    const slug = `pain-management-in-${stateName.toLowerCase().replace(/\s+/g, "-")}`;

    console.log(`\n[${ created + failed + 1}/${statesToCreate.length}] ${stateName} (${abbrev})`);

    try {
      // 1. Generate content
      console.log("  Generating content...");
      const data = await generateContent(abbrev, stateName);

      // 2. Generate featured image
      console.log("  Generating featured image...");
      const featuredUrl = await generateImage(getFeaturedImagePrompt(stateName));

      // 3. Pick 2 H2s and generate inline images
      let content = data.content as string;
      const h2Picks = pickInlineH2s(content);
      console.log(`  Generating ${h2Picks.length} inline images...`);

      for (const pick of h2Picks) {
        const prompt = INLINE_IMAGE_PROMPTS[pick.promptKey];
        if (!prompt) continue;
        try {
          const inlineUrl = await generateImage(prompt);
          content = insertImageBeforeH2(content, pick.h2Text, inlineUrl);
          console.log(`    ✓ ${pick.promptKey}`);
        } catch (err) {
          console.warn(`    ✗ ${pick.promptKey} failed: ${err instanceof Error ? err.message : err}`);
        }
      }

      // 4. Save to database
      console.log("  Saving to database...");
      const guideId = await createGuide({
        title: `Guide to Pain Management in ${stateName}`,
        slug,
        content,
        excerpt: (data.excerpt as string) || "",
        metaTitle: (data.metaTitle as string) || "",
        metaDescription: (data.metaDescription as string) || "",
        featuredImageUrl: featuredUrl,
        featuredImageAlt: `Guide to pain management in ${stateName}`,
        stateAbbreviation: abbrev,
        status: "draft",
        faqs: (data.faqs as Array<{ question: string; answer: string }>) || undefined,
        aboutTopics: (data.aboutTopics as string[]) || undefined,
      });

      console.log(`  ✓ Created: /guides/${slug} (${guideId})`);
      created++;

      // Rate limit — be kind to APIs
      if (statesToCreate.indexOf(abbrev) < statesToCreate.length - 1) {
        console.log("  Waiting 5s before next state...");
        await new Promise((r) => setTimeout(r, 5000));
      }
    } catch (err) {
      console.error(`  ✗ FAILED: ${err instanceof Error ? err.message : err}`);
      failed++;
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`Created: ${created}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total published guides: ${existingStates.size + created}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
