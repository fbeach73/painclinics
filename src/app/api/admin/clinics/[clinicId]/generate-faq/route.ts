import { NextRequest, NextResponse } from "next/server";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { eq } from "drizzle-orm";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { getClinicById, type ClinicRecord } from "@/lib/clinic-queries";
import { db } from "@/lib/db";
import { clinics } from "@/lib/schema";

interface RouteContext {
  params: Promise<{ clinicId: string }>;
}

interface FAQItem {
  question: string;
  answer: string;
}

/**
 * Format clinic hours for the prompt.
 */
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

/**
 * Format featured reviews for the prompt.
 */
function formatFeaturedReviews(reviews: unknown): string {
  if (!reviews || !Array.isArray(reviews)) return "No featured reviews available";

  interface ReviewItem {
    text?: string;
    review_text?: string;
    rating?: number;
  }

  const reviewTexts = (reviews as ReviewItem[])
    .slice(0, 3) // Limit to top 3 reviews
    .filter((r) => r && (r.text || r.review_text))
    .map((r) => {
      const text = r.text || r.review_text || "";
      // Truncate long reviews
      return text.length > 200 ? text.substring(0, 200) + "..." : text;
    });

  return reviewTexts.length > 0
    ? reviewTexts.join("\n- ")
    : "No featured reviews available";
}

/**
 * Build the prompt for generating clinic FAQs.
 */
function buildFAQPrompt(clinic: ClinicRecord): string {
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

  // Determine contact and scheduling info
  const phoneInfo = clinic.phone || null;
  const websiteInfo = clinic.website || null;
  const hasContactInfo = phoneInfo || websiteInfo;

  // Get clinic description content
  const aboutContent = clinic.newPostContent || clinic.content || "No detailed description available";
  // Truncate if too long
  const truncatedAbout = aboutContent.length > 500
    ? aboutContent.substring(0, 500) + "..."
    : aboutContent;

  // Build dynamic FAQ topic list based on available data
  const faqTopics: string[] = [
    "1. What pain management services/treatments does this clinic offer? (REQUIRED - always include)",
    "2. What pain conditions does this clinic treat? (REQUIRED - always include)",
  ];

  if (hasContactInfo) {
    const contactDetails = phoneInfo ? `phone: ${phoneInfo}` : "";
    const websiteDetails = websiteInfo ? `website: ${websiteInfo}` : "";
    faqTopics.push(`3. How do I schedule an appointment? (Include ${[contactDetails, websiteDetails].filter(Boolean).join(" and ")})`);
  }

  faqTopics.push("4. What should I expect at my first visit?");

  if (amenities !== "Not specified") {
    faqTopics.push("5. Is parking and accessibility available? (Use amenities data)");
  }

  // Only include hours if we have valid data
  if (hasValidHours) {
    faqTopics.push(`6. What are the clinic's hours? (Hours: ${hours})`);
  }

  // Always include "stand out" question - use rating/reviews if available
  const ratingInfo = clinic.rating ? `${clinic.rating}/5 rating` : null;
  const reviewCountInfo = clinic.reviewCount ? `${clinic.reviewCount} reviews` : null;
  faqTopics.push(`7. What makes this clinic stand out? (${[ratingInfo, reviewCountInfo].filter(Boolean).join(", ") || "Use review insights"} - write authentically, not promotional)`);

  return `You are a healthcare content writer creating FAQ content for a pain management clinic website. Write like a helpful human, not a marketing brochure.

GOAL: Create 5-6 FAQs that a real patient would find genuinely helpful when researching this clinic.

WRITING STYLE:
- Natural, conversational tone (like Version #1 in examples below)
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

EXAMPLES OF GOOD vs BAD TONE:

BAD (too promotional):
"With over twenty years of leadership and a 4.7/5 rating, Advanced Pain Center combines board-certified physicians, experienced doctors, friendly staff..."

GOOD (authentic):
"Patients consistently mention the thorough evaluations and personalized treatment plans. The clinic has earned a 4.7/5 rating from patients who appreciate the experienced team and efficient, compassionate care."

BAD (contact info stuffed):
"Call +1 907-278-2741 or visit http://apcalaska.com/ to schedule. You can also call +1 907-278-2741 for questions..."

GOOD (natural):
"You can schedule by calling the clinic directly or through their website. Staff can help with insurance questions and find a time that works for you."

OUTPUT FORMAT:
Return ONLY a valid JSON array with 5-6 FAQs. No markdown, no explanation:
[
  {"question": "What pain management services does ${clinic.title} offer?", "answer": "..."},
  {"question": "What pain conditions does ${clinic.title} treat?", "answer": "..."},
  ...
]`;
}

