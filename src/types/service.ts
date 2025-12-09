// Service category types matching the database enum
export type ServiceCategory =
  | "injection"
  | "procedure"
  | "physical"
  | "diagnostic"
  | "management"
  | "specialized";

// Service interface matching the database schema
export interface Service {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  description: string | null;
  category: ServiceCategory;
  isActive: boolean;
  displayOrder: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// Clinic-service junction interface
export interface ClinicService {
  id: string;
  clinicId: string;
  serviceId: string;
  isFeatured: boolean;
  displayOrder: number | null;
  addedAt: Date;
  addedBy: string | null;
  service?: Service;
}

// Service with clinic count for admin display
export interface ServiceWithCount extends Service {
  clinicCount: number;
}

// Input types for creating/updating services
export interface CreateServiceInput {
  name: string;
  slug: string;
  iconName: string;
  description?: string | null;
  category: ServiceCategory;
  isActive?: boolean;
  displayOrder?: number;
}

export interface UpdateServiceInput {
  name?: string;
  slug?: string;
  iconName?: string;
  description?: string | null;
  category?: ServiceCategory;
  isActive?: boolean;
  displayOrder?: number;
}

// Input for setting clinic services
export interface SetServiceInput {
  serviceId: string;
  isFeatured: boolean;
  displayOrder: number;
}

// Category display info
export const SERVICE_CATEGORIES: Record<
  ServiceCategory,
  { label: string; description: string }
> = {
  injection: {
    label: "Injection Therapies",
    description: "Various injection-based pain treatments",
  },
  procedure: {
    label: "Procedures",
    description: "Minimally invasive and surgical procedures",
  },
  physical: {
    label: "Physical Therapies",
    description: "Hands-on and movement-based therapies",
  },
  diagnostic: {
    label: "Diagnostic Services",
    description: "Pain assessment and testing services",
  },
  management: {
    label: "Pain Management",
    description: "Ongoing pain management and support",
  },
  specialized: {
    label: "Specialized Treatments",
    description: "Advanced and alternative therapies",
  },
};
