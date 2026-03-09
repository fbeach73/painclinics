/**
 * Available merge tags for broadcast emails
 * This file is safe to import in client components
 */
export const MERGE_TAGS = {
  clinic_name: { label: "Clinic Name", example: "ABC Pain Clinic" },
  clinic_url: { label: "Clinic Page URL", example: "https://www.painclinics.com/pain-management/abc-pain-clinic" },
  claim_url: { label: "Claim Listing URL", example: "https://www.painclinics.com/pain-management/abc-pain-clinic#claim" },
  city: { label: "City", example: "Los Angeles" },
  state: { label: "State (Full)", example: "California" },
  state_abbr: { label: "State (Abbrev)", example: "CA" },
  address: { label: "Street Address", example: "123 Main Street" },
  full_address: { label: "Full Address", example: "123 Main Street, Los Angeles, CA 90001" },
  postal_code: { label: "Postal Code", example: "90001" },
  phone: { label: "Phone Number", example: "(555) 123-4567" },
  website: { label: "Website", example: "https://example.com" },
  rating: { label: "Google Rating", example: "4.8" },
  review_count: { label: "Review Count", example: "127" },
  rating_stars: { label: "Rating Stars", example: "★★★★☆ 4.2" },
  review_summary: { label: "Review Summary", example: "127 Google reviews" },
  missing_items: { label: "Missing Profile Items", example: "website, business hours, photos" },
  profile_score: { label: "Profile Completeness", example: "65%" },
  competitor_count: { label: "Competitors in City", example: "12" },
} as const;

export type MergeTagKey = keyof typeof MERGE_TAGS;
