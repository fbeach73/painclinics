"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSession, signIn } from "@/lib/auth-client";

function ClaimInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, isPending: isSessionLoading } = useSession();
  const token = searchParams.get("token");

  const [redeemState, setRedeemState] = useState<
    { status: "idle" } | { status: "redeeming" } | { status: "success"; clinicTitle: string; clinicId: string } | { status: "error"; error: string }
  >({ status: "idle" });
  const hasStartedRedeem = useRef(false);

  useEffect(() => {
    if (!token || isSessionLoading || !session || hasStartedRedeem.current) return;
    hasStartedRedeem.current = true;

    // Use startTransition-like pattern: set state via the fetch promise chain only
    fetch("/api/claims/redeem-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setRedeemState({ status: "error", error: data.error || "Failed to claim listing" });
          return;
        }
        setRedeemState({ status: "success", clinicTitle: data.clinicTitle, clinicId: data.clinicId });
      })
      .catch(() => {
        setRedeemState({ status: "error", error: "Something went wrong. Please try again." });
      });
  }, [token, session, isSessionLoading]);

  // Derive display status
  const status = !token
    ? "error" as const
    : isSessionLoading
    ? "loading" as const
    : !session
    ? "needs-auth" as const
    : (redeemState.status === "idle")
    ? "redeeming" as const
    : redeemState.status;
  const error = !token ? "No claim token provided. Please use the link from your email." : redeemState.status === "error" ? redeemState.error : "";
  const clinicTitle = redeemState.status === "success" ? redeemState.clinicTitle : "";
  const clinicId = redeemState.status === "success" ? redeemState.clinicId : "";

  if (status === "loading" || isSessionLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        {status === "needs-auth" && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Claim Your Listing</CardTitle>
              <CardDescription>
                Sign in or create an account to claim ownership of your clinic
                listing on PainClinics.com.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Button
                size="lg"
                className="w-full"
                onClick={() => {
                  signIn.social({
                    provider: "google",
                    callbackURL: `/claim-invite?token=${token}`,
                  });
                }}
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                By signing in, you can manage your clinic&apos;s information,
                photos, and services.
              </p>
            </CardContent>
          </>
        )}

        {status === "redeeming" && (
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Claiming your listing...</p>
          </CardContent>
        )}

        {status === "success" && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-green-600">
                Listing Claimed!
              </CardTitle>
              <CardDescription>
                You now own <strong>{clinicTitle}</strong>. You can update your
                clinic&apos;s information, add photos, and manage your listing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                size="lg"
                className="w-full"
                onClick={() => router.push(`/my-clinics/${clinicId}`)}
              >
                Go to My Clinics Dashboard
              </Button>
            </CardContent>
          </>
        )}

        {status === "error" && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-red-600">
                Unable to Claim
              </CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/")}
              >
                Go to Homepage
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}

export default function ClaimInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ClaimInviteContent />
    </Suspense>
  );
}
