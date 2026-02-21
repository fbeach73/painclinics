"use client";

import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const steps = [
  {
    number: 1,
    title: "Create a Campaign",
    description:
      'Go to Campaigns → New Campaign. Enter the advertiser name, set status to "Paused" while building, and optionally set start/end dates.',
  },
  {
    number: 2,
    title: "Add Creatives",
    description:
      "Open the campaign detail page and add one or more creatives. Choose a type (Image Banner, HTML, Text, or Native), fill in the required fields, and set the destination URL the ad should link to.",
  },
  {
    number: 3,
    title: "Assign Placements",
    description:
      "On the same campaign detail page, toggle on the placements where the ad should appear (e.g. clinic-above-fold, directory-in-list). Adjust weights if running multiple campaigns on the same slot.",
  },
  {
    number: 4,
    title: "Activate the Campaign",
    description:
      'Edit the campaign and change the status to "Active". Only active campaigns with active creatives and at least one placement will serve.',
  },
  {
    number: 5,
    title: "Set the Traffic Split",
    description:
      "Use the Ad Server Traffic Split slider on this page to control what percentage of page loads use your hosted ads vs. AdSense. Start low (10-20%) and ramp up as you verify everything works.",
  },
  {
    number: 6,
    title: "Give Advertisers the Postback URL",
    description:
      "Share the S2S postback URL with advertisers for conversion tracking: /api/ads/postback?click_id={click_id}&payout={payout}. The {click_id} macro is passed in the destination URL query string.",
  },
  {
    number: 7,
    title: "Monitor Performance",
    description:
      "Check this dashboard for impressions, clicks, CTR, and eCPM. Compare eCPM against your AdSense earnings to decide the right traffic split.",
  },
];

export function SetupGuideDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Info className="h-4 w-4" />
          Setup Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Campaign Setup Guide</DialogTitle>
        </DialogHeader>
        <ol className="space-y-4 mt-2">
          {steps.map((step) => (
            <li key={step.number} className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold mt-0.5">
                {step.number}
              </span>
              <div>
                <p className="font-medium text-sm">{step.title}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </DialogContent>
    </Dialog>
  );
}
