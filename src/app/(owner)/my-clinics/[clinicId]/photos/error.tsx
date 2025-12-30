"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PhotosError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Photos management error:", error);
  }, [error]);

  return (
    <div className="space-y-6">
      <Card className="max-w-lg mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle>Failed to Load Photos</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            There was an error loading the photo management page. Please try
            again.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground">
              Error ID: {error.digest}
            </p>
          )}
          <div className="flex gap-4 justify-center">
            <Button onClick={reset}>Try again</Button>
            <Button
              variant="outline"
              onClick={() => window.history.back()}
            >
              Go back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
