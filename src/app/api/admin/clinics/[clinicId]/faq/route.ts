import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { getClinicById } from "@/lib/clinic-queries";
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
 * Validate FAQ item structure.
 */
function isValidFAQItem(item: unknown): item is FAQItem {
  return (
    typeof item === "object" &&
    item !== null &&
    typeof (item as FAQItem).question === "string" &&
    typeof (item as FAQItem).answer === "string" &&
    (item as FAQItem).question.trim().length > 0 &&
    (item as FAQItem).answer.trim().length > 0
  );
}

/**
 * PUT /api/admin/clinics/[clinicId]/faq
 * Update the FAQs for a clinic (add, edit, delete, reorder).
 * Expects a JSON body with { faqs: FAQItem[] }
 * Requires admin authentication.
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  // Auth check (admin only)
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const { clinicId } = await context.params;

  try {
    // Verify clinic exists
    const clinic = await getClinicById(clinicId);
    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { faqs } = body;

    // Validate FAQs array
    if (!Array.isArray(faqs)) {
      return NextResponse.json(
        { error: "faqs must be an array" },
        { status: 400 }
      );
    }

    // Validate each FAQ item and clean/trim content
    const validatedFaqs: FAQItem[] = [];
    for (let i = 0; i < faqs.length; i++) {
      const item = faqs[i];
      if (!isValidFAQItem(item)) {
        return NextResponse.json(
          {
            error: `Invalid FAQ item at index ${i}. Each FAQ must have a non-empty question and answer.`,
          },
          { status: 400 }
        );
      }
      validatedFaqs.push({
        question: item.question.trim(),
        answer: item.answer.trim(),
      });
    }

    // Update the clinic's FAQs
    await db
      .update(clinics)
      .set({
        questions: validatedFaqs,
        updatedAt: new Date(),
      })
      .where(eq(clinics.id, clinicId));

    return NextResponse.json({
      success: true,
      faqs: validatedFaqs,
      faqCount: validatedFaqs.length,
      clinicId,
    });
  } catch (error) {
    console.error("Failed to update clinic FAQs:", error);
    return NextResponse.json(
      { error: "Failed to update clinic FAQs" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/clinics/[clinicId]/faq
 * Get the current FAQs for a clinic.
 * Requires admin authentication.
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
    console.error("Failed to fetch clinic FAQs:", error);
    return NextResponse.json(
      { error: "Failed to fetch FAQs" },
      { status: 500 }
    );
  }
}
