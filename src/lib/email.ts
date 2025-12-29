import { createId } from "@paralleldrive/cuid2";
import FormData from "form-data";
import Mailgun from "mailgun.js";
import {
  renderAdvertiseInquiryEmail,
  renderClaimVerificationEmail,
  renderClaimApprovedEmail,
  renderClaimPendingAdminEmail,
  renderClaimRejectedEmail,
  renderContactClinicInquiryEmail,
  renderFeaturedWelcomeEmail,
  renderFeaturedRenewalEmail,
  renderGeneralContactEmail,
  renderInquiryConfirmationEmail,
  renderPaymentFailedEmail,
  renderSubmitClinicEmail,
  renderSubscriptionCanceledEmail,
  renderWelcomeEmail,
  renderPasswordResetEmail,
  EMAIL_TEMPLATES,
  type AdvertiseInquiryProps,
  type ClaimVerificationProps,
  type ClaimApprovedProps,
  type ClaimPendingAdminProps,
  type ClaimRejectedProps,
  type ContactClinicInquiryProps,
  type FeaturedWelcomeProps,
  type FeaturedRenewalProps,
  type GeneralContactProps,
  type InquiryConfirmationProps,
  type PaymentFailedProps,
  type SubmitClinicProps,
  type SubscriptionCanceledProps,
  type WelcomeProps,
  type PasswordResetProps,
  type EmailTemplateName,
} from "@/emails";
import { createEmailLog, updateEmailLog } from "./email-logger";

const mailgun = new Mailgun(FormData);

const mg =
  process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN
    ? mailgun.client({
        username: "api",
        key: process.env.MAILGUN_API_KEY,
        // Use EU endpoint if MAILGUN_REGION=eu is set
        ...(process.env.MAILGUN_REGION === "eu" && { url: "https://api.eu.mailgun.net" }),
      })
    : null;

const FROM_EMAIL = "Pain Clinics Directory <noreply@painclinics.com>";

// ============================================
// Unsubscribe Token Utilities
// ============================================

export function generateUnsubscribeToken(): string {
  return createId();
}

export function getUnsubscribeUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://painclinics.com";
  return `${baseUrl}/unsubscribe/${token}`;
}

// ============================================
// Core Email Sending Function
// ============================================

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  templateName: EmailTemplateName | string;
  userId?: string | undefined;
  metadata?: Record<string, string> | undefined;
  bcc?: string | undefined;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string | undefined;
  logId: string;
  error?: unknown;
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const { to, subject, html, templateName, userId, metadata, bcc } = options;

  // Create log entry
  const logId = await createEmailLog({
    userId,
    recipientEmail: to,
    templateName,
    subject,
    metadata,
  });

  try {
    if (!mg || !process.env.MAILGUN_DOMAIN) {
      console.warn("Mailgun not configured. Email not sent:", { to, subject });
      await updateEmailLog(logId, {
        status: "failed",
        errorMessage: "Mailgun not configured",
      });
      return { success: false, logId, error: new Error("Mailgun not configured") };
    }

    const result = await mg.messages.create(process.env.MAILGUN_DOMAIN, {
      from: FROM_EMAIL,
      to,
      subject,
      html,
      ...(bcc && { bcc }),
    });

    await updateEmailLog(logId, {
      mailgunMessageId: result.id,
      status: "delivered",
    });

    return { success: true, messageId: result.id, logId };
  } catch (error) {
    // Extract detailed error information from Mailgun response
    const extractErrorDetails = (err: unknown): {
      message: string;
      status?: number;
      statusText?: string;
      details?: string;
      type?: string;
    } => {
      if (!err || typeof err !== "object") {
        return { message: String(err) || "Unknown error" };
      }

      const e = err as Record<string, unknown>;

      // Mailgun errors typically have status and details
      const status = typeof e.status === "number" ? e.status : undefined;
      const statusText = typeof e.statusText === "string" ? e.statusText : undefined;
      const type = typeof e.type === "string" ? e.type : undefined;

      // Try to get message from various possible locations
      let message = "Unknown error";
      if (typeof e.message === "string") {
        message = e.message;
      } else if (e.details && typeof e.details === "string") {
        message = e.details;
      } else if (e.error && typeof e.error === "string") {
        message = e.error;
      }

      // Additional details might be in response body
      let details: string | undefined;
      if (e.body && typeof e.body === "object") {
        details = JSON.stringify(e.body);
      } else if (e.response && typeof e.response === "object") {
        const resp = e.response as Record<string, unknown>;
        if (resp.body) {
          details = typeof resp.body === "string" ? resp.body : JSON.stringify(resp.body);
        }
      }

      const result: {
        message: string;
        status?: number;
        statusText?: string;
        details?: string;
        type?: string;
      } = { message };

      if (status !== undefined) result.status = status;
      if (statusText !== undefined) result.statusText = statusText;
      if (details !== undefined) result.details = details;
      if (type !== undefined) result.type = type;

      return result;
    };

    const errorInfo = extractErrorDetails(error);

    // Build comprehensive error message for logging
    const fullErrorMessage = [
      errorInfo.message,
      errorInfo.status && `(HTTP ${errorInfo.status}${errorInfo.statusText ? ` ${errorInfo.statusText}` : ""})`,
      errorInfo.type && `[${errorInfo.type}]`,
      errorInfo.details && `Details: ${errorInfo.details}`,
    ].filter(Boolean).join(" ");

    await updateEmailLog(logId, {
      status: "failed",
      errorMessage: fullErrorMessage,
    });

    console.error("📧 Email send failed:", {
      to,
      subject,
      templateName,
      domain: process.env.MAILGUN_DOMAIN,
      apiKeyPresent: !!process.env.MAILGUN_API_KEY,
      apiKeyPrefix: process.env.MAILGUN_API_KEY?.substring(0, 8) + "...",
      region: process.env.MAILGUN_REGION || "us",
      error: errorInfo,
      rawError: error,
    });

    return { success: false, error, logId };
  }
}

