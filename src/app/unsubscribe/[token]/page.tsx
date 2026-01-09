import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { CheckCircle, Mail, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { user, emailUnsubscribes } from "@/lib/schema";

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ resubscribe?: string }>;
}

type UnsubscribeTarget =
  | { type: "user"; id: string; email: string; unsubscribedAt: Date | null }
  | { type: "email"; id: string; email: string; unsubscribedAt: Date | null };

async function findByToken(token: string): Promise<UnsubscribeTarget | null> {
  // First, check if token belongs to a user
  const userData = await db.query.user.findFirst({
    where: eq(user.unsubscribeToken, token),
  });

  if (userData) {
    return {
      type: "user",
      id: userData.id,
      email: userData.email,
      unsubscribedAt: userData.emailUnsubscribedAt,
    };
  }

  // Then, check the emailUnsubscribes table
  const emailRecord = await db.query.emailUnsubscribes.findFirst({
    where: eq(emailUnsubscribes.token, token),
  });

  if (emailRecord) {
    return {
      type: "email",
      id: emailRecord.id,
      email: emailRecord.email,
      unsubscribedAt: emailRecord.unsubscribedAt,
    };
  }

  return null;
}

async function unsubscribe(target: UnsubscribeTarget): Promise<void> {
  if (target.type === "user") {
    await db
      .update(user)
      .set({ emailUnsubscribedAt: new Date() })
      .where(eq(user.id, target.id));
  } else {
    await db
      .update(emailUnsubscribes)
      .set({ unsubscribedAt: new Date() })
      .where(eq(emailUnsubscribes.id, target.id));
  }
}

async function resubscribe(target: UnsubscribeTarget): Promise<void> {
  if (target.type === "user") {
    await db
      .update(user)
      .set({ emailUnsubscribedAt: null })
      .where(eq(user.id, target.id));
  } else {
    await db
      .update(emailUnsubscribes)
      .set({ unsubscribedAt: null })
      .where(eq(emailUnsubscribes.id, target.id));
  }
}

export default async function UnsubscribePage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const { resubscribe: shouldResubscribe } = await searchParams;

  // Find the unsubscribe target (user or email record)
  const target = await findByToken(token);

  if (!target) {
    notFound();
  }

  // Handle resubscribe action
  if (shouldResubscribe === "true") {
    await resubscribe(target);

    return (
      <div className="container max-w-md mx-auto py-12">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Welcome Back!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              You have been successfully resubscribed to Pain Clinics Directory emails.
            </p>
            <p className="text-sm text-muted-foreground">
              You will now receive updates about your clinic listing and important notifications.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if already unsubscribed
  const alreadyUnsubscribed = target.unsubscribedAt !== null;

  // Mark as unsubscribed if not already
  if (!alreadyUnsubscribed) {
    await unsubscribe(target);
  }

  // Mask email for privacy
  const maskedEmail = maskEmail(target.email);

  return (
    <div className="container max-w-md mx-auto py-12">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">
            {alreadyUnsubscribed ? "Already Unsubscribed" : "Unsubscribed"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {alreadyUnsubscribed
              ? `${maskedEmail} was already unsubscribed from Pain Clinics Directory marketing emails.`
              : `${maskedEmail} has been successfully unsubscribed from Pain Clinics Directory marketing emails.`}
          </p>

          <div className="rounded-lg bg-featured border border-featured-border p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-featured-foreground mt-0.5 flex-shrink-0" />
              <div className="text-sm text-featured-foreground text-left">
                <p className="font-medium mb-1">Important Notice</p>
                <p>
                  You will still receive essential transactional emails about your account, such as:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Claim status updates</li>
                  <li>Payment confirmations and receipts</li>
                  <li>Subscription changes</li>
                  <li>Security notifications</li>
                </ul>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground pt-2">
            Changed your mind?{" "}
            <a
              href={`/unsubscribe/${token}?resubscribe=true`}
              className="text-primary hover:underline font-medium"
            >
              Resubscribe
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Mask email for privacy (e.g., "john@example.com" -> "j***@e***.com")
 */
function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return email;

  const maskedLocal = localPart.length > 1
    ? localPart[0] + "***"
    : localPart;

  const domainParts = domain.split(".");
  const firstPart = domainParts[0];
  const maskedDomain = domainParts.length > 1 && firstPart
    ? firstPart[0] + "***." + domainParts.slice(1).join(".")
    : domain;

  return `${maskedLocal}@${maskedDomain}`;
}

export function generateMetadata() {
  return {
    title: "Email Preferences - Pain Clinics Directory",
    description: "Manage your email subscription preferences",
    robots: "noindex, nofollow",
  };
}
