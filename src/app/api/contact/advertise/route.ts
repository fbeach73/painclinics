import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { sendAdvertiseInquiryEmail } from "@/lib/email";

const advertiseInquirySchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
  companyType: z.string().min(1, "Company type is required"),
  interestArea: z.string().min(1, "Interest area is required"),
  budget: z.string().optional(),
  message: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validationResult = advertiseInquirySchema.safeParse(body);
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

    const result = await sendAdvertiseInquiryEmail({
      companyName: data.companyName,
      contactName: data.contactName,
      email: data.email,
      phone: data.phone,
      companyType: data.companyType,
      interestArea: data.interestArea,
      budget: data.budget,
      message: data.message,
      submittedAt,
    });

    if (!result.success) {
      console.error("Failed to send advertising inquiry email:", result.error);
      return NextResponse.json(
        { success: false, error: "Failed to send your inquiry. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Your inquiry has been sent successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing advertising inquiry:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
