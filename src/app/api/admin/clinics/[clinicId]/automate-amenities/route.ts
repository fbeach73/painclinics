import { revalidatePath } from "next/cache";
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
 * Known amenities list for AI context.
 * The AI can discover new amenities but these serve as hints.
 */
const KNOWN_AMENITIES = {
  Accessibility: [
    "Wheelchair accessible",
    "Wheelchair accessible entrance",
    "Wheelchair accessible restroom",
    "Wheelchair accessible parking lot",
  ],
  Parking: [
    "Free parking",
    "Parking lot",
    "Street parking",
    "Paid parking",
  ],
  Technology: [
    "Free WiFi",
    "WiFi",
  ],
  Payments: [
    "Accepts credit cards",
    "Accepts insurance",
    "Payment plans available",
  ],
  Languages: [
    "Spanish speaking",
    "Bilingual staff",
  ],
  Environment: [
    "Clean facility",
    "Modern equipment",
    "Private treatment rooms",
    "Comfortable waiting area",
  ],
  Convenience: [
    "Same-day appointments",
    "Evening hours",
    "Weekend hours",
    "Online scheduling",
    "Telehealth available",
  ],
};

/**
 * Build the prompt for extracting clinic amenities from review text and descriptions.
 */
function buildAmenitiesPrompt(clinic: ClinicRecord): string {
  // Truncate review text to 3000 chars to manage prompt size
  const reviewText = clinic.allReviewsText
    ? clinic.allReviewsText.slice(0, 3000)
    : "";
  const description = clinic.businessDescription || clinic.content || "";

  // Format known amenities list for the prompt
  const amenitiesList = Object.entries(KNOWN_AMENITIES)
    .map(([category, items]) => `${category}: ${items.join(", ")}`)
    .join("\n");

  return `You are analyzing a pain management clinic's data to extract amenities and facility features.

TASK:
Extract amenities that are explicitly mentioned or strongly implied in the provided review text and business description.
Only include amenities that have clear evidence in the text.

KNOWN AMENITIES CATEGORIES (use these as hints, but you can discover new relevant amenities):
${amenitiesList}

RULES:
1. Only extract amenities that have clear textual evidence
2. Do NOT invent or assume amenities not mentioned
3. Use short, consistent naming (e.g., "Free WiFi" not "This clinic has free WiFi")
4. Maximum 8 amenities to keep the list focused
5. Prioritize unique/standout amenities over common ones
6. If no clear amenities are found, return an empty array

CLINIC DATA:
Name: ${clinic.title}
Location: ${clinic.city}, ${clinic.stateAbbreviation}

Business Description:
${description || "Not available"}

Review Text:
${reviewText || "No reviews available"}

OUTPUT FORMAT:
Return ONLY a valid JSON array of strings. No explanations, no markdown, no code blocks.
Example: ["Free parking", "Wheelchair accessible", "Same-day appointments"]
If no amenities found: []`;
}

/**
 * Parse AI response to extract amenities array.
 * Handles various response formats and cleans up the result.
 */
function parseAmenitiesResponse(text: string): string[] {
  // Clean up the response
  let cleaned = text.trim();

  // Remove markdown code blocks if present
  cleaned = cleaned.replace(/```json\n?/g, "").replace(/```\n?/g, "");
  cleaned = cleaned.trim();

  try {
    const parsed = JSON.parse(cleaned);

    // Ensure it's an array of strings
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
        .slice(0, 8); // Max 8 items
    }

    return [];
  } catch {
    // If JSON parsing fails, try to extract array-like content
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        const parsed = JSON.parse(arrayMatch[0]);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter((item) => item.length > 0)
            .slice(0, 8);
        }
      } catch {
        // Fall through to return empty array
      }
    }

    console.warn("Failed to parse amenities response:", cleaned);
    return [];
  }
}

/**
 * POST /api/admin/clinics/[clinicId]/automate-amenities
 * Generate AI-extracted amenities for a clinic based on reviews and descriptions.
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

    // Check for available text content
    if (!clinic.allReviewsText && !clinic.businessDescription && !clinic.content) {
      return NextResponse.json(
        { error: "No review text or description available for this clinic" },
        { status: 400 }
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

    // Generate amenities
    const prompt = buildAmenitiesPrompt(clinic);
    const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

    const { text, usage } = await generateText({
      model: openrouter(model),
      prompt,
    });

    // Parse the AI response
    const amenities = parseAmenitiesResponse(text);

    // Save to database
    await db
      .update(clinics)
      .set({
        amenities: amenities.length > 0 ? amenities : null,
        updatedAt: new Date(),
      })
      .where(eq(clinics.id, clinicId));

    // Revalidate the clinic page cache
    if (clinic.permalink) {
      revalidatePath(`/${clinic.permalink}`);
    }

    // Calculate total tokens
    const inputTokens = usage?.inputTokens ?? 0;
    const outputTokens = usage?.outputTokens ?? 0;
    const totalTokens = inputTokens + outputTokens;

    return NextResponse.json({
      success: true,
      amenities,
      usage: {
        promptTokens: inputTokens,
        completionTokens: outputTokens,
        totalTokens,
      },
      clinicId,
      model,
    });
  } catch (error) {
    console.error("Failed to automate clinic amenities:", error);

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
      { error: "Failed to automate clinic amenities" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/clinics/[clinicId]/automate-amenities
 * Check the current amenities status for a clinic.
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

    const currentAmenities = Array.isArray(clinic.amenities)
      ? (clinic.amenities as string[])
      : [];

    return NextResponse.json({
      clinicId,
      title: clinic.title,
      hasAmenities: currentAmenities.length > 0,
      amenities: currentAmenities,
      amenitiesCount: currentAmenities.length,
      hasReviewText: !!clinic.allReviewsText,
      hasDescription: !!(clinic.businessDescription || clinic.content),
    });
  } catch (error) {
    console.error("Failed to fetch clinic amenities status:", error);
    return NextResponse.json(
      { error: "Failed to fetch amenities status" },
      { status: 500 }
    );
  }
}