// ============================================
// Email Template Functions
// ============================================

export async function sendClaimSubmittedEmail(
  to: string,
  clinicName: string,
  options?: {
    userId?: string | undefined;
    clinicId?: string | undefined;
    claimId?: string | undefined;
    unsubscribeToken?: string | undefined;
  }
): Promise<SendEmailResult> {
  const subject = `Claim Request Received - ${clinicName}`;
  const props: ClaimVerificationProps = {
    clinicName,
    unsubscribeUrl: options?.unsubscribeToken
      ? getUnsubscribeUrl(options.unsubscribeToken)
      : undefined,
  };

  const html = await renderClaimVerificationEmail(props);

  return sendEmail({
    to,
    subject,
    html,
    templateName: EMAIL_TEMPLATES.CLAIM_VERIFICATION,
    userId: options?.userId,
    metadata: {
      ...(options?.clinicId && { clinicId: options.clinicId }),
      ...(options?.claimId && { claimId: options.claimId }),
    },
  });
}

export async function sendClaimApprovedEmail(
  to: string,
  clinicName: string,
  dashboardUrl: string,
  options?: {
    userId?: string | undefined;
    clinicId?: string | undefined;
    claimId?: string | undefined;
    unsubscribeToken?: string | undefined;
  }
): Promise<SendEmailResult> {
  const subject = `Claim Approved - ${clinicName}`;
  const props: ClaimApprovedProps = {
    clinicName,
    dashboardUrl,
    unsubscribeUrl: options?.unsubscribeToken
      ? getUnsubscribeUrl(options.unsubscribeToken)
      : undefined,
  };

  const html = await renderClaimApprovedEmail(props);

  return sendEmail({
    to,
    subject,
    html,
    templateName: EMAIL_TEMPLATES.CLAIM_APPROVED,
    userId: options?.userId,
    metadata: {
      ...(options?.clinicId && { clinicId: options.clinicId }),
      ...(options?.claimId && { claimId: options.claimId }),
    },
  });
}

