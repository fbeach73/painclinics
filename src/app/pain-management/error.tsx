"use client";

import { useEffect } from "react";
import { AlertCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PainManagementError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Pain management page error:", error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <MapPin className="h-16 w-16 text-muted-foreground" />
            <AlertCircle className="h-6 w-6 text-destructive absolute -top-1 -right-1" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-4">Unable to Load Clinic Information</h1>
        <p className="text-muted-foreground mb-6">
          We encountered an error while loading this page. This may be a temporary
          issue. Please try again or browse our directory.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground mb-4">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex gap-4 justify-center">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" asChild>
            <Link href="/pain-management">Browse Directory</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
