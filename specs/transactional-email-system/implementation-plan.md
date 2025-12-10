# Implementation Plan: Transactional Email System

## Overview

Implement a comprehensive transactional email system with React Email templates, database logging, Mailgun webhooks for delivery tracking, unsubscribe management, and an admin analytics dashboard.

## Phase 1: Database Schema

Add email logging table and user email preference fields to support tracking and unsubscribe functionality.

### Tasks

- [x] Add `emailStatusEnum` to schema.ts
- [x] Add `emailLogs` table to schema.ts
- [x] Add `emailUnsubscribedAt` and `unsubscribeToken` fields to user table
- [x] Run database migration

### Technical Details

**Schema additions to `/src/lib/schema.ts`:**

```typescript
export const emailStatusEnum = pgEnum("email_status", [
  "queued", "delivered", "bounced", "complained", "failed", "opened", "clicked"
]);

export const emailLogs = pgTable("email_logs", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id").references(() => user.id),
  recipientEmail: text("recipient_email").notNull(),
  templateName: text("template_name").notNull(),
  subject: text("subject").notNull(),
  mailgunMessageId: text("mailgun_message_id").unique(),
  status: emailStatusEnum("status").default("queued"),
  metadata: jsonb("metadata"), // { clinicId?, claimId?, subscriptionId? }
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at").defaultNow(),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  bouncedAt: timestamp("bounced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [
  index("email_logs_user_idx").on(table.userId),
  index("email_logs_recipient_idx").on(table.recipientEmail),
  index("email_logs_template_idx").on(table.templateName),
  index("email_logs_status_idx").on(table.status),
  index("email_logs_mailgun_id_idx").on(table.mailgunMessageId),
  index("email_logs_sent_at_idx").on(table.sentAt),
]);
```

**User table additions:**
```typescript
emailUnsubscribedAt: timestamp("email_unsubscribed_at"),
unsubscribeToken: text("unsubscribe_token").unique(),
```

**Migration commands:**
```bash
pnpm db:generate
pnpm db:push
```

---

## Phase 2: React Email Setup

Install React Email package and create shared components that all email templates will use.

### Tasks

- [x] Install `@react-email/components` and `react-email` packages
- [x] Create `src/emails/components/email-layout.tsx` - base layout with header/footer
- [x] Create `src/emails/components/email-button.tsx` - CTA button component
- [x] Create `src/emails/components/email-card.tsx` - highlight card component

### Technical Details

**Installation:**
```bash
pnpm add @react-email/components react-email
```

**File structure:**
```
src/emails/
├── components/
│   ├── email-layout.tsx
│   ├── email-button.tsx
│   └── email-card.tsx
```

**email-layout.tsx pattern:**
```typescript
import { Html, Head, Preview, Body, Container, Section, Text, Link, Hr } from "@react-email/components";

interface EmailLayoutProps {
  previewText: string;
  unsubscribeUrl?: string;
  children: React.ReactNode;
}

export function EmailLayout({ previewText, unsubscribeUrl, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header with logo */}
          <Section style={headerStyle}>
            <Text style={logoStyle}>Pain Clinics Directory</Text>
          </Section>

          {/* Content */}
          {children}

          {/* Footer */}
          <Hr style={hrStyle} />
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              Pain Clinics Directory
              <br />
              {process.env.COMPANY_ADDRESS || "[Address to be updated]"}
            </Text>
            {unsubscribeUrl && (
              <Link href={unsubscribeUrl} style={unsubscribeLinkStyle}>
                Unsubscribe
              </Link>
            )}
            <Text style={copyrightStyle}>
              © {new Date().getFullYear()} Pain Clinics Directory. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const bodyStyle = { backgroundColor: "#f9fafb", fontFamily: "Arial, sans-serif" };
const containerStyle = { maxWidth: "600px", margin: "0 auto", padding: "20px" };
const headerStyle = { backgroundColor: "#2563eb", padding: "20px", borderRadius: "8px 8px 0 0" };
const logoStyle = { color: "white", fontSize: "24px", fontWeight: "bold", margin: 0 };
const hrStyle = { borderColor: "#e5e7eb", margin: "20px 0" };
const footerStyle = { textAlign: "center" as const };
const footerTextStyle = { fontSize: "12px", color: "#6b7280", lineHeight: "1.5" };
const unsubscribeLinkStyle = { color: "#6b7280", fontSize: "12px" };
const copyrightStyle = { fontSize: "12px", color: "#6b7280", marginTop: "10px" };
```

