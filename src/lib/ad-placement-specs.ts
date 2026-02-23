import type { CreativeType, AspectRatio } from "@/lib/ad-queries";

/**
 * Canonical placement specifications.
 * Used by the ad serving layer (AdSlot) and the admin UI (info tooltips).
 */

export type PlacementSpec = {
  /** Allowed creative types. undefined = all types allowed. */
  allowedTypes?: CreativeType[];
  /** Allowed aspect ratios for image_banner creatives. undefined = all ratios. */
  allowedRatios?: AspectRatio[];
  /** If true, no AdSense fallback — hosted only. */
  hostedOnly?: boolean;
  /** Human-readable note shown in admin. */
  note: string;
};

export const PLACEMENT_SPECS: Record<string, PlacementSpec> = {
  "clinic-top-leaderboard": {
    allowedTypes: ["image_banner"],
    allowedRatios: ["21:9"],
    note: "Image banner only, 21:9 ultrawide. Full-width desktop leaderboard.",
  },
  "clinic-below-header": {
    note: "All types and ratios. Full-width between hero and services.",
  },
  "clinic-above-fold": {
    allowedTypes: ["image_banner", "native"],
    allowedRatios: ["1:1"],
    note: "Image banner (1:1 square) or native. Sidebar position.",
  },
  "clinic-above-image": {
    allowedTypes: ["html", "text"],
    hostedOnly: true,
    note: "HTML or text only. No AdSense fallback.",
  },
  "clinic-mid-content": {
    allowedTypes: ["image_banner", "native"],
    allowedRatios: ["16:9", "4:3", "3:2"],
    note: "Image banner (16:9, 4:3, 3:2) or native. Landscape content area.",
  },
  "directory-in-list": {
    note: "All types and ratios. After 3rd clinic card in listings.",
  },
  "homepage-mid": {
    note: "All types and ratios. Full-width between sections.",
  },
  "blog-mid-content": {
    note: "All types and ratios. Mid-content in blog posts.",
  },
  "anchor-bottom": {
    allowedTypes: ["native", "text", "image_banner", "html"],
    note: "All types, all ratios. Sticky bottom bar across all public pages.",
  },
};

/** Get allowed types for a placement (undefined = all). */
export function getAllowedTypes(placement: string): CreativeType[] | undefined {
  return PLACEMENT_SPECS[placement]?.allowedTypes;
}

/** Get allowed ratios for a placement (undefined = all). */
export function getAllowedRatios(placement: string): AspectRatio[] | undefined {
  return PLACEMENT_SPECS[placement]?.allowedRatios;
}

/** Check if a placement is hosted-only (no AdSense fallback). */
export function isHostedOnly(placement: string): boolean {
  return PLACEMENT_SPECS[placement]?.hostedOnly === true;
}
