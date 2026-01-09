import { Metadata } from "next";
import { eq } from "drizzle-orm";
import { Mail, CheckCircle, XCircle, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import { getOptionalSession } from "@/lib/session";
import { EmailPreferencesForm } from "./email-preferences-form";

export const metadata: Metadata = {
  title: "Email Preferences - Pain Clinics Directory",
  description: "Manage your email subscription preferences for Pain Clinics Directory",
};

export default async function EmailPreferencesPage() {
  const session = await getOptionalSession();

  // If not logged in, show info about how to unsubscribe
  if (!session?.user) {
    return (
      <div className="container max-w-lg mx-auto py-12 px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Email Preferences</CardTitle>
            <CardDescription>
              Manage your email subscription settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                To manage your email preferences, please use the unsubscribe link at the bottom of any email you&apos;ve received from us.
              </AlertDescription>
            </Alert>

            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                Each email we send includes a personalized unsubscribe link in the footer.
                Click that link to instantly unsubscribe from marketing emails.
              </p>
              <p>
                If you have an account with us, you can also{" "}
                <a href="/sign-in" className="text-primary hover:underline font-medium">
                  sign in
                </a>{" "}
                to manage your preferences here.
              </p>
            </div>

            <div className="rounded-lg bg-muted p-4">
              <h3 className="font-medium mb-2">Types of emails we send:</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="font-medium text-foreground">Marketing emails</span>
                  <span>- Updates about your listing, tips, and promotions (can be unsubscribed)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-medium text-foreground">Transactional emails</span>
                  <span>- Payment receipts, claim updates, security alerts (cannot be unsubscribed)</span>
                </li>
              </ul>
            </div>
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
