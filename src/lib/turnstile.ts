/**
 * Cloudflare Turnstile server-side verification
 *
 * Usage in API routes:
 * ```ts
 * import { verifyTurnstile } from "@/lib/turnstile";
 *
 * const { turnstileToken, ...data } = await request.json();
 *
 * const isValid = await verifyTurnstile(turnstileToken);
 * if (!isValid) {
 *   return NextResponse.json({ error: "Invalid captcha" }, { status: 400 });
 * }
 * ```
 */

const SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || "";
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
}

/**
 * Verify a Turnstile token on the server side.
 *
 * @param token - The token from the client-side Turnstile widget
 * @returns true if valid, false if invalid or error
 */
export async function verifyTurnstile(token: string | null | undefined): Promise<boolean> {
  // In development without keys, allow all requests
  if (!SECRET_KEY) {
    if (process.env.NODE_ENV === "development") {
      return true;
    }
    console.error("TURNSTILE_SECRET_KEY is not configured");
    return false;
  }

  if (!token) {
    return false;
  }

  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret: SECRET_KEY,
        response: token,
      }),
    });

    const data: TurnstileVerifyResponse = await response.json();

    if (!data.success) {
      console.warn("Turnstile verification failed:", data["error-codes"]);
    }

    return data.success;
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return false;
  }
}
