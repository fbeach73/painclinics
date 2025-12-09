# Requirements: Featured Clinic Services with Icons

## Overview

Add a database-driven service management system that allows clinics to showcase their pain management services with visual icons. This replaces the current hardcoded amenities-to-services mapping with a flexible, admin-managed system.

## Problem Statement

Currently, clinic services are:
- Hardcoded to 10 service types in TypeScript
- Mapped from `amenities[]` array at runtime via string matching
- Not editable by admins or clinic owners
- Missing many common pain management services

## Goals

1. **Expand service catalog** - Support 30+ predefined pain management services
2. **Visual differentiation** - Display service icons on clinic cards and detail pages
3. **Featured services** - Allow clinics to highlight up to 8 key services
4. **Admin control** - Enable admins to manage the global service catalog
5. **Clinic ownership** - Allow clinic owners to select their offered services
6. **Preserve existing data** - Migrate current amenities to the new system

## User Stories

### As a site visitor, I want to:
- See service icons on clinic cards to quickly identify what treatments are offered
- View featured services prominently on clinic detail pages
- Understand what each service is via tooltips/descriptions

### As a clinic owner, I want to:
- Select which services my clinic offers from a predefined list
- Mark certain services as "featured" to highlight them
- Reorder my featured services for display priority

### As a site admin, I want to:
- Manage the global list of available services
- Add new services with icons and descriptions
- See which clinics offer each service
- Assign services to clinics on their behalf

## Acceptance Criteria

### Database
- [ ] `services` table with 30 predefined pain management services
- [ ] `clinic_services` junction table linking clinics to services
- [ ] Each service has: name, slug, icon, description, category
- [ ] Categories: injection, procedure, physical, diagnostic, management, specialized

### Admin Interface
- [ ] Services list page showing all services with icons and usage counts
- [ ] Add/edit service form with icon picker
- [ ] Clinic service selection interface
- [ ] Services link in admin sidebar

### Public Display
- [ ] Clinic cards show up to 4 featured service icons
- [ ] Clinic detail pages show featured services section with icons and descriptions
- [ ] Service icons have hover tooltips showing service name
- [ ] Mobile responsive layouts

### Data Migration
- [ ] Existing amenities mapped to new services
- [ ] No data loss during migration
- [ ] Fallback to amenities mapping until migration complete

## Service Categories & Examples

| Category | Example Services |
|----------|------------------|
| Injection | Epidural Steroid Injections, Joint Injections, Trigger Point Injections |
| Procedure | Nerve Blocks, Spinal Cord Stimulation, Radiofrequency Ablation |
| Physical | Physical Therapy, Massage Therapy, Chiropractic Care, Acupuncture |
| Diagnostic | EMG/Nerve Studies, Diagnostic Imaging, Pain Assessment |
| Management | Medication Management, Psychological Services, Biofeedback |
| Specialized | Regenerative Medicine, TENS Therapy, Ketamine Infusion |

## Non-Goals (Phase 2+)

- Auto-detect services from clinic content using AI
- Service-based search filtering on listings
- Service landing pages (e.g., `/services/nerve-blocks/`)
- Service analytics dashboard
- Service request form for clinic owners

## Dependencies

- Drizzle ORM (existing)
- PostgreSQL database (existing)
- Lucide React icons (existing)
- shadcn/ui components (existing)
- BetterAuth for admin authentication (existing)

## Related Features

- Clinic import system (may need to import services)
- Content optimization (services could inform content generation)
