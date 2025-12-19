import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getClinicById } from "@/lib/clinic-queries";
import { sendContactClinicInquiryEmail, sendInquiryConfirmationEmail } from "@/lib/email";

/**
 * Zod validation schema for contact form data
 */
const contactFormSchema = z.object({
  clinicId: z.string().min(1, "Clinic ID is required"),
  painType: z.string().min(1, "Pain type is required"),
  painDuration: z.string().min(1, "Pain duration is required"),
  previousTreatment: z.string().min(1, "Previous treatment info is required"),
  insurance: z.string().min(1, "Insurance status is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  email: z.string().email("Please enter a valid email"),
  preferredContactTime: z.enum(["morning", "afternoon", "evening", "anytime"], {
    error: "Please select a preferred contact time",
  }),
  additionalInfo: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

/**
 * POST /api/contact
 * Submit a contact inquiry for a clinic
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate with Zod
    const validationResult = contactFormSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      const firstError = Object.values(errors).flat()[0] || "Validation failed";
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      );
    }

    const data: ContactFormData = validationResult.data;

    // Fetch clinic data
    const clinic = await getClinicById(data.clinicId);
    if (!clinic) {
      return NextResponse.json(
        { success: false, error: "Clinic not found" },
        { status: 404 }
      );
    }

    // Format preferred contact time for display
    const contactTimeLabels: Record<string, string> = {
      morning: "Morning (9am-12pm)",
      afternoon: "Afternoon (12pm-5pm)",
      evening: "Evening (5pm-8pm)",
      anytime: "Anytime",
    };

    // Get the first clinic email (emails is an array)
    const clinicEmail = clinic.emails?.[0] || null;

    // Get clinic phone (use first from array if available, fallback to single phone)
    const clinicPhone = clinic.phones?.[0] || clinic.phone || undefined;

    // Send email to clinic (with BCC to admin)
    const emailResult = await sendContactClinicInquiryEmail(
      clinicEmail,
      {
        clinicName: clinic.title,
        clinicCity: clinic.city,
        clinicState: clinic.stateAbbreviation || "",
        ...(clinicPhone && { clinicPhone }),
        ...(clinic.website && { clinicWebsite: clinic.website }),
        ...(clinic.permalink && { clinicPermalink: clinic.permalink }),
        patientName: data.name,
        patientEmail: data.email,
        patientPhone: data.phone,
        preferredContactTime: contactTimeLabels[data.preferredContactTime] || data.preferredContactTime,
        additionalInfo: data.additionalInfo || "",
        painType: data.painType,
        painDuration: data.painDuration,
        previousTreatment: data.previousTreatment,
        insuranceStatus: data.insurance,
        submittedAt: new Date().toLocaleString("en-US", {
          timeZone: "America/New_York",
          dateStyle: "full",
          timeStyle: "short",
        }),
      }
    );

    if (!emailResult.success) {
      console.error("Failed to send contact inquiry email:", {
        error: emailResult.error,
        clinicId: data.clinicId,
        clinicEmail,
        clinicName: clinic.title,
      });
      return NextResponse.json(
        { success: false, error: "Failed to send your inquiry. Please try again." },
        { status: 500 }
      );
    }

    // Send confirmation email to patient (don't fail the request if this fails)
    const submittedAt = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
      dateStyle: "full",
      timeStyle: "short",
    });

    const confirmationResult = await sendInquiryConfirmationEmail(
      data.email,
      {
        patientName: data.name,
        clinicName: clinic.title,
        clinicCity: clinic.city,
        clinicState: clinic.stateAbbreviation || "",
        submittedAt,
      }
    );

    if (!confirmationResult.success) {
      // Log but don't fail the request - the main inquiry was sent successfully
      console.error("Failed to send confirmation email to patient:", {
        error: confirmationResult.error,
        patientEmail: data.email,
      });
    }

    return NextResponse.json(
      { success: true, message: "Your inquiry has been sent successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing contact inquiry:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
