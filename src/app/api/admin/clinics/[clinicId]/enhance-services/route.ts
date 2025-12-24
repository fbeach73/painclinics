import { NextRequest, NextResponse } from "next/server";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { getClinicById, type ClinicRecord } from "@/lib/clinic-queries";
import { getClinicServices } from "@/lib/clinic-services-queries";
import { getAllServices } from "@/lib/services-queries";
import type { Service, ServiceCategory } from "@/types/service";

interface RouteContext {
  params: Promise<{ clinicId: string }>;
}

/**
 * Service suggestion from AI analysis.
 */
export interface ServiceSuggestion {
  serviceId?: string;
  serviceName: string;
  confidence: "high" | "medium" | "low";
  evidence: string;
  isNew: boolean;
  suggestedCategory?: ServiceCategory;
}

/**
 * Response structure for enhance services API.
 */
export interface EnhanceServicesResponse {
  success: boolean;
  existingServices: ServiceSuggestion[];
  suggestedNewServices: ServiceSuggestion[];
  featuredRecommendations: string[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  clinicId: string;
  model: string;
}

/**
 * Format services list for AI prompt.
 */
function formatServicesForPrompt(services: Service[]): string {
  const grouped: Record<string, Service[]> = {};

  for (const service of services) {
    if (!grouped[service.category]) {
      grouped[service.category] = [];
    }
    grouped[service.category]!.push(service);
  }

  return Object.entries(grouped)
    .map(([category, categoryServices]) => {
      const serviceList = categoryServices
        .map((s) => `  - ${s.id}: ${s.name}`)
        .join("\n");
      return `${category.toUpperCase()}:\n${serviceList}`;
    })
    .join("\n\n");
}

/**
 * Build the prompt for AI service suggestions.
 */
function buildServicesPrompt(
  clinic: ClinicRecord,
  allServices: Service[],
  currentServiceIds: string[]
): string {
  // Truncate text to manage prompt size
  const reviewText = clinic.allReviewsText
    ? clinic.allReviewsText.slice(0, 2500)
    : "";
  const description = (clinic.businessDescription || clinic.content || "").slice(0, 1500);
  const checkboxFeatures = Array.isArray(clinic.checkboxFeatures)
    ? (clinic.checkboxFeatures as string[]).join(", ")
    : "None";
  const amenities = Array.isArray(clinic.amenities)
    ? (clinic.amenities as string[]).join(", ")
    : "None";

  const servicesFormatted = formatServicesForPrompt(allServices);
  const currentServicesInfo = currentServiceIds.length > 0
    ? `Currently assigned services (by ID): ${currentServiceIds.join(", ")}`
    : "No services currently assigned";

  return `You are analyzing a pain management clinic to suggest appropriate medical services they may offer.

TASK:
1. Review the clinic data (reviews, description, features, amenities)
2. Match services from our master list that are mentioned or strongly implied
3. Suggest confidence level based on evidence strength
4. Recommend which services should be "featured" (max 8, most prominent services)
5. Suggest any new services not in our list (if clearly mentioned)

MASTER SERVICES LIST (use these IDs when matching):
${servicesFormatted}

${currentServicesInfo}

CLINIC DATA:
Name: ${clinic.title}
Location: ${clinic.city}, ${clinic.stateAbbreviation}
Existing Features: ${checkboxFeatures}
Amenities: ${amenities}

Business Description:
${description || "Not available"}

Patient Reviews:
${reviewText || "No reviews available"}

CONFIDENCE LEVELS:
- "high": Service explicitly mentioned by name or clear description
- "medium": Service strongly implied by treatments or procedures described
- "low": Service might be offered based on context clues

OUTPUT FORMAT:
Return ONLY valid JSON matching this exact structure:
{
  "existingServices": [
    {
      "serviceId": "uuid-from-list",
      "serviceName": "Service Name",
      "confidence": "high|medium|low",
      "evidence": "Brief quote or reason (max 50 chars)"
    }
  ],
  "suggestedNewServices": [
    {
      "serviceName": "New Service Name",
      "confidence": "high|medium|low",
      "evidence": "Brief reason",
      "suggestedCategory": "injection|procedure|physical|diagnostic|management|specialized"
    }
  ],
  "featuredRecommendations": ["serviceId1", "serviceId2"]
}

RULES:
1. Only suggest services with evidence in the data
2. Maximum 8 featured recommendations
3. Keep evidence brief (max 50 characters)
4. For new services, suggest appropriate category
5. Prefer existing services over suggesting new ones
6. Do not include services already assigned to the clinic
7. Return empty arrays if no matches found

OUTPUT: JSON only. No markdown, no explanations.`;
}

/**
 * Parse AI response to extract service suggestions.
 */
function parseServicesResponse(text: string, allServices: Service[]): {
  existingServices: ServiceSuggestion[];
  suggestedNewServices: ServiceSuggestion[];
  featuredRecommendations: string[];
} {
  // Clean up the response
  let cleaned = text.trim();
  cleaned = cleaned.replace(/```json\n?/g, "").replace(/```\n?/g, "");
  cleaned = cleaned.trim();

  const validServiceIds = new Set(allServices.map((s) => s.id));
  const validConfidences = new Set(["high", "medium", "low"]);
  const validCategories = new Set([
    "injection",
    "procedure",
    "physical",
    "diagnostic",
    "management",
    "specialized",
  ]);

  try {
    const parsed = JSON.parse(cleaned);

    // Parse existing services
    const existingServices: ServiceSuggestion[] = [];
    if (Array.isArray(parsed.existingServices)) {
      for (const item of parsed.existingServices) {
        if (
          item.serviceId &&
          validServiceIds.has(item.serviceId) &&
          validConfidences.has(item.confidence)
        ) {
          existingServices.push({
            serviceId: item.serviceId,
            serviceName: String(item.serviceName || ""),
            confidence: item.confidence as "high" | "medium" | "low",
            evidence: String(item.evidence || "").slice(0, 100),
            isNew: false,
          });
        }
      }
    }

    // Parse new service suggestions
    const suggestedNewServices: ServiceSuggestion[] = [];
    if (Array.isArray(parsed.suggestedNewServices)) {
      for (const item of parsed.suggestedNewServices) {
        if (
          item.serviceName &&
          validConfidences.has(item.confidence)
        ) {
          const suggestion: ServiceSuggestion = {
            serviceName: String(item.serviceName),
            confidence: item.confidence as "high" | "medium" | "low",
            evidence: String(item.evidence || "").slice(0, 100),
            isNew: true,
          };
          if (validCategories.has(item.suggestedCategory)) {
            suggestion.suggestedCategory = item.suggestedCategory as ServiceCategory;
          }
          suggestedNewServices.push(suggestion);
        }
      }
    }

    // Parse featured recommendations
    const featuredRecommendations: string[] = [];
    if (Array.isArray(parsed.featuredRecommendations)) {
      for (const id of parsed.featuredRecommendations) {
        if (typeof id === "string" && validServiceIds.has(id)) {
          featuredRecommendations.push(id);
        }
      }
    }

    return {
      existingServices: existingServices.slice(0, 20),
      suggestedNewServices: suggestedNewServices.slice(0, 5),
      featuredRecommendations: featuredRecommendations.slice(0, 8),
    };
  } catch {
    // Try to extract JSON from the response
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return parseServicesResponse(jsonMatch[0], allServices);
      } catch {
        // Fall through to return empty result
      }
    }

