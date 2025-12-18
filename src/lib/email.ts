import { createId } from "@paralleldrive/cuid2";
import FormData from "form-data";
import Mailgun from "mailgun.js";
import {
  renderClaimVerificationEmail,
  renderClaimApprovedEmail,
  renderClaimRejectedEmail,
  renderContactClinicInquiryEmail,
  renderFeaturedWelcomeEmail,
  renderFeaturedRenewalEmail,
  renderPaymentFailedEmail,
  renderSubscriptionCanceledEmail,
  renderWelcomeEmail,
  renderPasswordResetEmail,
  EMAIL_TEMPLATES,
  type ClaimVerificationProps,
  type ClaimApprovedProps,
  type ClaimRejectedProps,
  type ContactClinicInquiryProps,
  type FeaturedWelcomeProps,
  type FeaturedRenewalProps,
  type PaymentFailedProps,
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
    await updateEmailLog(logId, {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    console.error("Email send failed:", error);
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

const ADMIN_EMAIL = "pc@freddybeach.com";

export async function sendContactClinicInquiryEmail(
  clinicEmail: string | null,
  props: ContactClinicInquiryProps
): Promise<{ success: boolean; error?: string }> {
  const hasClinicEmail = clinicEmail && clinicEmail.trim() !== "";

  const to = hasClinicEmail ? clinicEmail : ADMIN_EMAIL;
  const subjectPrefix = hasClinicEmail ? "" : "[No Clinic Email] ";
  const subject = `${subjectPrefix}New Patient Inquiry - ${props.clinicName}`;

  const html = await renderContactClinicInquiryEmail(props);

  const result = await sendEmail({
    to,
    subject,
    html,
    templateName: EMAIL_TEMPLATES.CONTACT_CLINIC_INQUIRY,
    metadata: {
      clinicName: props.clinicName,
      patientEmail: props.patientEmail,
    },
    ...(hasClinicEmail && { bcc: ADMIN_EMAIL }),
  });

  const errorMessage = result.error instanceof Error ? result.error.message : result.error ? String(result.error) : undefined;

  if (errorMessage) {
    return { success: result.success, error: errorMessage };
  }
  return { success: result.success };
}
