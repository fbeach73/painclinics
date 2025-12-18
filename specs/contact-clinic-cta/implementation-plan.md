# Implementation Plan: Contact The Clinic CTA

## Overview

Build a sticky floating "Contact This Clinic" CTA button with a conversational multi-step modal form for lead qualification. The form collects pain type, duration, treatment history, insurance status, and contact information, then emails the inquiry to the clinic (with BCC to admin).

---

## Phase 1: Email Infrastructure

Set up the email template and sending function for clinic contact inquiries.

### Tasks

- [x] Create email template `src/emails/contact-clinic-inquiry.tsx`
- [x] Export template from `src/emails/index.ts`
- [x] Add `sendContactClinicInquiryEmail()` function to `src/lib/email.ts` with BCC support

### Technical Details

**Email Template Props:**
```typescript
interface ContactClinicInquiryProps {
  clinicName: string;
  clinicCity: string;
  clinicState: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  preferredContactTime: string;
  additionalInfo?: string;
  painType: string;
  painDuration: string;
  previousTreatment: string;
  insuranceStatus: string;
  submittedAt: string;
}
```

**Email send function signature:**
```typescript
export async function sendContactClinicInquiryEmail(
  clinicEmail: string | null,
  props: ContactClinicInquiryProps
): Promise<{ success: boolean; error?: string }>
```

**BCC Logic:**
- If `clinicEmail` exists: `to: clinicEmail`, `bcc: 'pc@freddybeach.com'`
- If no `clinicEmail`: `to: 'pc@freddybeach.com'`, subject prefix: `[No Clinic Email]`

**Follow existing patterns from:**
- `src/emails/claim-verification.tsx` - template structure
- `src/lib/email.ts` lines 57-80 - sendEmail function signature

---

## Phase 2: API Endpoint

Create the form submission endpoint with validation.

### Tasks

- [x] Create API route `src/app/api/contact/route.ts`
- [x] Add Zod validation schema for form data
- [x] Implement clinic lookup and email sending

### Technical Details

**API Route: `POST /api/contact`**

**Request Body Schema:**
```typescript
const contactFormSchema = z.object({
  clinicId: z.string().min(1),
  painType: z.string().min(1),
  painDuration: z.string().min(1),
  previousTreatment: z.string().min(1),
  insurance: z.string().min(1),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  email: z.string().email('Please enter a valid email'),
  preferredContactTime: z.enum(['morning', 'afternoon', 'evening', 'anytime']),
  additionalInfo: z.string().optional(),
});
```

**API Flow:**
1. Validate request body with Zod
2. Fetch clinic data: `getClinicById(clinicId)` from `src/lib/queries/clinic-queries.ts`
3. Call `sendContactClinicInquiryEmail(clinic.email, props)`
4. Return `{ success: true }` or `{ success: false, error: message }`

**Response Codes:**
- 200: Success
- 400: Validation error
- 404: Clinic not found
- 500: Email send failure

---

## Phase 3: UI Components

Build the sticky button and conversational modal form.

### Tasks

- [x] Add pulse animation CSS to `src/app/globals.css`
- [x] Create modal component `src/components/clinic/contact-clinic-modal.tsx` [complex]
  - [x] Build step state machine with 5 steps
  - [x] Create radio-style question UI with 4 options per question
  - [x] Add contact info form on final step
  - [x] Implement slide transitions between steps
  - [x] Add progress indicator and back navigation
- [x] Create sticky button component `src/components/clinic/contact-clinic-button.tsx`

### Technical Details

**Pulse Animation CSS (add to globals.css):**
```css
@keyframes contact-pulse {
  0%, 100% {
    box-shadow:
      0 10px 15px -3px rgba(20, 184, 166, 0.3),
      0 0 0 0 rgba(20, 184, 166, 0.4);
  }
  50% {
    box-shadow:
      0 10px 15px -3px rgba(20, 184, 166, 0.3),
      0 0 0 12px rgba(20, 184, 166, 0);
  }
}

.contact-cta-pulse {
  animation: contact-pulse 2s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .contact-cta-pulse {
    animation: none;
  }
}
```