    console.warn("Failed to parse services response:", cleaned);
    return {
      existingServices: [],
      suggestedNewServices: [],
      featuredRecommendations: [],
    };
  }
}

/**
 * POST /api/admin/clinics/[clinicId]/enhance-services
 * Generate AI-suggested services for a clinic based on reviews and descriptions.
 * Returns suggestions for user approval - does NOT auto-save.
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

    // Fetch all services and current clinic services
    const [allServices, clinicServices] = await Promise.all([
      getAllServices(true), // Only active services
      getClinicServices(clinicId),
    ]);

    if (allServices.length === 0) {
      return NextResponse.json(
        { error: "No services configured in the system" },
        { status: 400 }
      );
    }

    // Get IDs of currently assigned services to exclude from suggestions
    const currentServiceIds = clinicServices.map((cs) => cs.serviceId);

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

    // Generate service suggestions
    const prompt = buildServicesPrompt(clinic, allServices, currentServiceIds);
    const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

    const { text, usage } = await generateText({
      model: openrouter(model),
      prompt,
    });

    // Parse the AI response
    const suggestions = parseServicesResponse(text, allServices);

    // Calculate total tokens
    const inputTokens = usage?.inputTokens ?? 0;
    const outputTokens = usage?.outputTokens ?? 0;
    const totalTokens = inputTokens + outputTokens;

    const response: EnhanceServicesResponse = {
      success: true,
      existingServices: suggestions.existingServices,
      suggestedNewServices: suggestions.suggestedNewServices,
      featuredRecommendations: suggestions.featuredRecommendations,
      usage: {
        promptTokens: inputTokens,
        completionTokens: outputTokens,
        totalTokens,
      },
      clinicId,
      model,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to enhance clinic services:", error);

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
      { error: "Failed to enhance clinic services" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/clinics/[clinicId]/enhance-services
 * Get the current services status for a clinic.
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
    const [clinic, clinicServices] = await Promise.all([
      getClinicById(clinicId),
      getClinicServices(clinicId),
    ]);

    if (!clinic) {
      return NextResponse.json(
        { error: "Clinic not found" },
        { status: 404 }
      );
    }

    const featuredCount = clinicServices.filter((cs) => cs.isFeatured).length;

    return NextResponse.json({
      clinicId,
      title: clinic.title,
      totalServices: clinicServices.length,
      featuredServices: featuredCount,
      services: clinicServices.map((cs) => ({
        serviceId: cs.serviceId,
        serviceName: cs.service?.name || "Unknown",
        category: cs.service?.category || "specialized",
        isFeatured: cs.isFeatured,
      })),
      hasReviewText: !!clinic.allReviewsText,
      hasDescription: !!(clinic.businessDescription || clinic.content),
    });
  } catch (error) {
    console.error("Failed to fetch clinic services status:", error);
    return NextResponse.json(
      { error: "Failed to fetch services status" },
      { status: 500 }
    );
  }
}