/**
 * Parse the AI response to extract FAQ items.
 */
function parseFAQResponse(text: string): FAQItem[] {
  // Clean the response - remove any markdown code blocks
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) {
      throw new Error("Response is not an array");
    }

    // Validate each item has question and answer
    const faqs: FAQItem[] = [];
    for (const item of parsed) {
      if (
        typeof item === "object" &&
        item !== null &&
        typeof item.question === "string" &&
        typeof item.answer === "string"
      ) {
        faqs.push({
          question: item.question.trim(),
          answer: item.answer.trim(),
        });
      }
    }

    if (faqs.length === 0) {
      throw new Error("No valid FAQ items found");
    }

    return faqs;
  } catch (error) {
    console.error("Failed to parse FAQ response:", error);
    console.error("Raw response:", text);
    throw new Error("Failed to parse AI response as FAQ array");
  }
}

/**
 * POST /api/admin/clinics/[clinicId]/generate-faq
 * Generate AI-generated FAQs for a clinic.
 * Requires admin authentication.
 */
export async function POST(_request: NextRequest, context: RouteContext) {
  // Auth check (admin only)
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const { clinicId } = await context.params;

  try {
    // Fetch clinic data
    const clinic = await getClinicById(clinicId);
    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    // Check for OpenRouter API key
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenRouter API key not configured" },
        { status: 500 }
      );
    }

    // Initialize OpenRouter
    const openrouter = createOpenRouter({ apiKey });

    // Generate FAQs
    const prompt = buildFAQPrompt(clinic);
    const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

    const { text, usage } = await generateText({
      model: openrouter(model),
      prompt,
    });

    // Parse the response
    const faqs = parseFAQResponse(text);

    // Save to database
    await db
      .update(clinics)
      .set({
        questions: faqs,
        updatedAt: new Date(),
      })
      .where(eq(clinics.id, clinicId));

    // Calculate total tokens
    const inputTokens = usage?.inputTokens ?? 0;
    const outputTokens = usage?.outputTokens ?? 0;
    const totalTokens = inputTokens + outputTokens;

    return NextResponse.json({
      success: true,
      faqs,
      faqCount: faqs.length,
      usage: {
        promptTokens: inputTokens,
        completionTokens: outputTokens,
        totalTokens,
      },
      clinicId,
      model,
    });
  } catch (error) {
    console.error("Failed to generate clinic FAQs:", error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { error: "Invalid or missing API key" },
          { status: 500 }
        );
      }
      if (error.message.includes("rate limit")) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }
      if (error.message.includes("parse")) {
        return NextResponse.json(
          { error: "Failed to parse AI response. Please try again." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to generate clinic FAQs" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/clinics/[clinicId]/generate-faq
 * Check the current FAQ status for a clinic.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const { clinicId } = await context.params;

  try {
    const clinic = await getClinicById(clinicId);
    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    const questions = clinic.questions as FAQItem[] | null;
    const hasFAQs = Array.isArray(questions) && questions.length > 0;

    return NextResponse.json({
      clinicId,
      title: clinic.title,
      hasFAQs,
      faqCount: hasFAQs ? questions.length : 0,
      faqs: questions || [],
    });
  } catch (error) {
    console.error("Failed to fetch clinic FAQ status:", error);
    return NextResponse.json(
      { error: "Failed to fetch FAQ status" },
      { status: 500 }
    );
  }
}
