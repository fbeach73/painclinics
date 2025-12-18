import { render } from "@react-email/components";
import { ClaimApproved } from "./claim-approved";
import { ClaimRejected } from "./claim-rejected";
import { ClaimVerification } from "./claim-verification";
import { ContactClinicInquiry } from "./contact-clinic-inquiry";
import { FeaturedRenewal } from "./featured-renewal";
import { FeaturedWelcome } from "./featured-welcome";
import { PasswordReset } from "./password-reset";
import { PaymentFailed } from "./payment-failed";
import { SubscriptionCanceled } from "./subscription-canceled";
import { Welcome } from "./welcome";

// Re-export components for direct use if needed
export {
  ClaimVerification,
  ClaimApproved,
  ClaimRejected,
  ContactClinicInquiry,
  FeaturedWelcome,
  FeaturedRenewal,
  PaymentFailed,
  SubscriptionCanceled,
  Welcome,
  PasswordReset,
};

// Type definitions for render function props
export interface ClaimVerificationProps {
  clinicName: string;
  verificationUrl?: string | undefined;
  unsubscribeUrl?: string | undefined;
}

export interface ClaimApprovedProps {
  clinicName: string;
  dashboardUrl: string;
  unsubscribeUrl?: string | undefined;
}

export interface ClaimRejectedProps {
  clinicName: string;
  reason: string;
  supportUrl?: string | undefined;
  unsubscribeUrl?: string | undefined;
}

export interface FeaturedWelcomeProps {
  clinicName: string;
  tier: "basic" | "premium";
  dashboardUrl: string;
  unsubscribeUrl?: string | undefined;
}

export interface FeaturedRenewalProps {
  clinicName: string;
  amount: string;
  paymentMethodLast4: string;
  nextBillingDate: string;
  invoiceUrl?: string | undefined;
  unsubscribeUrl?: string | undefined;
}

export interface PaymentFailedProps {
  clinicName: string;
  updatePaymentUrl: string;
  unsubscribeUrl?: string | undefined;
}

export interface SubscriptionCanceledProps {
  clinicName: string;
  endDate: string;
  reactivateUrl?: string | undefined;
  unsubscribeUrl?: string | undefined;
}

export interface WelcomeProps {
  userName: string;
  dashboardUrl?: string | undefined;
  unsubscribeUrl?: string | undefined;
}

export interface PasswordResetProps {
  resetUrl: string;
  expiresIn?: string | undefined;
}

export interface ContactClinicInquiryProps {
  clinicName: string;
  clinicCity: string;
  clinicState: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  preferredContactTime: string;
  additionalInfo?: string;
  painType: string;
  painDuration: string;
  previousTreatment: string;
  insuranceStatus: string;
  submittedAt: string;
}

// Render functions that return HTML strings
export async function renderClaimVerificationEmail(props: ClaimVerificationProps): Promise<string> {
  return render(ClaimVerification(props));
}

export async function renderClaimApprovedEmail(props: ClaimApprovedProps): Promise<string> {
  return render(ClaimApproved(props));
}

export async function renderClaimRejectedEmail(props: ClaimRejectedProps): Promise<string> {
  return render(ClaimRejected(props));
}

export async function renderFeaturedWelcomeEmail(props: FeaturedWelcomeProps): Promise<string> {
  return render(FeaturedWelcome(props));
}

export async function renderFeaturedRenewalEmail(props: FeaturedRenewalProps): Promise<string> {
  return render(FeaturedRenewal(props));
}

export async function renderPaymentFailedEmail(props: PaymentFailedProps): Promise<string> {
  return render(PaymentFailed(props));
}

export async function renderSubscriptionCanceledEmail(props: SubscriptionCanceledProps): Promise<string> {
  return render(SubscriptionCanceled(props));
}

export async function renderWelcomeEmail(props: WelcomeProps): Promise<string> {
  return render(Welcome(props));
}

export async function renderPasswordResetEmail(props: PasswordResetProps): Promise<string> {
  return render(PasswordReset(props));
}

export async function renderContactClinicInquiryEmail(props: ContactClinicInquiryProps): Promise<string> {
  return render(ContactClinicInquiry(props));
}

// Template name constants for logging
export const EMAIL_TEMPLATES = {
  CLAIM_VERIFICATION: "claim-verification",
  CLAIM_APPROVED: "claim-approved",
  CLAIM_REJECTED: "claim-rejected",
  CONTACT_CLINIC_INQUIRY: "contact-clinic-inquiry",
  FEATURED_WELCOME: "featured-welcome",
  FEATURED_RENEWAL: "featured-renewal",
  PAYMENT_FAILED: "payment-failed",
  SUBSCRIPTION_CANCELED: "subscription-canceled",
  WELCOME: "welcome",
  PASSWORD_RESET: "password-reset",
} as const;

export type EmailTemplateName = (typeof EMAIL_TEMPLATES)[keyof typeof EMAIL_TEMPLATES];
