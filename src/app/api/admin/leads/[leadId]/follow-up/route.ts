import { NextRequest, NextResponse } from "next/server";
import { renderLeadFollowUpEmail, EMAIL_TEMPLATES } from "@/emails";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { sendEmail, HELLO_FROM_EMAIL } from "@/lib/email";
import { getLeadById, markLeadFollowedUp } from "@/lib/lead-queries";

interface RouteParams {
  params: Promise<{ leadId: string }>;
}

/**
 * POST /api/admin/leads/[leadId]/follow-up
 * Send a follow-up email to the clinic about this lead
 *
 * Body: {
 *   message: string  // Custom message to include in the email
 * }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const { leadId } = await params;

  if (!leadId) {
    return NextResponse.json(
      { error: "Lead ID is required" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Get lead with clinic details
    const lead = await getLeadById(leadId);

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Get clinic email - use the first email in the array, or fall back to admin
    const clinicEmail = lead.clinic.emails?.[0];
    if (!clinicEmail) {
      return NextResponse.json(
        { error: "Clinic has no email address on file" },
        { status: 400 }
      );
    }

    // Format submission date
    const submissionDate = new Date(lead.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    // Render email HTML using React Email template
    const html = await renderLeadFollowUpEmail({
      clinicName: lead.clinic.title,
      clinicCity: lead.clinic.city,
      clinicState: lead.clinic.stateAbbreviation || "",
      patientName: lead.patientName,
      patientEmail: lead.patientEmail,
      patientPhone: lead.patientPhone,
      submissionDate,
      customMessage: message.trim(),
    });

    // Send email from hello@painclinics.com for follow-ups
    const emailResult = await sendEmail({
      to: clinicEmail,
      subject: "Follow-up: Patient Inquiry from PainClinics.com",
      html,
      templateName: EMAIL_TEMPLATES.LEAD_FOLLOW_UP,
      from: HELLO_FROM_EMAIL,
      metadata: {
        leadId,
        clinicId: lead.clinicId,
        patientEmail: lead.patientEmail,
      },
    });

    if (!emailResult.success) {
      console.error("Failed to send follow-up email:", emailResult.error);
      return NextResponse.json(
        { error: "Failed to send follow-up email" },
        { status: 500 }
      );
    }

    // Mark lead as followed up
    await markLeadFollowedUp(leadId, emailResult.logId);

    return NextResponse.json({
      success: true,
      emailLogId: emailResult.logId,
      sentTo: clinicEmail,
    });
  } catch (error) {
    console.error("Error sending follow-up email:", error);
    return NextResponse.json(
      { error: "Failed to send follow-up email" },
      { status: 500 }
    );
  }
}