**email-button.tsx pattern:**
```typescript
import { Button } from "@react-email/components";

interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}

export function EmailButton({ href, children, variant = "primary" }: EmailButtonProps) {
  const style = variant === "primary"
    ? { backgroundColor: "#2563eb", color: "white", padding: "12px 24px", borderRadius: "6px", textDecoration: "none", display: "inline-block" }
    : { backgroundColor: "#f3f4f6", color: "#1f2937", padding: "12px 24px", borderRadius: "6px", textDecoration: "none", display: "inline-block" };

  return <Button href={href} style={style}>{children}</Button>;
}
```

---

## Phase 3: Email Templates

Create all 9 React Email templates using the shared components.

### Tasks

- [x] Create `src/emails/claim-verification.tsx` - claim submitted confirmation
- [x] Create `src/emails/claim-approved.tsx` - claim approved notification
- [x] Create `src/emails/claim-rejected.tsx` - claim rejected notification
- [x] Create `src/emails/featured-welcome.tsx` - featured subscription activated
- [x] Create `src/emails/featured-renewal.tsx` - payment receipt/renewal confirmation
- [x] Create `src/emails/payment-failed.tsx` - payment failed alert
- [x] Create `src/emails/subscription-canceled.tsx` - subscription canceled notice
- [x] Create `src/emails/welcome.tsx` - new user welcome
- [x] Create `src/emails/password-reset.tsx` - password reset (for future use)
- [x] Create `src/emails/index.ts` - export all render functions

### Technical Details

**Template prop interfaces:**

```typescript
// claim-verification.tsx
interface ClaimVerificationProps {
  clinicName: string;
  unsubscribeUrl?: string;
}

// claim-approved.tsx
interface ClaimApprovedProps {
  clinicName: string;
  dashboardUrl: string;
  unsubscribeUrl?: string;
}

// claim-rejected.tsx
interface ClaimRejectedProps {
  clinicName: string;
  reason: string;
  unsubscribeUrl?: string;
}

// featured-welcome.tsx
interface FeaturedWelcomeProps {
  clinicName: string;
  tier: "basic" | "premium";
  dashboardUrl: string;
  unsubscribeUrl?: string;
}

// featured-renewal.tsx
interface FeaturedRenewalProps {
  clinicName: string;
  amount: string;
  paymentMethodLast4: string;
  nextBillingDate: string;
  invoiceUrl?: string;
  unsubscribeUrl?: string;
}

// payment-failed.tsx
interface PaymentFailedProps {
  clinicName: string;
  updatePaymentUrl: string;
  unsubscribeUrl?: string;
}

// subscription-canceled.tsx
interface SubscriptionCanceledProps {
  clinicName: string;
  endDate: string;
  reactivateUrl?: string;
  unsubscribeUrl?: string;
}

// welcome.tsx
interface WelcomeProps {
  userName: string;
  unsubscribeUrl?: string;
}

// password-reset.tsx
interface PasswordResetProps {
  resetUrl: string;
}
```

**Export pattern in index.ts:**
```typescript
import { render } from "@react-email/components";
import { ClaimVerification } from "./claim-verification";
// ... other imports

export function renderClaimVerificationEmail(props: ClaimVerificationProps): string {
  return render(<ClaimVerification {...props} />);
}
// ... other render functions
```

---

## Phase 4: Email Service Refactor

Refactor the email service to use React Email renders and add database logging.

### Tasks

- [x] Create `/src/lib/email-logger.ts` - database logging functions
- [x] Refactor `/src/lib/email.ts` to use React Email render functions
- [x] Update `sendEmail()` to log all emails to database
- [x] Update all template functions to use new logged sending
- [x] Generate unsubscribe tokens for new users

### Technical Details

**email-logger.ts:**
```typescript
import { db } from "./db";
import { emailLogs } from "./schema";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

interface LogEmailParams {
  userId?: string;
  recipientEmail: string;
  templateName: string;
  subject: string;
  metadata?: Record<string, string>;
}

export async function createEmailLog(params: LogEmailParams): Promise<string> {
  const id = createId();
  await db.insert(emailLogs).values({
    id,
    ...params,
    status: "queued",
  });
  return id;
}

export async function updateEmailLog(
  id: string,
  updates: Partial<typeof emailLogs.$inferInsert>
) {
  await db.update(emailLogs).set(updates).where(eq(emailLogs.id, id));
}

export async function updateEmailLogByMessageId(
  messageId: string,
  updates: Partial<typeof emailLogs.$inferInsert>
) {
  await db.update(emailLogs).set(updates).where(eq(emailLogs.mailgunMessageId, messageId));
}
```

