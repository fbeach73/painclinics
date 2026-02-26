import { NextRequest, NextResponse } from "next/server";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";

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

export async function POST(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) return adminErrorResponse(adminCheck);

  try {
    const body = await request.json();
    const stateAbbrev: string = body.stateAbbreviation;

    if (!stateAbbrev || !STATE_NAMES[stateAbbrev]) {
      return NextResponse.json(
        { error: "Valid state abbreviation is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const stateName = STATE_NAMES[stateAbbrev]!;
    const openrouter = createOpenRouter({ apiKey });
    const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

    const { text } = await generateText({
      model: openrouter(model),
      prompt: buildPrompt(stateAbbrev, stateName),
      maxOutputTokens: 4096,
      temperature: 0.7,
    });

    // Parse JSON response — handle potential markdown fences
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({
      content: parsed.content || "",
      excerpt: parsed.excerpt || "",
      metaTitle: parsed.metaTitle || "",
      metaDescription: parsed.metaDescription || "",
      aboutTopics: parsed.aboutTopics || [],
      faqs: parsed.faqs || [],
      slug: `pain-management-in-${stateName.toLowerCase().replace(/\s+/g, "-")}`,
      title: `Guide to Pain Management in ${stateName}`,
    });
  } catch (error) {
    console.error("Error generating guide:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate guide content" },
      { status: 500 }
    );
  }
}
