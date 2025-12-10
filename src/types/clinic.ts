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
  services: ServiceType[];
  insuranceAccepted: InsuranceType[];
  rating: number;
  reviewCount: number;
  photos: string[];
  about: string;
  isVerified: boolean;
  isFeatured: boolean;
  ownerUserId?: string | null;
  featuredTier?: 'none' | 'basic' | 'premium' | null;
  featuredUntil?: Date | null;
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