**Updated sendEmail in email.ts:**
```typescript
interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  templateName: string;
  userId?: string;
  metadata?: Record<string, string>;
}

export async function sendEmail(options: SendEmailOptions) {
  const { to, subject, html, templateName, userId, metadata } = options;

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
      throw new Error("Mailgun not configured");
    }

    const result = await mg.messages.create(process.env.MAILGUN_DOMAIN, {
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    await updateEmailLog(logId, {
      mailgunMessageId: result.id,
      status: "delivered"
    });

    return { success: true, messageId: result.id, logId };
  } catch (error) {
    await updateEmailLog(logId, {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error"
    });
    console.error("Email send failed:", error);
    return { success: false, error, logId };
  }
}
```

---

## Phase 5: Mailgun Webhooks

Create webhook handler to receive delivery events and update email status.

### Tasks

- [x] Create `/src/app/api/webhooks/mailgun/route.ts`
- [x] Implement webhook signature verification
- [x] Handle all event types: delivered, opened, clicked, bounced, complained, failed
- [x] Update email_logs based on webhook events

### Technical Details

**Webhook handler:**
```typescript
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { updateEmailLogByMessageId } from "@/lib/email-logger";

function verifyWebhookSignature(timestamp: string, token: string, signature: string): boolean {
  const signingKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;
  if (!signingKey) return false;

  const encodedToken = crypto
    .createHmac("sha256", signingKey)
    .update(timestamp.concat(token))
    .digest("hex");
  return encodedToken === signature;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const timestamp = formData.get("timestamp") as string;
    const token = formData.get("token") as string;
    const signature = formData.get("signature") as string;

    if (!verifyWebhookSignature(timestamp, token, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const eventDataStr = formData.get("event-data") as string;
    if (!eventDataStr) {
      return NextResponse.json({ received: true });
    }

    const eventData = JSON.parse(eventDataStr);
    const messageId = eventData.message?.headers?.["message-id"];
    const event = eventData.event;

    if (!messageId) {
      return NextResponse.json({ received: true });
    }

    const updates: Record<string, unknown> = {};

    switch (event) {
      case "delivered":
        updates.status = "delivered";
        updates.deliveredAt = new Date();
        break;
      case "opened":
        updates.status = "opened";
        updates.openedAt = new Date();
        break;
      case "clicked":
        updates.status = "clicked";
        updates.clickedAt = new Date();
        break;
      case "bounced":
        updates.status = "bounced";
        updates.bouncedAt = new Date();
        updates.errorMessage = eventData.reason || eventData["delivery-status"]?.description;
        break;
      case "complained":
        updates.status = "complained";
        break;
      case "failed":
        updates.status = "failed";
        updates.errorMessage = eventData.reason || eventData["delivery-status"]?.description;
        break;
    }

    if (Object.keys(updates).length > 0) {
      await updateEmailLogByMessageId(messageId, updates);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Mailgun webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

**Mailgun Dashboard Configuration:**
- URL: `https://painclinics.com/api/webhooks/mailgun`
- Events: delivered, opened, clicked, bounced, complained, failed

---

## Phase 6: Unsubscribe Management

Create unsubscribe page and token generation for users.

### Tasks

- [x] Create utility function to generate unsubscribe tokens
- [x] Create `/src/app/unsubscribe/[token]/page.tsx`
- [x] Add unsubscribe token generation on user creation

### Technical Details

**Unsubscribe token utility:**
```typescript
// In /src/lib/email.ts or separate file
import { createId } from "@paralleldrive/cuid2";

export function generateUnsubscribeToken(): string {
  return createId();
}

export function getUnsubscribeUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://painclinics.com";
  return `${baseUrl}/unsubscribe/${token}`;
}
```

**Unsubscribe page:**
```typescript
// /src/app/unsubscribe/[token]/page.tsx
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import { eq } from "drizzle-orm";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function UnsubscribePage({ params }: PageProps) {
  const { token } = await params;

  const userData = await db.query.user.findFirst({
    where: eq(user.unsubscribeToken, token),
  });

  if (!userData) {
    notFound();
  }

  // Mark as unsubscribed
  await db.update(user)
    .set({ emailUnsubscribedAt: new Date() })
    .where(eq(user.id, userData.id));

  return (
    <div className="container max-w-md mx-auto py-12 text-center">
      <h1 className="text-2xl font-bold mb-4">Unsubscribed</h1>
      <p className="text-muted-foreground">
        You have been successfully unsubscribed from Pain Clinics Directory emails.
      </p>
      <p className="text-sm text-muted-foreground mt-4">
        Note: You will still receive important transactional emails about your account and claims.
      </p>
    </div>
  );
}
```

---

## Phase 7: Polar Webhook Email Integration

Wire Polar subscription events to trigger appropriate emails.

### Tasks

- [x] Update `/src/lib/polar-webhooks.ts` to send subscription canceled email
- [x] Add featured renewal email on successful recurring payment
- [x] Verify featured welcome email is properly triggered

### Technical Details

