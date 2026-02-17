import type { ReviewKeyword } from "@/lib/clinic-transformer";

// Service types offered by pain clinics
export type ServiceType =
  | 'injection-therapy'
  | 'physical-therapy'
  | 'medication-management'
  | 'nerve-blocks'
  | 'spinal-cord-stimulation'
  | 'regenerative-medicine'
  | 'acupuncture'
  | 'chiropractic'
  | 'massage-therapy'
  | 'psychological-services';

// Insurance providers
export type InsuranceType =
  | 'medicare'
  | 'medicaid'
  | 'blue-cross'
  | 'aetna'
  | 'cigna'
  | 'united-healthcare'
  | 'humana'
  | 'kaiser'
  | 'tricare'
  | 'workers-comp';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Address {
  street: string;
  suite?: string;
  city: string;
  state: string;
  zipCode: string;
  formatted: string;
}

export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface OperatingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

// FAQ question/answer pair
export interface ClinicQuestion {
  question: string;
  answer: string;
}

// Featured review from patients (UI layer type)
// Note: For import/database layer, see FeaturedReview in @/lib/clinic-transformer
export interface FeaturedReview {
  review: string;
  rating: number;
  username?: string;
  date?: string;
  url?: string;
}

// Review score breakdown item
export interface ReviewScoreItem {
  score: number;
  count: number;
}

// Re-export ReviewKeyword from clinic-transformer for backwards compatibility
export type ReviewKeywordItem = ReviewKeyword;

export interface Clinic {
  id: string;
  name: string;
  slug: string;
  address: Address;
  coordinates: Coordinates;
  phone: string;
  email?: string;
  website?: string;
  hours: OperatingHours;
  timezone?: string | null; // IANA timezone e.g. "America/New_York"
  services: ServiceType[];
  insuranceAccepted: InsuranceType[];
  paymentMethods?: string[] | undefined;
  rating: number;
  reviewCount: number;
  photos: string[];
  about: string;
  isVerified: boolean;
  isFeatured: boolean;
  ownerUserId?: string | null;
  featuredTier?: 'none' | 'basic' | 'premium' | null;
  featuredUntil?: Date | null;

  // FAQ & Questions
  questions?: ClinicQuestion[] | undefined;

  // Reviews
  featuredReviews?: FeaturedReview[] | undefined;
  reviewsPerScore?: ReviewScoreItem[] | undefined; // [{ score: 5, count: 42 }, ...]
  reviewKeywords?: ReviewKeywordItem[] | undefined; // [{ keyword: "friendly staff", count: 5 }, ...]

  // Services & Amenities
  checkboxFeatures?: string[] | undefined; // Procedures/services from checkbox
  amenities?: string[] | undefined;

  // Enhanced content
  enhancedAbout?: string | undefined; // AI-generated, stored in newPostContent

  // Import tracking (for NEW/UPDATED badges)
  importedAt?: Date | string | null | undefined; // When clinic was first imported
  importUpdatedAt?: Date | string | null | undefined; // When existing clinic was last updated via import
}

export interface ClinicWithDistance extends Clinic {
  distance: number;
  distanceFormatted: string;
}

export interface UserLocation {
  coordinates: Coordinates;
  city?: string;
  state?: string;
  isDefault: boolean;
}

export interface SearchFilters {
  query?: string;
  services?: ServiceType[];
  insurance?: InsuranceType[];
  maxDistance?: number;
  minRating?: number;
  sortBy: 'distance' | 'rating' | 'name';
}

// Re-export directory filter types for convenience
export type { DirectoryFilters, SortOption } from '@/lib/directory/filters';
export type { ClinicListItem, DirectoryStats, FilteredClinicsResult } from '@/lib/directory/queries';
