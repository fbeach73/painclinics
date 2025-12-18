# Implementation Plan: Footer Redesign & Placeholder Pages

## Overview

Replace the boilerplate footer with a comprehensive Footer2 component featuring dynamic location data, create a reusable Logo component, and build 14 placeholder pages for legal compliance, company info, and content.

---

## Phase 1: Logo Component

Create a reusable Logo component that can be used in the footer and potentially elsewhere.

### Tasks

- [x] Create `/src/components/shadcnblocks/` directory
- [x] Create Logo component with size variants and optional text

### Technical Details

**File:** `/src/components/shadcnblocks/logo.tsx`

```typescript
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 24,
  md: 36,
  lg: 48,
};

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const dimension = sizeMap[size];

  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2", className)}
    >
      <Image
        src="/logo.png"
        alt="Pain Clinics"
        width={dimension}
        height={dimension}
        className="rounded-lg"
      />
      {showText && (
        <span className="font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Pain Clinics
        </span>
      )}
    </Link>
  );
}
```

---

## Phase 2: Footer Component [complex]

Replace the existing boilerplate footer with a comprehensive multi-column footer.

### Tasks

- [x] Replace `/src/components/site-footer.tsx` with new Footer2 implementation
  - [x] Create footer structure with 5-column grid layout
  - [x] Add static link columns (Resources, Legal, Company)
  - [x] Implement dynamic Popular Locations column
  - [x] Add Popular Searches SEO section
  - [x] Add copyright bar with bottom links

### Technical Details

**File:** `/src/components/site-footer.tsx`

**Footer Structure:**
```
Footer (Server Component - async)
├── Main Grid (py-12, grid lg:grid-cols-5)
│   ├── Column 1: Logo + Tagline
│   ├── Column 2: Resources Links
│   ├── Column 3: Legal Links
│   ├── Column 4: Company Links
│   └── Column 5: Popular Locations (dynamic)
├── Popular Searches Section (border-t, py-6)
│   └── SEO keyword links
└── Copyright Bar (border-t, py-6)
    ├── Copyright text (left)
    └── Bottom links: Terms | Privacy | Medical Disclaimer (right)
```

**Static Link Data:**
```typescript
const resourcesLinks = [
  { label: 'Browse All Clinics', href: '/clinics' },
  { label: 'Find Clinics Near Me', href: '/clinics' },
  { label: 'Blog', href: '/blog' },
  { label: 'Pain Management Guide', href: '/pain-management-guide' },
  { label: 'Treatment Options', href: '/treatment-options' },
];

const legalLinks = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Cookie Policy', href: '/cookies' },
  { label: 'Accessibility', href: '/accessibility' },
  { label: 'Medical Disclaimer', href: '/medical-disclaimer' },
];

const companyLinks = [
  { label: 'About Us', href: '/about' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'Submit a Clinic', href: '/submit-clinic' },
  { label: 'Advertise With Us', href: '/advertise' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Sitemap', href: '/sitemap' },
];
```

**Dynamic Location Data Fetching:**
```typescript
import { getClinicCountsByState, getAllCitiesWithClinics } from '@/lib/clinic-queries';
import { getStateName } from '@/lib/us-states';

// Inside async SiteFooter component
let topCities: Array<{ city: string; stateAbbreviation: string | null; count: number }> = [];
let topStates: Array<{ stateAbbreviation: string | null; count: number; stateName: string }> = [];

try {
  const stateCounts = await getClinicCountsByState();
  const cityCounts = await getAllCitiesWithClinics();

  topStates = stateCounts
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map(s => ({
      ...s,
      stateName: getStateName(s.stateAbbreviation || ''),
    }));

  topCities = cityCounts
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
} catch (error) {
  console.warn('Footer: Database unavailable for location data');
}
```

**Location URL Patterns:**
- City: `/pain-management/${state.toLowerCase()}/${city.toLowerCase().replace(/\s+/g, '-')}/`
- State: `/pain-management/${state.toLowerCase()}/`

**Popular Searches Keywords:**
```
pain management near me | chronic pain treatment | back pain specialist |
pain doctor near me | fibromyalgia treatment | nerve pain treatment
```

---

## Phase 3: Critical Legal Pages

Create the most important legal pages required for a health-focused website.

### Tasks

- [x] Create Privacy Policy page at `/src/app/privacy/page.tsx`
- [x] Create Terms of Service page at `/src/app/terms/page.tsx`
- [x] Create Medical Disclaimer page at `/src/app/medical-disclaimer/page.tsx` (CRITICAL)

### Technical Details

**Page Template Pattern:**
```typescript
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Title | Pain Clinics',
  description: 'SEO description for the page.',
};

export default function PageName() {
  return (
    <main id="main-content" className="container mx-auto py-8 md:py-12 px-4">
      <div className="max-w-4xl mx-auto prose dark:prose-invert">
        <h1>Page Title</h1>
        <p className="lead text-muted-foreground">Last updated: {date}</p>
        {/* Content sections */}
      </div>
    </main>
  );
}
```