**Lead Qualification Questions:**

| Step | Question | Options |
|------|----------|---------|
| 1 | What type of pain are you seeking treatment for? | Back or neck pain (spine-related), Joint pain (knee, hip, shoulder), Nerve pain or neuropathy, Chronic pain condition (fibromyalgia, migraines) |
| 2 | How long have you been experiencing this pain? | Less than 3 months, 3-6 months, 6-12 months, Over 1 year |
| 3 | Have you tried pain management treatments before? | No, this would be my first consultation; Yes, medications only; Yes, physical therapy or injections; Yes, previous surgery or advanced procedures |
| 4 | Do you have health insurance? | Yes, private insurance; Yes, Medicare/Medicaid; Workers' compensation case; Self-pay / No insurance |
| 5 | Contact Information | Name, Phone, Email, Preferred time (select), Additional info (textarea) |

**Form State Machine:**
```typescript
type FormStep = 'pain-type' | 'pain-duration' | 'previous-treatment' | 'insurance' | 'contact-info' | 'success';

interface FormState {
  currentStep: FormStep;
  answers: {
    painType: string | null;
    painDuration: string | null;
    previousTreatment: string | null;
    insurance: string | null;
    name: string;
    phone: string;
    email: string;
    preferredContactTime: string;
    additionalInfo: string;
  };
  isSubmitting: boolean;
}
```

**Button Component Props:**
```typescript
interface ContactClinicButtonProps {
  clinicId: string;
  clinicName: string;
  clinicEmail?: string;
  clinicCity: string;
  clinicState: string;
}
```

**Button Styling:**
```tsx
className={cn(
  // Position - mobile: center, desktop: right
  "fixed bottom-4 left-1/2 -translate-x-1/2 z-50",
  "md:bottom-6 md:right-6 md:left-auto md:translate-x-0",
  // Size
  "px-5 py-2.5 md:px-6 md:py-3",
  // Gradient
  "bg-gradient-to-r from-teal-500 to-blue-600",
  // Text
  "text-white font-semibold text-sm md:text-base",
  // Shape & shadow
  "rounded-full shadow-lg",
  // Animation
  "contact-cta-pulse",
  // Hover
  "hover:scale-105 hover:shadow-xl transition-all duration-300",
)}
```

**Animation classes for step transitions:**
- Forward: `animate-in fade-in-0 slide-in-from-right-4 duration-300`
- Backward: `animate-in fade-in-0 slide-in-from-left-4 duration-300`

**Reference files:**
- `src/components/clinic/claim-form-modal.tsx` - modal pattern with form validation
- `src/components/ui/dialog.tsx` - Dialog component
- `src/components/ui/radio-group.tsx` - RadioGroup component

---

## Phase 4: Integration

Add the button to clinic pages.

### Tasks

- [x] Import and add `ContactClinicButton` to `src/app/pain-management/[...slug]/page.tsx`
- [x] Ensure button only renders on individual clinic pages (not state/city pages)
- [x] Run `pnpm lint && pnpm typecheck`

### Technical Details

**Integration Point:** `src/app/pain-management/[...slug]/page.tsx`

Add after line 752 (end of main content), inside the clinic page section:

```tsx
{/* Contact Clinic CTA - only on individual clinic pages */}
<ContactClinicButton
  clinicId={clinic.id}
  clinicName={clinic.name}
  clinicEmail={clinic.email}
  clinicCity={clinic.address.city}
  clinicState={clinic.address.state}
/>
```

**Conditional rendering:** The component is added inside the `pageType === 'clinic'` section, so it only appears on individual clinic detail pages, not on state or city listing pages.

**Import to add:**
```typescript
import { ContactClinicButton } from "@/components/clinic/contact-clinic-button";
```
