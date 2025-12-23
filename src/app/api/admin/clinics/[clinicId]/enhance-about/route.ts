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

/**
 * Build the prompt for enhancing clinic About content.
 * The prompt instructs the AI to clean up and enhance the existing content.
 */
function buildEnhancementPrompt(clinic: ClinicRecord): string {
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
- Optionally use a simple <table> if comparing treatment options or listing structured info
- Structure the content with 2-3 sections using headings
- Do NOT include <html>, <head>, <body>, or <style> tags - just the content HTML

EXAMPLE STRUCTURE:
<h2>About [Clinic Name]</h2>
<p>Opening paragraph with <strong>key highlights</strong>...</p>

<h2>Our Services</h2>
<ul>
  <li><strong>Service 1</strong> - brief description</li>
  <li><strong>Service 2</strong> - brief description</li>
</ul>

<h2>Why Patients Choose Us</h2>
<p>Closing paragraph with patient-focused benefits...</p>

CLINIC DATA:
Name: ${clinic.title}
City: ${clinic.city}, ${clinic.stateAbbreviation}
Services: ${services}
Amenities: ${amenities}
Review Keywords: ${reviewKeywords}
Rating: ${clinic.rating ? `${clinic.rating}/5 stars` : "Not available"}
Original Content: ${clinic.content || "No content available"}

OUTPUT: Well-formatted HTML content only. No markdown, no code blocks, no explanations - just clean HTML.`;
}

/**
 * POST /api/admin/clinics/[clinicId]/enhance-about
 * Generate AI-enhanced About content for a clinic.
 * Requires admin authentication.
 */
export async function POST(
  _request: NextRequest,
  context: RouteContext
) {
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
      return NextResponse.json(
        { error: "Clinic not found" },
        { status: 404 }
      );
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

    // Generate enhanced content
    const prompt = buildEnhancementPrompt(clinic);
    const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

    const { text, usage } = await generateText({
      model: openrouter(model),
      prompt,
    });

    // Clean up the generated text (remove any leading/trailing whitespace)
    const cleanedContent = text.trim();

    // Save to database
    await db
      .update(clinics)
      .set({
        newPostContent: cleanedContent,
        updatedAt: new Date(),
      })
      .where(eq(clinics.id, clinicId));

    // Calculate total tokens
    const inputTokens = usage?.inputTokens ?? 0;
    const outputTokens = usage?.outputTokens ?? 0;
    const totalTokens = inputTokens + outputTokens;

    return NextResponse.json({
      success: true,
      content: cleanedContent,
      usage: {
        promptTokens: inputTokens,
        completionTokens: outputTokens,
        totalTokens,
      },
      clinicId,
      model,
    });
  } catch (error) {
    console.error("Failed to enhance clinic content:", error);

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
    }

    return NextResponse.json(
      { error: "Failed to enhance clinic content" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/clinics/[clinicId]/enhance-about
 * Check the current enhanced content status for a clinic.
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const { clinicId } = await context.params;

  try {
    const clinic = await getClinicById(clinicId);
    if (!clinic) {
      return NextResponse.json(
        { error: "Clinic not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      clinicId,
      title: clinic.title,
      hasOriginalContent: !!clinic.content,
      hasEnhancedContent: !!clinic.newPostContent,
      originalContent: clinic.content || null,
      enhancedContent: clinic.newPostContent || null,
      originalWordCount: clinic.content ? clinic.content.split(/\s+/).length : 0,
      enhancedWordCount: clinic.newPostContent ? clinic.newPostContent.split(/\s+/).length : 0,
    });
  } catch (error) {
    console.error("Failed to fetch clinic content status:", error);
    return NextResponse.json(
      { error: "Failed to fetch content status" },
      { status: 500 }
    );
  }
}
