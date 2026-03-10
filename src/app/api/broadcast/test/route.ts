import { NextRequest, NextResponse } from "next/server";
import { validateNewsletterApiKey } from "@/lib/newsletter/auth";
import { sendEmail, getUnsubscribeUrl } from "@/lib/email";

export async function POST(request: NextRequest) {
  const authError = validateNewsletterApiKey(request);
  if (authError) return authError;

  let body: {
    subject?: string;
    html_content?: string;
    plain_text?: string;
    preview_text?: string;
    to?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate required fields
  if (!body.subject || typeof body.subject !== "string") {
    return NextResponse.json({ error: "Missing required field: subject" }, { status: 400 });
  }
  if (!body.html_content || typeof body.html_content !== "string") {
    return NextResponse.json({ error: "Missing required field: html_content" }, { status: 400 });
  }
  if (!body.plain_text || typeof body.plain_text !== "string") {
    return NextResponse.json({ error: "Missing required field: plain_text" }, { status: 400 });
  }
  if (!body.to || typeof body.to !== "string") {
    return NextResponse.json({ error: "Missing required field: to" }, { status: 400 });
  }

  // Basic email validation
  if (!body.to.includes("@")) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  try {
    // Add a test unsubscribe link for preview purposes
    const testUnsubscribeUrl = getUnsubscribeUrl("test-preview");
    let html = body.html_content;

    // Inject unsubscribe footer if not present
    if (!html.includes("unsubscribe") && !html.includes("Unsubscribe")) {
      const footer = `
<div style="text-align: center; padding: 20px 0 10px; margin-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
  <p style="margin: 0 0 8px;">Pain Clinics Directory · 123 Main St · Anytown, USA</p>
  <p style="margin: 0;"><a href="${testUnsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a></p>
</div>`;

      if (html.includes("</body>")) {
        html = html.replace("</body>", `${footer}</body>`);
      } else {
        html = html + footer;
      }
    }

    const result = await sendEmail({
      to: body.to,
      subject: `[TEST] ${body.subject}`,
      html,
      templateName: "newsletter_test",
      from: "Pain Clinics Directory <hello@painclinics.com>",
    });

    if (!result.success) {
      return NextResponse.json({ error: "Failed to send test email" }, { status: 500 });
    }

    return NextResponse.json({
      status: "sent",
      to: body.to,
    });
  } catch (error) {
    console.error("Failed to send test email:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
