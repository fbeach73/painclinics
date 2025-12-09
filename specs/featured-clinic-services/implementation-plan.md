# Implementation Plan: Featured Clinic Services with Icons

## Overview

Replace the hardcoded amenities-to-services mapping with a database-driven service management system. This includes new database tables, admin interfaces, public display components, and data migration.

---

## Phase 1: Database Schema

Add new tables to support service management with proper relations.

### Tasks

- [x] Add `serviceCategoryEnum` to schema.ts
- [x] Add `services` table to schema.ts
- [x] Add `clinicServices` junction table to schema.ts
- [x] Add Drizzle relations for services
- [x] Generate database migration
- [x] Apply migration to database

### Technical Details

**File to modify:** `src/lib/schema.ts`

```typescript
import { pgEnum } from "drizzle-orm/pg-core";

// Service category enum
export const serviceCategoryEnum = pgEnum("service_category", [
  "injection",
  "procedure",
  "physical",
  "diagnostic",
  "management",
  "specialized",
]);

// Global services table
export const services = pgTable(
  "services",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text("name").notNull().unique(),
    slug: text("slug").notNull().unique(),
    iconName: text("icon_name").notNull(),
    description: text("description"),
    category: serviceCategoryEnum("category").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    displayOrder: integer("display_order").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("services_slug_idx").on(table.slug),
    index("services_category_idx").on(table.category),
  ]
);

// Junction table
export const clinicServices = pgTable(
  "clinic_services",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    clinicId: text("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    serviceId: text("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    isFeatured: boolean("is_featured").default(false).notNull(),
    displayOrder: integer("display_order").default(0),
    addedAt: timestamp("added_at").defaultNow().notNull(),
    addedBy: text("added_by").references(() => user.id),
  },
  (table) => [
    index("clinic_services_clinic_idx").on(table.clinicId),
    index("clinic_services_service_idx").on(table.serviceId),
    index("clinic_services_featured_idx").on(table.clinicId, table.isFeatured),
  ]
);

// Relations
export const servicesRelations = relations(services, ({ many }) => ({
  clinicServices: many(clinicServices),
}));

export const clinicServicesRelations = relations(clinicServices, ({ one }) => ({
  clinic: one(clinics, {
    fields: [clinicServices.clinicId],
    references: [clinics.id],
  }),
  service: one(services, {
    fields: [clinicServices.serviceId],
    references: [services.id],
  }),
}));
```

**CLI Commands:**
```bash
pnpm db:generate
pnpm db:push
```

---

## Phase 2: Types & Seed Data

Create TypeScript types and seed the database with 30 predefined services.

### Tasks

- [x] Create service type definitions
- [x] Create seed data file with 30 services
- [x] Create seed script
- [x] Run seed script to populate services table

### Technical Details

**New file:** `src/types/service.ts`
```typescript
export type ServiceCategory =
  | "injection"
  | "procedure"
  | "physical"
  | "diagnostic"
  | "management"
  | "specialized";

export interface Service {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  description: string | null;
  category: ServiceCategory;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClinicService {
  id: string;
  clinicId: string;
  serviceId: string;
  isFeatured: boolean;
  displayOrder: number;
  addedAt: Date;
  service?: Service;
}
```

**New file:** `src/data/services-seed.ts`

30 services with icons:

| Category | Services |
|----------|----------|
| injection | Injection Therapy (Syringe), Epidural Steroid Injections (Syringe), Facet Joint Injections (Syringe), Trigger Point Injections (Target), Joint Injections (Syringe), Botox for Pain (Syringe) |
| procedure | Nerve Blocks (Zap), Spinal Cord Stimulation (Cpu), Radiofrequency Ablation (Radio), Intrathecal Pump (Droplet), Kyphoplasty (Bone), Discography (Circle) |
| physical | Physical Therapy (Activity), Massage Therapy (Hand), Chiropractic Care (Spine), Acupuncture (Target), Aquatic Therapy (Waves) |
| diagnostic | EMG/Nerve Studies (Activity), Diagnostic Imaging (Scan), Pain Assessment (ClipboardList), Functional Capacity Evaluation (Gauge) |
| management | Medication Management (Pill), Psychological Services (Brain), Pain Counseling (MessageCircle), Biofeedback (Monitor), Sleep Medicine (Moon) |
| specialized | Regenerative Medicine (Leaf), TENS Therapy (Zap), Ketamine Infusion (Droplet), Workers Comp Evaluation (Briefcase) |