**Medical Disclaimer Page (CRITICAL):**
- Use Alert component with `variant="destructive"` for prominent warning
- Include AlertTriangle icon from lucide-react
- Sections: Not Medical Advice, Consult Healthcare Professionals, No Doctor-Patient Relationship, Information Accuracy, Emergency Situations

**Privacy Policy Sections:**
- Information We Collect
- How We Use Your Information
- Information Sharing
- Cookies and Tracking
- Your Rights
- Contact Us

**Terms of Service Sections:**
- Acceptance of Terms
- Use of Service
- User Conduct
- Intellectual Property
- Disclaimer of Warranties
- Limitation of Liability
- Changes to Terms

---

## Phase 4: Company Pages

Create company information and contact pages.

### Tasks

- [x] Create About Us page at `/src/app/about/page.tsx`
- [x] Create Contact Us page at `/src/app/contact/page.tsx`
- [x] Create Submit a Clinic page at `/src/app/submit-clinic/page.tsx`
- [x] Create Advertise With Us page at `/src/app/advertise/page.tsx`

### Technical Details

**About Page Sections:**
- Our Mission
- What We Do
- Our Team (placeholder)
- Contact Information

**Contact Page:**
- Contact form placeholder (can use Card component for form area)
- Email address
- Physical address placeholder
- Business hours

**Submit a Clinic Page:**
- Explain submission process
- Requirements for listing
- Contact information for submissions

**Advertise Page:**
- Advertising opportunities
- Audience demographics placeholder
- Contact for advertising inquiries

---

## Phase 5: Content & Utility Pages

Create FAQ, editorial policy, content guides, and utility pages.

### Tasks

- [x] Create FAQ page at `/src/app/faq/page.tsx` with Accordion component
- [x] Create Editorial Policy page at `/src/app/editorial-policy/page.tsx`
- [x] Create Pain Management Guide page at `/src/app/pain-management-guide/page.tsx`
- [x] Create Treatment Options page at `/src/app/treatment-options/page.tsx`

### Technical Details

**FAQ Page - Use Accordion Component:**
```typescript
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'How do I find a pain clinic near me?',
    answer: 'Use our search feature or browse by state...',
  },
  {
    question: 'Are the clinics on your site verified?',
    answer: 'We gather information from public sources...',
  },
  {
    question: 'How can I submit my clinic to be listed?',
    answer: 'Visit our Submit a Clinic page...',
  },
  {
    question: 'Is the information on this site medical advice?',
    answer: 'No, our directory is for informational purposes only...',
  },
  {
    question: 'How do I report incorrect information?',
    answer: 'Contact us through our Contact page...',
  },
];
```

**Editorial Policy Sections:**
- Our Standards
- Information Sources
- Verification Process
- Updates and Corrections
- Editorial Independence

**Pain Management Guide Sections:**
- What is Pain Management?
- Types of Pain
- Treatment Approaches
- Finding the Right Clinic
- Questions to Ask

**Treatment Options Sections:**
- Overview of Pain Treatments
- Medication Management
- Interventional Procedures
- Physical Therapy
- Alternative Therapies

---

## Phase 6: Additional Legal & Sitemap Pages

Complete remaining legal pages and create HTML sitemap.

### Tasks

- [x] Create Cookie Policy page at `/src/app/cookies/page.tsx`
- [x] Create Accessibility Statement page at `/src/app/accessibility/page.tsx`
- [x] Create HTML Sitemap page at `/src/app/sitemap-page/page.tsx` (dynamic)

### Technical Details

**Cookie Policy Sections:**
- What Are Cookies
- How We Use Cookies
- Types of Cookies
- Managing Cookies
- Third-Party Cookies

**Accessibility Statement:**
- Our Commitment
- Accessibility Features
- Feedback and Contact
- Conformance Status (WCAG 2.1 AA placeholder)

**HTML Sitemap Page (Server Component - async):**
```typescript
import { getAllStatesWithClinics, getClinicCountsByState } from '@/lib/clinic-queries';
import { getStateName } from '@/lib/us-states';

export default async function SitemapPage() {
  const states = await getAllStatesWithClinics();
  const stateCounts = await getClinicCountsByState();
  const countMap = new Map(stateCounts.map(s => [s.stateAbbreviation, s.count]));

  // Render grid of main pages + all states with clinic counts
}
```

**Sitemap Page Sections:**
- Main Pages (Home, Clinics, Blog, About, Contact, etc.)
- Browse by State (grid of all states with clinic counts)
- Legal Pages
- Resources

---

## Phase 7: Verification

Ensure all changes pass linting and type checking.

### Tasks

- [x] Run `pnpm lint` and fix any issues
- [x] Run `pnpm typecheck` and fix any type errors
- [x] Verify all footer links navigate correctly
- [x] Test dark mode appearance
- [x] Test responsive layout on mobile

### Technical Details

**Commands:**
```bash
pnpm lint
pnpm typecheck
```

**Manual Verification Checklist:**
- Footer displays correctly on desktop (5 columns)
- Footer collapses properly on mobile
- All 14 new pages are accessible
- Popular Locations shows dynamic data
- Dark mode works on footer and all new pages
- Logo component renders correctly
