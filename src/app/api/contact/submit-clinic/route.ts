import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendSubmitClinicEmail } from "@/lib/email";
import { verifyTurnstile } from "@/lib/turnstile";

const submitClinicSchema = z.object({
  clinicName: z.string().min(1, "Clinic name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  contactEmail: z.string().email("Please enter a valid email"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required").max(2, "Use 2-letter state code"),
  zip: z.string().min(5, "ZIP code is required"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  website: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  services: z.string().optional(),
  additionalInfo: z.string().optional(),
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

    const validationResult = submitClinicSchema.safeParse(body);
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

    const result = await sendSubmitClinicEmail({
      clinicName: data.clinicName,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      address: data.address,
      city: data.city,
      state: data.state.toUpperCase(),
      zip: data.zip,
      phone: data.phone,
      website: data.website || undefined,
      services: data.services || undefined,
      additionalInfo: data.additionalInfo || undefined,
      submittedAt,
    });

    if (!result.success) {
      console.error("Failed to send clinic submission email:", result.error);
      return NextResponse.json(
        { success: false, error: "Failed to submit your clinic. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Your clinic has been submitted successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing clinic submission:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
