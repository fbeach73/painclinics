import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { CheckCircle, Mail, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ resubscribe?: string }>;
}

export default async function UnsubscribePage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const { resubscribe } = await searchParams;

  // Find user by unsubscribe token
  const userData = await db.query.user.findFirst({
    where: eq(user.unsubscribeToken, token),
  });

  if (!userData) {
    notFound();
  }

  // Handle resubscribe action
  if (resubscribe === "true") {
    await db.update(user)
      .set({ emailUnsubscribedAt: null })
      .where(eq(user.id, userData.id));

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
              You will now receive updates about your claimed clinics, subscription status, and important account notifications.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if already unsubscribed
  const alreadyUnsubscribed = userData.emailUnsubscribedAt !== null;

  // Mark as unsubscribed if not already
  if (!alreadyUnsubscribed) {
    await db.update(user)
      .set({ emailUnsubscribedAt: new Date() })
      .where(eq(user.id, userData.id));
  }

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
              ? "You were already unsubscribed from Pain Clinics Directory marketing emails."
              : "You have been successfully unsubscribed from Pain Clinics Directory marketing emails."}
          </p>

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800 text-left">
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

export function generateMetadata() {
  return {
    title: "Email Preferences - Pain Clinics Directory",
    description: "Manage your email subscription preferences",
    robots: "noindex, nofollow",
  };
}