export async function sendClaimRejectedEmail(
  to: string,
  clinicName: string,
  reason: string,
  options?: {
    userId?: string | undefined;
    clinicId?: string | undefined;
    claimId?: string | undefined;
    unsubscribeToken?: string | undefined;
  }
): Promise<SendEmailResult> {
  const subject = `Claim Request Update - ${clinicName}`;
  const props: ClaimRejectedProps = {
    clinicName,
    reason,
    unsubscribeUrl: options?.unsubscribeToken
      ? getUnsubscribeUrl(options.unsubscribeToken)
      : undefined,
  };

  const html = await renderClaimRejectedEmail(props);

  return sendEmail({
    to,
    subject,
    html,
    templateName: EMAIL_TEMPLATES.CLAIM_REJECTED,
    userId: options?.userId,
    metadata: {
      ...(options?.clinicId && { clinicId: options.clinicId }),
      ...(options?.claimId && { claimId: options.claimId }),
    },
  });
}

export async function sendFeaturedConfirmedEmail(
  to: string,
  clinicName: string,
  tier: "basic" | "premium",
  options?: {
    userId?: string | undefined;
    clinicId?: string | undefined;
    subscriptionId?: string | undefined;
    unsubscribeToken?: string | undefined;
  }
): Promise<SendEmailResult> {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://painclinics.com"}/my-clinics`;
  const subject = `Featured Listing Activated - ${clinicName}`;
  const props: FeaturedWelcomeProps = {
    clinicName,
    tier,
    dashboardUrl,
    unsubscribeUrl: options?.unsubscribeToken
      ? getUnsubscribeUrl(options.unsubscribeToken)
      : undefined,
  };

  const html = await renderFeaturedWelcomeEmail(props);

  return sendEmail({
    to,
    subject,
    html,
    templateName: EMAIL_TEMPLATES.FEATURED_WELCOME,
    userId: options?.userId,
    metadata: {
      ...(options?.clinicId && { clinicId: options.clinicId }),
      ...(options?.subscriptionId && { subscriptionId: options.subscriptionId }),
    },
  });
}

export async function sendFeaturedRenewalEmail(
  to: string,
  clinicName: string,
  amount: string,
  paymentMethodLast4: string,
  nextBillingDate: string,
  options?: {
    userId?: string | undefined;
    clinicId?: string | undefined;
    subscriptionId?: string | undefined;
    invoiceUrl?: string | undefined;
    unsubscribeToken?: string | undefined;
  }
): Promise<SendEmailResult> {
  const subject = `Payment Receipt - ${clinicName}`;
  const props: FeaturedRenewalProps = {
    clinicName,
    amount,
    paymentMethodLast4,
    nextBillingDate,
    invoiceUrl: options?.invoiceUrl,
    unsubscribeUrl: options?.unsubscribeToken
      ? getUnsubscribeUrl(options.unsubscribeToken)
      : undefined,
  };

  const html = await renderFeaturedRenewalEmail(props);

  return sendEmail({
    to,
    subject,
    html,
    templateName: EMAIL_TEMPLATES.FEATURED_RENEWAL,
    userId: options?.userId,
    metadata: {
      ...(options?.clinicId && { clinicId: options.clinicId }),
      ...(options?.subscriptionId && { subscriptionId: options.subscriptionId }),
    },
  });
}

export async function sendPaymentFailedEmail(
  to: string,
  clinicName: string,
  options?: {
    userId?: string | undefined;
    clinicId?: string | undefined;
    subscriptionId?: string | undefined;
    unsubscribeToken?: string | undefined;
  }
): Promise<SendEmailResult> {
  const updatePaymentUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://painclinics.com"}/my-clinics`;
  const subject = `Payment Failed - Action Required for ${clinicName}`;
  const props: PaymentFailedProps = {
    clinicName,
    updatePaymentUrl,
    unsubscribeUrl: options?.unsubscribeToken
      ? getUnsubscribeUrl(options.unsubscribeToken)
      : undefined,
  };

  const html = await renderPaymentFailedEmail(props);

  return sendEmail({
    to,
    subject,
    html,
    templateName: EMAIL_TEMPLATES.PAYMENT_FAILED,
    userId: options?.userId,
    metadata: {
      ...(options?.clinicId && { clinicId: options.clinicId }),
      ...(options?.subscriptionId && { subscriptionId: options.subscriptionId }),
    },
  });
}

