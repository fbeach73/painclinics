import { NextRequest, NextResponse } from "next/server";

/**
 * Validate the newsletter API key from X-API-Key header.
 * Returns null if valid, or an error response if invalid.
 */
export function validateNewsletterApiKey(
  request: NextRequest
): NextResponse | null {
  const apiKey = request.headers.get("X-API-Key");
  const expectedKey = process.env.NEWSLETTER_API_KEY;

  if (!expectedKey) {
    console.error("NEWSLETTER_API_KEY environment variable is not set");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  if (!apiKey || apiKey !== expectedKey) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  return null;
}