**New file:** `src/scripts/seed-services.ts`
```typescript
// Script to insert all services into database
// Run with: pnpm tsx src/scripts/seed-services.ts
```

**CLI Command:**
```bash
pnpm tsx src/scripts/seed-services.ts
```

---

## Phase 3: Query Functions

Create database query functions for services CRUD and clinic-service relationships.

### Tasks

- [x] Create services query functions (CRUD)
- [x] Create clinic-services query functions

### Technical Details

**New file:** `src/lib/services-queries.ts`

```typescript
// Functions to implement:
export async function getAllServices(): Promise<Service[]>
export async function getServiceById(id: string): Promise<Service | null>
export async function getServiceBySlug(slug: string): Promise<Service | null>
export async function getServicesByCategory(category: ServiceCategory): Promise<Service[]>
export async function createService(data: CreateServiceInput): Promise<Service>
export async function updateService(id: string, data: UpdateServiceInput): Promise<Service>
export async function deleteService(id: string): Promise<void>
export async function getServicesWithClinicCount(): Promise<ServiceWithCount[]>
```

**New file:** `src/lib/clinic-services-queries.ts`

```typescript
// Functions to implement:
export async function getClinicServices(clinicId: string): Promise<ClinicService[]>
export async function getFeaturedClinicServices(clinicId: string): Promise<ClinicService[]>
export async function setClinicServices(clinicId: string, services: SetServiceInput[]): Promise<void>
export async function addServiceToClinic(clinicId: string, serviceId: string, isFeatured?: boolean): Promise<void>
export async function removeServiceFromClinic(clinicId: string, serviceId: string): Promise<void>
export async function getClinicsByService(serviceId: string): Promise<ClinicSummary[]>
```

---

## Phase 4: Admin API Routes

Create REST API endpoints for service management.

### Tasks

- [x] Create services list/create API route
- [x] Create single service API route (GET, PUT, DELETE)
- [x] Create clinic services API route

### Technical Details

**New file:** `src/app/api/admin/services/route.ts`

```typescript
// GET - List all services with clinic counts
// POST - Create new service
// Uses checkAdminApi() for authentication (pattern from existing admin routes)
```

**New file:** `src/app/api/admin/services/[serviceId]/route.ts`

```typescript
// GET - Get single service by ID
// PUT - Update service
// DELETE - Delete service (only if not used by clinics)
```

**New file:** `src/app/api/admin/services/clinic/[clinicId]/route.ts`

```typescript
// GET - Get clinic's services and available services
// PUT - Update clinic's services (full replacement)

// Response shape for GET:
{
  clinicId: string;
  clinicName: string;
  services: ClinicService[];
  availableServices: Service[];
  featuredCount: number;
}

// Request shape for PUT:
{
  services: {
    serviceId: string;
    isFeatured: boolean;
    displayOrder: number;
  }[];
}
```

---

## Phase 5: Admin UI - Global Services [complex]

Create admin interface for managing the global service catalog.

### Tasks

- [x] Add "Services" link to admin sidebar
- [x] Create icon picker component
- [x] Create service form component (add/edit)
- [x] Create services list component with table
- [x] Create services admin page
- [x] Create new service page
- [x] Create edit service page

### Technical Details

**File to modify:** `src/components/admin/admin-sidebar.tsx`
- Add link: `{ name: "Services", href: "/admin/services", icon: Sparkles }`

**New file:** `src/components/admin/services/service-icon-picker.tsx`
```typescript
interface ServiceIconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  disabled?: boolean;
}
// Dropdown showing all available Lucide icons with preview
// Icons to include: Syringe, Zap, Cpu, Activity, Pill, Brain, Target, Hand,
// Leaf, Radio, Droplet, Bone, Circle, Waves, Scan, ClipboardList, Gauge,
// MessageCircle, Monitor, Moon, Briefcase, Spine
```

