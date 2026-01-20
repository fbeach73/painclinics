import { render } from "@react-email/components";
import { AdvertiseInquiry } from "./advertise-inquiry";
import { BroadcastEmail, type BroadcastEmailProps } from "./broadcast-email";
import { ClaimApproved } from "./claim-approved";
import { ClaimPendingAdmin, type ClaimPendingAdminProps } from "./claim-pending-admin";
import { ClaimRejected } from "./claim-rejected";
import { ClaimVerification } from "./claim-verification";
import { ContactClinicInquiry } from "./contact-clinic-inquiry";
import { FeaturedRenewal } from "./featured-renewal";
import { FeaturedWelcome } from "./featured-welcome";
import { GeneralContact } from "./general-contact";
import { InquiryConfirmation } from "./inquiry-confirmation";
import { LeadFollowUp, type LeadFollowUpEmailProps } from "./lead-follow-up";
import { PasswordReset } from "./password-reset";
import { PaymentFailed } from "./payment-failed";
import { SubmitClinic } from "./submit-clinic";
import { SubscriptionAdmin, type SubscriptionAdminProps } from "./subscription-admin";
import { SubscriptionCanceled } from "./subscription-canceled";
import { SubscriptionThankYou, type SubscriptionThankYouProps } from "./subscription-thank-you";
import { Welcome } from "./welcome";

// Re-export components for direct use if needed
export {
  AdvertiseInquiry,
  BroadcastEmail,
  ClaimVerification,
  ClaimApproved,
  ClaimPendingAdmin,
  ClaimRejected,
  ContactClinicInquiry,
  FeaturedWelcome,
  FeaturedRenewal,
  GeneralContact,
  InquiryConfirmation,
  LeadFollowUp,
  PaymentFailed,
  PasswordReset,
  SubmitClinic,
  SubscriptionAdmin,
  SubscriptionCanceled,
  SubscriptionThankYou,
  Welcome,
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

export type { BroadcastEmailProps };

export type { ClaimPendingAdminProps };

export type { SubscriptionAdminProps };

export type { SubscriptionThankYouProps };

export type { LeadFollowUpEmailProps };

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
  clinicPhone?: string;
  clinicWebsite?: string;
  clinicPermalink?: string;
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

export interface InquiryConfirmationProps {
  patientName: string;
  clinicName: string;
  clinicCity: string;
  clinicState: string;
  submittedAt: string;
}

export interface GeneralContactProps {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
  submittedAt: string;
}

export interface AdvertiseInquiryProps {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string | undefined;
  companyType: string;
  interestArea: string;
  budget?: string | undefined;
  message?: string | undefined;
  submittedAt: string;
}

export interface SubmitClinicProps {
  clinicName: string;
  contactName: string;
  contactEmail: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  website?: string | undefined;
  services?: string | undefined;
  additionalInfo?: string | undefined;
  submittedAt: string;
}

// Render functions that return HTML strings
export async function renderBroadcastEmail(props: BroadcastEmailProps): Promise<string> {
  return render(BroadcastEmail(props));
}

export async function renderClaimVerificationEmail(props: ClaimVerificationProps): Promise<string> {
  return render(ClaimVerification(props));
}

export async function renderClaimApprovedEmail(props: ClaimApprovedProps): Promise<string> {
  return render(ClaimApproved(props));
}

export async function renderClaimRejectedEmail(props: ClaimRejectedProps): Promise<string> {
  return render(ClaimRejected(props));
}

export async function renderClaimPendingAdminEmail(props: ClaimPendingAdminProps): Promise<string> {
  return render(ClaimPendingAdmin(props));
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

export async function renderInquiryConfirmationEmail(props: InquiryConfirmationProps): Promise<string> {
  return render(InquiryConfirmation(props));
}

export async function renderLeadFollowUpEmail(props: LeadFollowUpEmailProps): Promise<string> {
  return render(LeadFollowUp(props));
}

export async function renderGeneralContactEmail(props: GeneralContactProps): Promise<string> {
  return render(GeneralContact(props));
}

export async function renderAdvertiseInquiryEmail(props: AdvertiseInquiryProps): Promise<string> {
  return render(AdvertiseInquiry(props));
}

export async function renderSubmitClinicEmail(props: SubmitClinicProps): Promise<string> {
  return render(SubmitClinic(props));
}

export async function renderSubscriptionAdminEmail(props: SubscriptionAdminProps): Promise<string> {
  return render(SubscriptionAdmin(props));
}

export async function renderSubscriptionThankYouEmail(props: SubscriptionThankYouProps): Promise<string> {
  return render(SubscriptionThankYou(props));
}

// Template name constants for logging
export const EMAIL_TEMPLATES = {
  ADVERTISE_INQUIRY: "advertise-inquiry",
  BROADCAST: "broadcast",
  BROADCAST_TEST: "broadcast_test",
  CLAIM_VERIFICATION: "claim-verification",
  CLAIM_APPROVED: "claim-approved",
  CLAIM_PENDING_ADMIN: "claim-pending-admin",
  CLAIM_REJECTED: "claim-rejected",
  CONTACT_CLINIC_INQUIRY: "contact-clinic-inquiry",
  FEATURED_RENEWAL: "featured-renewal",
  FEATURED_WELCOME: "featured-welcome",
  GENERAL_CONTACT: "general-contact",
  INQUIRY_CONFIRMATION: "inquiry-confirmation",
  LEAD_FOLLOW_UP: "lead-follow-up",
  PASSWORD_RESET: "password-reset",
  PAYMENT_FAILED: "payment-failed",
  SUBMIT_CLINIC: "submit-clinic",
  SUBSCRIPTION_ADMIN: "subscription-admin",
  SUBSCRIPTION_CANCELED: "subscription-canceled",
  SUBSCRIPTION_THANK_YOU: "subscription-thank-you",
  WELCOME: "welcome",
} as const;

export type EmailTemplateName = (typeof EMAIL_TEMPLATES)[keyof typeof EMAIL_TEMPLATES];
