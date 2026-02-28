"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function PlacementsClient() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ad Serving</CardTitle>
        <CardDescription>
          Each placement independently checks for an active hosted campaign.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Placements with an active campaign serve hosted ads. All others
          automatically fall back to AdSense. No global toggle needed.
        </p>
      </CardContent>
    </Card>
  );
}
