import { eq } from "drizzle-orm";
import { ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { contacts } from "@/lib/schema";
import { DeleteButton } from "./delete-button";

interface PageProps {
  params: Promise<{ token: string }>;
}

export function generateMetadata() {
  return {
    title: "Delete My Consultation Data — Pain Clinics",
    description: "Permanently remove your PainConsult AI consultation data.",
    robots: "noindex, nofollow",
  };
}

export default async function DeleteMyDataPage({ params }: PageProps) {
  const { token } = await params;

  const contact = await db.query.contacts.findFirst({
    where: eq(contacts.unsubscribeToken, token),
  });

  // Invalid token or already anonymized
  if (!contact || contact.name === "Anonymous User") {
    return (
      <div className="container max-w-md mx-auto py-12 px-4">
        <Card className="dark:bg-slate-900 dark:border-slate-700">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800">
              <ShieldAlert className="h-8 w-8 text-gray-500 dark:text-gray-400" />
            </div>
            <CardTitle className="text-2xl text-gray-900 dark:text-white">
              Link Invalid or Already Used
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 dark:text-neutral-400">
              This data deletion link has already been used or is no longer valid. If you believe
              this is an error, contact us at{" "}
              <a
                href="mailto:privacy@painclinics.com"
                className="text-primary hover:underline"
              >
                privacy@painclinics.com
              </a>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-lg mx-auto py-12 px-4">
      <Card className="dark:bg-slate-900 dark:border-slate-700">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
            <ShieldAlert className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl text-gray-900 dark:text-white">
            Delete My Consultation Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-gray-600 dark:text-neutral-400 text-sm text-center">
            You are requesting permanent deletion of your PainConsult AI data.
          </p>

          <div className="rounded-lg border border-gray-200 dark:border-slate-700 divide-y divide-gray-200 dark:divide-slate-700">
            <div className="p-4">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                What will be permanently removed:
              </p>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-neutral-400">
                <li className="flex items-center gap-2">
                  <span className="text-red-500">&#x2715;</span> Name
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">&#x2715;</span> Email address
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">&#x2715;</span> Zip code
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">&#x2715;</span> Age
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">&#x2715;</span> Phone number
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">&#x2715;</span> Clinic match records
                </li>
              </ul>
            </div>

            <div className="p-4">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                What will be kept (anonymized):
              </p>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-neutral-400">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">&#x2713;</span> Condition type (for service improvement)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">&#x2713;</span> Consultation date (for service improvement)
                </li>
              </ul>
            </div>
          </div>

          <p className="text-xs text-center text-red-600 dark:text-red-400 font-medium">
            This action is permanent and cannot be undone.
          </p>

          <DeleteButton token={token} />
        </CardContent>
      </Card>
    </div>
  );
}
