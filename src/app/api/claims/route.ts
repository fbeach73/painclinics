import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { createClaim, getUserClaims } from "@/lib/claim-queries";
import {
  checkClaimRateLimit,
  recordClaimAttempt,
  canUserClaimClinic,
} from "@/lib/claim-rate-limit";
import { db } from "@/lib/db";
import { sendClaimSubmittedEmail } from "@/lib/email";
import { clinics } from "@/lib/schema";
import { verifyTurnstile } from "@/lib/turnstile";

const VALID_ROLES = ["owner", "manager", "authorized_representative"] as const;

/**
 * GET /api/claims
 * Get the authenticated user's claim submissions
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const claims = await getUserClaims(session.user.id);
    return NextResponse.json({ claims });
  } catch (error) {
    console.error("Error fetching user claims:", error);
    return NextResponse.json(
      { error: "Failed to fetch claims" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/claims
 * Submit a new claim for a clinic
 *
 * Body: {
 *   clinicId: string,
 *   fullName: string,
 *   role: "owner" | "manager" | "authorized_representative",
 *   businessEmail: string,
 *   businessPhone: string,
 *   additionalNotes?: string
 * }
 */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get client IP and user agent for anti-fraud tracking
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || "unknown";
  const userAgent = headersList.get("user-agent") ?? undefined;

  try {
    // Parse and validate request body
    const body = await request.json();
    const { clinicId, fullName, role, businessEmail, businessPhone, additionalNotes, turnstileToken } = body;

    // Verify Turnstile token
    const isValidCaptcha = await verifyTurnstile(turnstileToken);
    if (!isValidCaptcha) {
      return NextResponse.json(
        { error: "Captcha verification failed. Please try again." },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!clinicId || typeof clinicId !== "string") {
      return NextResponse.json(
        { error: "Clinic ID is required" },
        { status: 400 }
      );
    }

    if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2) {
      return NextResponse.json(
        { error: "Full name is required (minimum 2 characters)" },
        { status: 400 }
      );
    }

    if (!role || !VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `Role must be one of: ${VALID_ROLES.join(", ")}` },
        { status: 400 }
      );
    }

    if (!businessEmail || typeof businessEmail !== "string") {
      return NextResponse.json(
        { error: "Business email is required" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(businessEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    if (!businessPhone || typeof businessPhone !== "string" || businessPhone.length < 10) {
      return NextResponse.json(
        { error: "Business phone is required (minimum 10 characters)" },
        { status: 400 }
      );
    }

    // Check IP-based rate limit
    const rateLimit = await checkClaimRateLimit(ipAddress);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: `You have submitted too many claims. Please try again after ${rateLimit.resetAt.toLocaleString()}.`,
          resetAt: rateLimit.resetAt.toISOString(),
        },
        { status: 429 }
      );
    }

    // Check user eligibility to claim this clinic
    const eligibility = await canUserClaimClinic(session.user.id, clinicId);
    if (!eligibility.allowed) {
      return NextResponse.json(
        { error: eligibility.reason || "You cannot claim this clinic" },
        { status: 403 }
      );
    }

    // Create the claim
    const createdClaim = await createClaim({
      clinicId,
      userId: session.user.id,
      fullName: fullName.trim(),
      role,
      businessEmail: businessEmail.trim().toLowerCase(),
      businessPhone: businessPhone.trim(),
      additionalNotes: additionalNotes?.trim() || undefined,
      ipAddress,
      userAgent,
    });

    // Record the claim attempt for rate limiting
    await recordClaimAttempt(ipAddress);

    // Get clinic name for email
    const [clinic] = await db
      .select({ title: clinics.title })
      .from(clinics)
      .where(eq(clinics.id, clinicId))
      .limit(1);

    // Send confirmation email to the claimant
    try {
      await sendClaimSubmittedEmail(
        businessEmail.trim().toLowerCase(),
        clinic?.title || "your clinic",
        {
          userId: session.user.id,
          clinicId,
          claimId: createdClaim.id,
        }
      );
    } catch (emailError) {
      // Log but don't fail the request if email fails
      console.error("Failed to send claim confirmation email:", emailError);
    }

    return NextResponse.json(
      {
        claim: {
          id: createdClaim.id,
          clinicId: createdClaim.clinicId,
          status: createdClaim.status,
          createdAt: createdClaim.createdAt,
        },
        message: "Claim submitted successfully. We will review your request within 1-2 business days.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting claim:", error);
    return NextResponse.json(
      { error: "Failed to submit claim" },
      { status: 500 }
    );
  }
}