export async function sendSubscriptionCanceledEmail(
  to: string,
  clinicName: string,
  endDate: Date,
  options?: {
    userId?: string | undefined;
    clinicId?: string | undefined;
    subscriptionId?: string | undefined;
    unsubscribeToken?: string | undefined;
  }
): Promise<SendEmailResult> {
  const formattedDate = endDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const subject = `Subscription Canceled - ${clinicName}`;
  const reactivateUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://painclinics.com"}/my-clinics`;
  const props: SubscriptionCanceledProps = {
    clinicName,
    endDate: formattedDate,
    reactivateUrl,
    unsubscribeUrl: options?.unsubscribeToken
      ? getUnsubscribeUrl(options.unsubscribeToken)
      : undefined,
  };

  const html = await renderSubscriptionCanceledEmail(props);

  return sendEmail({
    to,
    subject,
    html,
    templateName: EMAIL_TEMPLATES.SUBSCRIPTION_CANCELED,
    userId: options?.userId,
    metadata: {
      ...(options?.clinicId && { clinicId: options.clinicId }),
      ...(options?.subscriptionId && { subscriptionId: options.subscriptionId }),
    },
  });
}

export async function sendWelcomeEmail(
  to: string,
  userName: string,
  options?: {
    userId?: string | undefined;
    unsubscribeToken?: string | undefined;
  }
): Promise<SendEmailResult> {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://painclinics.com"}/dashboard`;
  const subject = "Welcome to Pain Clinics Directory!";
  const props: WelcomeProps = {
    userName,
    dashboardUrl,
    unsubscribeUrl: options?.unsubscribeToken
      ? getUnsubscribeUrl(options.unsubscribeToken)
      : undefined,
  };

  const html = await renderWelcomeEmail(props);

  return sendEmail({
    to,
    subject,
    html,
    templateName: EMAIL_TEMPLATES.WELCOME,
    userId: options?.userId,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  options?: {
    userId?: string | undefined;
    expiresIn?: string | undefined;
  }
): Promise<SendEmailResult> {
  const subject = "Reset Your Password - Pain Clinics Directory";
  const props: PasswordResetProps = {
    resetUrl,
    expiresIn: options?.expiresIn || "1 hour",
  };

  const html = await renderPasswordResetEmail(props);

  return sendEmail({
    to,
    subject,
    html,
    templateName: EMAIL_TEMPLATES.PASSWORD_RESET,
    userId: options?.userId,
  });
}

// Admin emails that receive all contact form submissions
const ADMIN_EMAILS = ["kyle@freddybeach.com", "hello@painclinics.com"] as const;
const PRIMARY_ADMIN_EMAIL: string = ADMIN_EMAILS[0];

export async function sendClaimPendingAdminNotificationEmail(
  clinicName: string,
  claimantName: string,
  claimantEmail: string,
  claimantRole: string,
  options?: {
    clinicId?: string | undefined;
    claimId?: string | undefined;
  }
): Promise<SendEmailResult> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://painclinics.com";
  const reviewUrl = `${baseUrl}/admin/claims`;
  const submittedAt = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const subject = `New Claim Pending Review - ${clinicName}`;
  const props: ClaimPendingAdminProps = {
    clinicName,
    claimantName,
    claimantEmail,
    claimantRole,
    submittedAt,
    reviewUrl,
  };

  const html = await renderClaimPendingAdminEmail(props);

  return sendEmail({
    to: PRIMARY_ADMIN_EMAIL,
    subject,
    html,
    templateName: EMAIL_TEMPLATES.CLAIM_PENDING_ADMIN,
    metadata: {
      ...(options?.clinicId && { clinicId: options.clinicId }),
      ...(options?.claimId && { claimId: options.claimId }),
      claimantEmail,
    },
    ...(ADMIN_EMAILS.length > 1 && { bcc: ADMIN_EMAILS.slice(1).join(",") }),
  });
}

export async function sendContactClinicInquiryEmail(
  clinicEmail: string | null,
  props: ContactClinicInquiryProps
): Promise<{ success: boolean; error?: string }> {
  const validClinicEmail = clinicEmail && clinicEmail.trim() !== "" ? clinicEmail : null;

  // If clinic has email, send to clinic with BCC to all admins
  // If no clinic email, send to primary admin
  const to = validClinicEmail ?? PRIMARY_ADMIN_EMAIL;
  const subjectPrefix = validClinicEmail ? "" : "[No Clinic Email] ";
  const subject = `${subjectPrefix}New Patient Inquiry - ${props.clinicName}`;

  const html = await renderContactClinicInquiryEmail(props);

  // Determine BCC recipients:
  // - If sending to clinic: BCC all admin emails
  // - If sending to primary admin: BCC other admin emails (if any)
  const bccList = validClinicEmail
    ? ADMIN_EMAILS.join(",")
    : ADMIN_EMAILS.slice(1).join(",");

  // Send to clinic (or primary admin if no clinic email), BCC admin emails
  const result = await sendEmail({
    to,
    subject,
    html,
    templateName: EMAIL_TEMPLATES.CONTACT_CLINIC_INQUIRY,
    metadata: {
      clinicName: props.clinicName,
      patientEmail: props.patientEmail,
    },
    ...(bccList && { bcc: bccList }),
  });

  const errorMessage = result.error instanceof Error ? result.error.message : result.error ? String(result.error) : undefined;

  if (errorMessage) {
    return { success: result.success, error: errorMessage };
  }
  return { success: result.success };
}

export async function sendInquiryConfirmationEmail(
  patientEmail: string,
  props: InquiryConfirmationProps
): Promise<{ success: boolean; error?: string }> {
  const subject = `Your inquiry to ${props.clinicName} has been received`;

  const html = await renderInquiryConfirmationEmail(props);

  const result = await sendEmail({
    to: patientEmail,
    subject,
    html,
    templateName: EMAIL_TEMPLATES.INQUIRY_CONFIRMATION,
    metadata: {
      clinicName: props.clinicName,
      patientName: props.patientName,
    },
  });

  const errorMessage = result.error instanceof Error ? result.error.message : result.error ? String(result.error) : undefined;

  if (errorMessage) {
    return { success: result.success, error: errorMessage };
  }
  return { success: result.success };
}

export async function sendGeneralContactEmail(
  props: GeneralContactProps
): Promise<{ success: boolean; error?: string }> {
  const subject = `Contact Form: ${props.subject}`;

  const html = await renderGeneralContactEmail(props);

  const result = await sendEmail({
    to: "hello@painclinics.com",
    subject,
    html,
    templateName: EMAIL_TEMPLATES.GENERAL_CONTACT,
    metadata: {
      senderEmail: props.email,
      senderName: `${props.firstName} ${props.lastName}`,
    },
  });

  const errorMessage = result.error instanceof Error ? result.error.message : result.error ? String(result.error) : undefined;

  if (errorMessage) {
    return { success: result.success, error: errorMessage };
  }
  return { success: result.success };
}

export async function sendAdvertiseInquiryEmail(
  props: AdvertiseInquiryProps
): Promise<{ success: boolean; error?: string }> {
  const subject = `Advertising Inquiry: ${props.companyName}`;

  const html = await renderAdvertiseInquiryEmail(props);

  const result = await sendEmail({
    to: "features@painclinics.com",
    subject,
    html,
    templateName: EMAIL_TEMPLATES.ADVERTISE_INQUIRY,
    metadata: {
      companyName: props.companyName,
      contactEmail: props.email,
      interestArea: props.interestArea,
    },
  });

  const errorMessage = result.error instanceof Error ? result.error.message : result.error ? String(result.error) : undefined;

  if (errorMessage) {
    return { success: result.success, error: errorMessage };
  }
  return { success: result.success };
}

export async function sendSubmitClinicEmail(
  props: SubmitClinicProps
): Promise<{ success: boolean; error?: string }> {
  const subject = `New Clinic Submission: ${props.clinicName}`;

  const html = await renderSubmitClinicEmail(props);

  const result = await sendEmail({
    to: "features@painclinics.com",
    subject,
    html,
    templateName: EMAIL_TEMPLATES.SUBMIT_CLINIC,
    metadata: {
      clinicName: props.clinicName,
      contactEmail: props.contactEmail,
      city: props.city,
      state: props.state,
    },
  });

  const errorMessage = result.error instanceof Error ? result.error.message : result.error ? String(result.error) : undefined;

  if (errorMessage) {
    return { success: result.success, error: errorMessage };
  }
  return { success: result.success };
}
