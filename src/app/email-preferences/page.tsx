import { Metadata } from "next";
import { eq } from "drizzle-orm";
import { Mail, CheckCircle, XCircle, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import { getOptionalSession } from "@/lib/session";
import { EmailPreferencesForm } from "./email-preferences-form";
import { UnsubscribeForm } from "./unsubscribe-form";

export const metadata: Metadata = {
  title: "Email Preferences - Pain Clinics Directory",
  description: "Manage your email subscription preferences for Pain Clinics Directory",
};

export default async function EmailPreferencesPage() {
  const session = await getOptionalSession();

  // If not logged in, show simple unsubscribe form
  if (!session?.user) {
    return (
      <div className="container max-w-md mx-auto py-12 px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Unsubscribe</CardTitle>
            <CardDescription>
              Enter your email to unsubscribe from marketing emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <UnsubscribeForm />

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                You&apos;ll still receive important emails like payment receipts and security alerts.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get user's current email preferences
  const userData = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });

  const isUnsubscribed = userData?.emailUnsubscribedAt !== null;

  return (
    <div className="container max-w-lg mx-auto py-12 px-4">
      <Card>
        <CardHeader className="text-center">
          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${isUnsubscribed ? "bg-gray-100" : "bg-green-100"}`}>
            {isUnsubscribed ? (
              <XCircle className="h-8 w-8 text-gray-600" />
            ) : (
              <CheckCircle className="h-8 w-8 text-green-600" />
            )}
          </div>
          <CardTitle className="text-2xl">Email Preferences</CardTitle>
          <CardDescription>
            Manage email notifications for {userData?.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Marketing Emails</h3>
                <p className="text-sm text-muted-foreground">
                  Updates about your listing, tips, and promotional offers
                </p>
              </div>
              <EmailPreferencesForm
                userId={session.user.id}
                isUnsubscribed={isUnsubscribed}
              />
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Transactional emails</p>
                <p>
                  You will always receive essential emails such as payment receipts,
                  claim status updates, subscription changes, and security notifications.
                  These cannot be disabled.
                </p>
              </div>
            </div>
          </div>

          {isUnsubscribed && userData?.emailUnsubscribedAt && (
            <p className="text-xs text-center text-muted-foreground">
              Unsubscribed on {new Date(userData.emailUnsubscribedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
