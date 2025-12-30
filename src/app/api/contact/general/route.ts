import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendGeneralContactEmail } from "@/lib/email";
import { verifyTurnstile } from "@/lib/turnstile";

const generalContactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  turnstileToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify Turnstile token
    const isValidCaptcha = await verifyTurnstile(body.turnstileToken);
    if (!isValidCaptcha) {
      return NextResponse.json(
        { success: false, error: "Captcha verification failed. Please try again." },
        { status: 400 }
      );
    }

    const validationResult = generalContactSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      const firstError = Object.values(errors).flat()[0] || "Validation failed";
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    const submittedAt = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
      dateStyle: "full",
      timeStyle: "short",
    });

    const result = await sendGeneralContactEmail({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      subject: data.subject,
      message: data.message,
      submittedAt,
    });

    if (!result.success) {
      console.error("Failed to send general contact email:", result.error);
      return NextResponse.json(
        { success: false, error: "Failed to send your message. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Your message has been sent successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing general contact form:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
