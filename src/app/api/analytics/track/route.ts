import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { isBot, isRateLimited } from "@/lib/analytics/bot-filter";
import { categorizeReferrer } from "@/lib/analytics/referrer-utils";
import { generateSessionHash, getEventDate } from "@/lib/analytics/session-hash";
import { db } from "@/lib/db";
import { analyticsEvents } from "@/lib/schema";

interface TrackRequest {
  eventType: "pageview" | "clinic_view" | "ab_test" | "phone_click" | "directions_click" | "website_click";
  path: string;
  clinicId?: string;
  referrer?: string;
  fingerprint: string;
  variant?: string; // For A/B test events
}

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const userAgent = headersList.get("user-agent");

    // Silently ignore bot traffic
    if (isBot(userAgent)) {
      return NextResponse.json({ success: true });
    }

    const body = (await request.json()) as TrackRequest;

    // Validate required fields
    if (!body.eventType || !body.path || !body.fingerprint) {
      return NextResponse.json(
        { error: "Missing required fields: eventType, path, fingerprint" },
        { status: 400 }
      );
    }

    // Validate eventType
    const validEventTypes = ["pageview", "clinic_view", "ab_test", "phone_click", "directions_click", "website_click"];
    if (!validEventTypes.includes(body.eventType)) {
      return NextResponse.json(
        { error: `Invalid eventType. Must be one of: ${validEventTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // These event types require clinicId
    const clinicRequiredTypes = ["clinic_view", "phone_click", "directions_click", "website_click"];
    if (clinicRequiredTypes.includes(body.eventType) && !body.clinicId) {
      return NextResponse.json(
        { error: "clinicId is required for clinic interaction events" },
        { status: 400 }
      );
    }

    // ab_test requires variant
    if (body.eventType === "ab_test" && !body.variant) {
      return NextResponse.json(
        { error: "variant is required for ab_test events" },
        { status: 400 }
      );
    }

    // Get client IP for session hashing
    const forwardedFor = headersList.get("x-forwarded-for");
    const ipAddress = forwardedFor?.split(",")[0]?.trim() || null;

    // Get current host for internal referrer detection
    const host = headersList.get("host") || "";

    // Categorize the referrer
    const { source: referrerSource, domain: referrerDomain } = categorizeReferrer(
      body.referrer,
      host
    );

    // Generate privacy-preserving session hash
    const sessionHash = await generateSessionHash(body.fingerprint, ipAddress);

    // Check rate limiting (silently ignore high-frequency sessions - likely bots)
    if (isRateLimited(sessionHash)) {
      return NextResponse.json({ success: true });
    }

    // Get event date for grouping
    const eventDate = getEventDate();

    // Insert the analytics event
    await db.insert(analyticsEvents).values({
      eventType: body.eventType,
      path: body.path,
      clinicId: body.clinicId || null,
      referrer: body.referrer || null,
      // For ab_test events, store variant in referrerSource
      referrerSource: body.eventType === "ab_test" ? body.variant : referrerSource,
      referrerDomain: body.eventType === "ab_test" ? null : referrerDomain,
      sessionHash,
      eventDate,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking analytics event:", error);
    // Return success anyway to not break client
    // Analytics failures should be silent
    return NextResponse.json({ success: true });
  }
}