**New file:** `src/components/admin/services/service-form.tsx`
```typescript
interface ServiceFormProps {
  service?: Service;
  onSubmit: (data: ServiceFormData) => Promise<void>;
  isLoading?: boolean;
}
// Fields: name, slug (auto-generated), iconName (picker), description, category (select)
```

**New file:** `src/components/admin/services/service-list.tsx`
```typescript
interface ServiceListProps {
  services: ServiceWithCount[];
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
}
// DataTable with columns: Icon, Name, Category, Clinics Using, Actions
// Category filter tabs
```

**New pages:**
- `src/app/admin/services/page.tsx` - Services list
- `src/app/admin/services/new/page.tsx` - Add service form
- `src/app/admin/services/[serviceId]/page.tsx` - Edit service form

---

## Phase 6: Admin UI - Clinic Services [complex]

Create interface for managing which services a clinic offers.

### Tasks

- [x] Create clinic service selector component
- [x] Create clinic services tab component
- [x] Create clinic edit page with services tab
- [x] Create dedicated clinic services page

### Technical Details

**New file:** `src/components/admin/services/clinic-service-selector.tsx`
```typescript
interface ClinicServiceSelectorProps {
  clinicId: string;
  initialServices: ClinicService[];
  availableServices: Service[];
  onSave: (services: SetServiceInput[]) => Promise<void>;
}
// Features:
// - Searchable multi-select with checkboxes
// - Category grouping (collapsible sections)
// - Featured toggle (star icon) with "8 recommended" hint
// - Drag-to-reorder for featured services
// - Save button with loading state
```

**New file:** `src/components/admin/clinics/clinic-services-tab.tsx`
- Wraps ClinicServiceSelector with data fetching

**New pages:**
- `src/app/admin/clinics/[clinicId]/page.tsx` - Clinic detail/edit page with tabs
- `src/app/admin/clinics/[clinicId]/services/page.tsx` - Standalone services management

---

## Phase 7: Public Display Updates

Update public-facing components to display services from the database.

### Tasks

- [x] Update service-icons.tsx for dynamic icon loading
- [x] Create featured-services.tsx component
- [x] Update clinic-services.tsx to use database services
- [x] Update clinic-card.tsx to show featured service icons
- [x] Update clinic-db-to-type.ts to use junction table

### Technical Details

**File to modify:** `src/components/clinic/service-icons.tsx`
```typescript
// Change from hardcoded serviceIconMap to dynamic lookup
// Accept Service objects instead of ServiceType strings
// Keep backward compatibility during migration
```

**New file:** `src/components/clinic/featured-services.tsx`
```typescript
interface FeaturedServicesProps {
  services: ClinicService[];
  className?: string;
  showDescriptions?: boolean;
}
// Grid display (2x4 on desktop, 1x8 on mobile)
// Large icons (64x64px) with name and description
// Used on clinic detail pages
```

**File to modify:** `src/components/clinic/clinic-services.tsx`
- Update to accept ClinicService[] instead of ServiceType[]
- Use service data from database

**File to modify:** `src/components/clinic/clinic-card.tsx`
- Update ServiceIcons usage for new data structure
- Continue showing max 4 icons with "+X more"

**File to modify:** `src/lib/clinic-db-to-type.ts`
```typescript
// Update transformDbClinicToType to:
// 1. Check for clinic_services junction table data first
// 2. Fall back to mapAmenitiesToServices() during migration
// 3. Return services in correct format for components

// Hybrid approach during migration:
const servicesFromJunction = dbClinic.clinicServices?.map(cs => cs.service) || [];
const services = servicesFromJunction.length > 0
  ? servicesFromJunction
  : mapAmenitiesToServices(dbClinic.amenities);
```

---

## Phase 8: Data Migration

Migrate existing amenities data to the new services system.

### Tasks

