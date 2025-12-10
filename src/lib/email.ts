import FormData from "form-data";
import Mailgun from "mailgun.js";

const mailgun = new Mailgun(FormData);

const mg =
  process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN
    ? mailgun.client({
        username: "api",
        key: process.env.MAILGUN_API_KEY,
      })
    : null;

const FROM_EMAIL = "Pain Clinics Directory <noreply@painclinics.com>";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!mg || !process.env.MAILGUN_DOMAIN) {
    console.warn("Mailgun not configured. Email not sent:", { to, subject });
    return null;
  }

  return mg.messages.create(process.env.MAILGUN_DOMAIN, {
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });
}

// ============================================
// Email Template Functions
// ============================================

export async function sendClaimSubmittedEmail(to: string, clinicName: string) {
  const subject = `Claim Request Received - ${clinicName}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
        .highlight { background: #dbeafe; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .footer { margin-top: 20px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Claim Request Received</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>We have received your ownership claim request for:</p>
          <div class="highlight">
            <strong>${clinicName}</strong>
          </div>
          <p><strong>What happens next?</strong></p>
          <ul>
            <li>Our team will review your claim within 1-2 business days</li>
            <li>We may contact you to verify your ownership</li>
            <li>You'll receive an email once your claim is approved or if we need additional information</li>
          </ul>
          <p>Thank you for claiming your listing on Pain Clinics Directory!</p>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Pain Clinics Directory</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}

export async function sendClaimApprovedEmail(
  to: string,
  clinicName: string,
  dashboardUrl: string
) {
  const subject = `Claim Approved - ${clinicName}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #16a34a; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
        .highlight { background: #dcfce7; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
        .footer { margin-top: 20px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Congratulations! Claim Approved</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>Great news! Your ownership claim for the following listing has been approved:</p>
          <div class="highlight">
            <strong>${clinicName}</strong>
          </div>
          <p>You now have full access to manage your listing, including:</p>
          <ul>
            <li>Update business hours and contact information</li>
            <li>Add photos and services</li>
            <li>Respond to reviews</li>
            <li>Upgrade to a Featured Listing for more visibility</li>
          </ul>
          <p>
            <a href="${dashboardUrl}" class="button" style="color: white;">Go to Your Dashboard</a>
          </p>
          <p>Thank you for being part of Pain Clinics Directory!</p>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Pain Clinics Directory</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}

export async function sendClaimRejectedEmail(
  to: string,
  clinicName: string,
  reason: string
) {
  const subject = `Claim Request Update - ${clinicName}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
        .highlight { background: #fef2f2; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #fecaca; }
        .footer { margin-top: 20px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Claim Request Update</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>We have reviewed your ownership claim for:</p>
          <div class="highlight">
            <strong>${clinicName}</strong>
          </div>
          <p>Unfortunately, we were unable to approve your claim at this time.</p>
          <p><strong>Reason:</strong></p>
          <p>${reason}</p>
          <p>If you believe this decision was made in error, please contact our support team with additional documentation to verify your ownership.</p>
          <p>You may submit a new claim request after 30 days.</p>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Pain Clinics Directory</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}

export async function sendFeaturedConfirmedEmail(
  to: string,
  clinicName: string,
  tier: "basic" | "premium"
) {
  const tierLabel = tier === "premium" ? "Premium" : "Basic";
  const tierColor = tier === "premium" ? "#fbbf24" : "#60a5fa";
  const subject = `Featured Listing Activated - ${clinicName}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${tierColor}; color: ${tier === "premium" ? "#1f2937" : "white"}; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
        .highlight { background: #fffbeb; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #fde68a; }
        .badge { display: inline-block; background: ${tierColor}; color: ${tier === "premium" ? "#1f2937" : "white"}; padding: 4px 12px; border-radius: 9999px; font-weight: bold; font-size: 14px; }
        .footer { margin-top: 20px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">${tier === "premium" ? "Premium" : "Featured"} Listing Activated!</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>Your ${tierLabel} featured listing is now active for:</p>
          <div class="highlight">
            <strong>${clinicName}</strong>
            <br><br>
            <span class="badge">${tierLabel} Featured</span>
          </div>
          <p><strong>Your listing now includes:</strong></p>
          <ul>
            ${tier === "premium" ? "<li>Priority placement in search results</li>" : ""}
            <li>Featured badge on your listing</li>
            <li>Highlighted display in search results</li>
            <li>Featured marker on the map</li>
            ${tier === "premium" ? "<li>Larger map marker for maximum visibility</li>" : ""}
          </ul>
          <p>Your subscription will automatically renew each month. You can manage your subscription from your dashboard.</p>
          <p>Thank you for choosing Pain Clinics Directory!</p>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Pain Clinics Directory</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}

export async function sendPaymentFailedEmail(to: string, clinicName: string) {
  const subject = `Payment Failed - Action Required for ${clinicName}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f97316; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
        .highlight { background: #fff7ed; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #fed7aa; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
        .footer { margin-top: 20px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Payment Failed - Action Required</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>We were unable to process your payment for the featured listing:</p>
          <div class="highlight">
            <strong>${clinicName}</strong>
          </div>
          <p><strong>What this means:</strong></p>
          <ul>
            <li>Your featured listing may be paused until payment is resolved</li>
            <li>Your listing will remain visible but without featured benefits</li>
          </ul>
          <p><strong>To resolve this:</strong></p>
          <ol>
            <li>Go to your dashboard and update your payment method</li>
            <li>Ensure your card has sufficient funds</li>
            <li>We will automatically retry the payment</li>
          </ol>
          <p>If you have any questions, please contact our support team.</p>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Pain Clinics Directory</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}

export async function sendSubscriptionCanceledEmail(
  to: string,
  clinicName: string,
  endDate: Date
) {
  const formattedDate = endDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const subject = `Subscription Canceled - ${clinicName}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #6b7280; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
        .highlight { background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .footer { margin-top: 20px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Subscription Canceled</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>Your featured listing subscription has been canceled for:</p>
          <div class="highlight">
            <strong>${clinicName}</strong>
          </div>
          <p>Your featured status will remain active until <strong>${formattedDate}</strong>.</p>
          <p>After this date, your listing will return to standard visibility.</p>
          <p>If you change your mind, you can resubscribe at any time from your dashboard.</p>
          <p>Thank you for using Pain Clinics Directory.</p>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Pain Clinics Directory</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}
