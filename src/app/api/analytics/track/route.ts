import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { isBot, isRateLimited } from "@/lib/analytics/bot-filter";
import { categorizeReferrer } from "@/lib/analytics/referrer-utils";
import { generateSessionHash, getEventDate } from "@/lib/analytics/session-hash";
import { db } from "@/lib/db";
import { analyticsEvents } from "@/lib/schema";

interface TrackRequest {
  eventType: "pageview" | "clinic_view";
  path: string;
  clinicId?: string;
  referrer?: string;
  fingerprint: string;
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
    if (!["pageview", "clinic_view"].includes(body.eventType)) {
      return NextResponse.json(
        { error: "Invalid eventType. Must be 'pageview' or 'clinic_view'" },
        { status: 400 }
      );
    }

    // clinic_view requires clinicId
    if (body.eventType === "clinic_view" && !body.clinicId) {
      return NextResponse.json(
        { error: "clinicId is required for clinic_view events" },
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
      referrerSource,
      referrerDomain,
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