- [x] Create amenity-to-service mapping
- [x] Create migration script
- [x] Run migration script
- [x] Verify migration results
- [x] Remove fallback code after verification

### Technical Details

**New file:** `src/scripts/migrate-amenities.ts`

```typescript
// Amenity string to service slug mapping
const amenityToSlugMap: Record<string, string> = {
  "injection therapy": "injection-therapy",
  "injections": "injection-therapy",
  "physical therapy": "physical-therapy",
  "physical rehabilitation": "physical-therapy",
  "medication management": "medication-management",
  "pain medication": "medication-management",
  "nerve blocks": "nerve-blocks",
  "nerve block": "nerve-blocks",
  "spinal cord stimulation": "spinal-cord-stimulation",
  "regenerative medicine": "regenerative-medicine",
  "stem cell therapy": "regenerative-medicine",
  "prp therapy": "regenerative-medicine",
  "acupuncture": "acupuncture",
  "chiropractic": "chiropractic-care",
  "massage therapy": "massage-therapy",
  "massage": "massage-therapy",
  "psychological services": "psychological-services",
  "psychology": "psychological-services",
  "mental health": "psychological-services",
};

// Migration steps:
// 1. Fetch all clinics with amenities
// 2. For each clinic, map amenities to service slugs
// 3. Look up service IDs by slug
// 4. Insert into clinic_services (onConflictDoNothing)
// 5. Log results
```

**CLI Command:**
```bash
pnpm tsx src/scripts/migrate-amenities.ts
```

**Verification queries:**
```sql
-- Count clinics with services
SELECT COUNT(DISTINCT clinic_id) FROM clinic_services;

-- Services usage
SELECT s.name, COUNT(cs.id) as clinic_count
FROM services s
LEFT JOIN clinic_services cs ON s.id = cs.service_id
GROUP BY s.id ORDER BY clinic_count DESC;
```

**Post-migration cleanup (after verification):**
- Remove `mapAmenitiesToServices()` function
- Remove fallback logic from `transformDbClinicToType()`
- Update types to remove old ServiceType

---

## File Summary

### New Files (17)

| Path | Purpose |
|------|---------|
| `src/types/service.ts` | Type definitions |
| `src/data/services-seed.ts` | Seed data for 30 services |
| `src/scripts/seed-services.ts` | Seed script |
| `src/scripts/migrate-amenities.ts` | Migration script |
| `src/lib/services-queries.ts` | Service CRUD queries |
| `src/lib/clinic-services-queries.ts` | Junction table queries |
| `src/app/api/admin/services/route.ts` | Services API |
| `src/app/api/admin/services/[serviceId]/route.ts` | Single service API |
| `src/app/api/admin/services/clinic/[clinicId]/route.ts` | Clinic services API |
| `src/app/admin/services/page.tsx` | Services list page |
| `src/app/admin/services/new/page.tsx` | Add service page |
| `src/app/admin/services/[serviceId]/page.tsx` | Edit service page |
| `src/app/admin/clinics/[clinicId]/page.tsx` | Clinic edit page |
| `src/app/admin/clinics/[clinicId]/services/page.tsx` | Clinic services page |
| `src/components/admin/services/service-icon-picker.tsx` | Icon picker |
| `src/components/admin/services/service-form.tsx` | Service form |
| `src/components/admin/services/service-list.tsx` | Services table |
| `src/components/admin/services/clinic-service-selector.tsx` | Multi-select |
| `src/components/admin/clinics/clinic-services-tab.tsx` | Tab wrapper |
| `src/components/clinic/featured-services.tsx` | Public display |

### Modified Files (6)

| Path | Changes |
|------|---------|
| `src/lib/schema.ts` | Add services tables, enum, relations |
| `src/components/admin/admin-sidebar.tsx` | Add Services nav link |
| `src/components/clinic/service-icons.tsx` | Dynamic icon loading |
| `src/components/clinic/clinic-services.tsx` | Use database services |
| `src/components/clinic/clinic-card.tsx` | Show featured icons |
| `src/lib/clinic-db-to-type.ts` | Use junction table |