**File to modify:** `/src/lib/polar-webhooks.ts`

**Add subscription canceled email trigger:**
```typescript
// In handleSubscriptionCanceled or equivalent function
import { sendSubscriptionCanceledEmail } from "./email";

// After updating subscription status
if (subscription && user?.email && clinic) {
  await sendSubscriptionCanceledEmail(
    user.email,
    clinic.title,
    subscription.endDate || new Date()
  );
}
```

**Current state (from exploration):**
- `handleSubscriptionActive` already calls `sendFeaturedConfirmedEmail`
- `handlePaymentFailed` already calls `sendPaymentFailedEmail`
- Missing: subscription canceled email trigger

---

## Phase 8: Admin Email Dashboard [complex]

Create admin dashboard for viewing email logs and analytics.

### Tasks

- [x] Create `/src/lib/email-queries.ts` - query functions for email stats
- [x] Create `/src/app/api/admin/emails/route.ts` - list emails API
- [x] Create `/src/app/api/admin/emails/stats/route.ts` - email stats API
- [x] Create `/src/app/admin/emails/page.tsx` - server component wrapper
- [x] Create `/src/app/admin/emails/emails-client.tsx` - client component with filtering
- [x] Add "Emails" navigation item to admin sidebar

### Technical Details

**email-queries.ts:**
```typescript
import { db } from "./db";
import { emailLogs } from "./schema";
import { desc, eq, sql, and, gte, lte } from "drizzle-orm";

export async function getEmailStats(startDate?: Date, endDate?: Date) {
  const conditions = [];
  if (startDate) conditions.push(gte(emailLogs.sentAt, startDate));
  if (endDate) conditions.push(lte(emailLogs.sentAt, endDate));

  const stats = await db.select({
    total: sql<number>`count(*)`,
    delivered: sql<number>`count(*) filter (where status = 'delivered')`,
    bounced: sql<number>`count(*) filter (where status = 'bounced')`,
    complained: sql<number>`count(*) filter (where status = 'complained')`,
    failed: sql<number>`count(*) filter (where status = 'failed')`,
    opened: sql<number>`count(*) filter (where status = 'opened')`,
    clicked: sql<number>`count(*) filter (where status = 'clicked')`,
  })
  .from(emailLogs)
  .where(conditions.length > 0 ? and(...conditions) : undefined);

  return stats[0];
}

export async function getEmailLogs(options: {
  limit?: number;
  offset?: number;
  status?: string;
  templateName?: string;
}) {
  const { limit = 50, offset = 0, status, templateName } = options;

  const conditions = [];
  if (status) conditions.push(eq(emailLogs.status, status));
  if (templateName) conditions.push(eq(emailLogs.templateName, templateName));

  return db.select()
    .from(emailLogs)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(emailLogs.sentAt))
    .limit(limit)
    .offset(offset);
}
```

**Admin sidebar addition:**
```typescript
// In /src/components/admin/admin-sidebar.tsx
import { Mail } from "lucide-react";

// Add to navItems array:
{ href: "/admin/emails", label: "Emails", icon: Mail }
```

**Dashboard metrics to display:**
- Total emails sent (with date range filter)
- Delivery rate: (delivered / total) * 100
- Bounce rate: (bounced / total) * 100
- Complaint rate: (complained / total) * 100
- Open rate: (opened / delivered) * 100
- Click rate: (clicked / delivered) * 100

---

## Phase 9: BetterAuth Welcome Email Hook

Add welcome email trigger when new users register.

### Tasks

- [x] Update `/src/lib/auth.ts` to add database hook for user creation
- [x] Generate unsubscribe token for new users

### Technical Details

**Add to auth.ts configuration:**
```typescript
import { sendWelcomeEmail, generateUnsubscribeToken } from "./email";

export const auth = betterAuth({
  // ... existing config

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Generate unsubscribe token
          return {
            data: {
              ...user,
              unsubscribeToken: generateUnsubscribeToken(),
            },
          };
        },
        after: async (user) => {
          // Send welcome email
          if (user.email) {
            await sendWelcomeEmail(user.email, user.name || "there");
          }
        },
      },
    },
  },
});
```

---

## Phase 10: Final Verification

Run linting, type checking, and verify all integrations work.

### Tasks

- [x] Run `pnpm run lint` and fix any errors
- [x] Run `pnpm run typecheck` and fix any type errors
- [x] Verify all email templates render correctly
- [x] Test email sending flow end-to-end

### Technical Details

**Verification commands:**
```bash
pnpm run lint
pnpm run typecheck
```

**Manual testing checklist:**
- Trigger claim submission and verify email logged
- Check Mailgun dashboard for sent emails
- Verify unsubscribe page works
- Check admin dashboard shows correct metrics
