# Implementation Plan: AI-Powered Amenities & Services Enhancement

## Overview

Build two AI-powered features for the clinic admin panel:
1. **Automate Amenities** - AI extracts amenities from review text and descriptions
2. **AI Enhance Services** - AI suggests services with confidence levels and evidence

Both features follow existing patterns from `enhance-about/route.ts` and integrate with OpenRouter.

---

## Phase 1: Automate Amenities API

Create the backend API route for AI-powered amenities extraction.

### Tasks

- [x] Create `/api/admin/clinics/[clinicId]/automate-amenities/route.ts`
  - [x] Implement POST handler with admin auth check
  - [x] Build AI prompt function using clinic data
  - [x] Parse AI JSON response to string array
  - [x] Save amenities to database
  - [x] Implement GET handler for status check
- [x] Add known amenities constant list for AI context

### Technical Details

**File to create**: `src/app/api/admin/clinics/[clinicId]/automate-amenities/route.ts`

**Follow pattern from**: `src/app/api/admin/clinics/[clinicId]/enhance-about/route.ts`

**Key imports**:
```typescript
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { getClinicById } from "@/lib/clinic-queries";
```

**Known amenities list for AI context** (user wants dynamic discovery, but provide these as hints):
- Accessibility: Wheelchair accessible, Wheelchair accessible entrance, Wheelchair accessible restroom, Wheelchair accessible parking lot
- Parking: Free parking, Parking lot, Street parking, Paid parking
- Technology: Free WiFi, WiFi
- Payments: Accepts credit cards, Accepts insurance, Payment plans available
- Languages: Spanish speaking, Bilingual staff
- Environment: Clean facility, Modern equipment, Private treatment rooms, Comfortable waiting area
- Convenience: Same-day appointments, Evening hours, Weekend hours, Online scheduling, Telehealth available

**AI prompt strategy**:
- Provide known amenities list but allow new discoveries
- Analyze `allReviewsText` (limited to first 3000 chars) and `businessDescription`
- Require evidence-based extraction only
- Output: JSON array of strings, max 8 items

**Database update**:
```typescript
await db.update(clinics).set({
  amenities: amenities.length > 0 ? amenities : null,
  updatedAt: new Date(),
}).where(eq(clinics.id, clinicId));
```

---

## Phase 2: Amenities UI in Details Tab

Add the amenities management UI to the clinic details tab.

### Tasks

- [x] Add `amenities` field to `ClinicData` interface in `clinic-details-tab.tsx`
- [x] Add new "Amenities" sub-tab (change grid-cols-4 to grid-cols-5)
- [x] Create amenities tab content with:
  - [x] "Automate Amenities" button with Sparkles icon
  - [x] Loading state during AI processing
  - [x] Display amenities as badges with remove (X) button
  - [x] Manual add input field
- [x] Wire up API call and state management
- [x] Include amenities in save payload

### Technical Details

**File to modify**: `src/components/admin/clinics/clinic-details-tab.tsx`

**New imports to add**:
```typescript
import { Sparkles, X, Plus } from "lucide-react";
```

**Interface update**:
```typescript
interface ClinicData {
  // ... existing fields
  amenities: string[] | null;
}
```

**State to add**:
```typescript
const [isAutomating, setIsAutomating] = useState(false);
```

**Tab structure change**:
```tsx
<TabsList className="grid w-full grid-cols-5">
  {/* existing 4 tabs */}
  <TabsTrigger value="amenities" className="flex items-center gap-2">
    <Sparkles className="h-4 w-4" />
    Amenities
  </TabsTrigger>
</TabsList>
```

**API call pattern**:
```typescript
const handleAutomateAmenities = async () => {
  setIsAutomating(true);
  try {
    const response = await fetch(`/api/admin/clinics/${clinicId}/automate-amenities`, {
      method: "POST",
    });
    const data = await response.json();
    if (data.success) {
      setFormData(prev => ({ ...prev, amenities: data.amenities }));
      toast.success(`Found ${data.amenities.length} amenities`);
    }
  } catch (error) {
    toast.error("Failed to automate amenities");
  } finally {
    setIsAutomating(false);
  }
};
```

**Badge display with remove**:
```tsx
{formData.amenities?.map((amenity, index) => (
  <Badge key={index} variant="secondary" className="flex items-center gap-1">
    {amenity}
    <button onClick={() => removeAmenity(index)}>
      <X className="h-3 w-3" />
    </button>
  </Badge>
))}
```

---

## Phase 3: Enhance Services API

Create the backend API route for AI-powered service suggestions.

### Tasks

- [x] Create `/api/admin/clinics/[clinicId]/enhance-services/route.ts`
  - [x] Implement POST handler with admin auth check
  - [x] Fetch all services and current clinic services
  - [x] Build AI prompt with full services list and clinic data
  - [x] Parse structured JSON response
  - [x] Return suggestions (not auto-save)
- [x] Define response types for service suggestions

### Technical Details

**File to create**: `src/app/api/admin/clinics/[clinicId]/enhance-services/route.ts`

**Key imports**:
```typescript
import { getAllServices } from "@/lib/services-queries";
import { getClinicServices } from "@/lib/clinic-services-queries";
```

**Response structure**:
```typescript
interface ServiceSuggestion {
  serviceId?: string;      // ID if matching existing service
  serviceName: string;     // Name of the service
  confidence: "high" | "medium" | "low";
  evidence: string;        // Brief quote or reason
  isNew: boolean;          // True if suggesting a new service
  suggestedCategory?: string; // For new services
}

interface EnhanceServicesResponse {
  existingServices: ServiceSuggestion[];
  suggestedNewServices: ServiceSuggestion[];
  featuredRecommendations: string[];  // Service IDs to feature (max 8)
}
```

**AI prompt content**:
- Include full services list with IDs and categories (injection, procedure, physical, diagnostic, management, specialized)
- Provide clinic data: `allReviewsText` (2500 chars), `businessDescription` (1500 chars), `checkboxFeatures`, `amenities`
- Request three-tier confidence (high/medium/low) with brief evidence
- Separate existing vs new service suggestions
- Featured recommendations limited to 8

**Note**: This API does NOT auto-save - it returns suggestions for user approval

---

## Phase 4: Service Enhancement Modal [complex]

Create the modal component for reviewing AI service suggestions.

### Tasks

- [x] Create `src/components/admin/services/service-enhance-modal.tsx`
  - [x] Dialog with sections for different suggestion types
  - [x] Suggested services with checkboxes and confidence badges
  - [x] Featured recommendations section
  - [x] New service suggestions section (info only, admin must add manually)
  - [x] Apply Selected button
- [x] Add confidence badge component (high=green, medium=yellow, low=gray)
- [x] Wire up apply logic to update clinic services

### Technical Details

**File to create**: `src/components/admin/services/service-enhance-modal.tsx`

**Component props**:
```typescript
interface ServiceEnhanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinicId: string;
  clinicName: string;
  currentServices: ClinicService[];
  onApply: (services: SetServiceInput[]) => Promise<void>;
}
```

**Modal structure**:
```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>AI Service Suggestions</DialogTitle>
      <DialogDescription>Review and apply AI-suggested services for {clinicName}</DialogDescription>
    </DialogHeader>

    {isLoading ? (
      <LoadingState />
    ) : (
      <>
        {/* Existing Services Section */}
        <Section title="Suggested Services" items={suggestions.existingServices} />

        {/* Featured Recommendations */}
        <Section title="Featured Recommendations" items={suggestions.featuredRecommendations} />

        {/* New Service Suggestions (info only) */}
        <Section title="New Services (Add to Master List)" items={suggestions.suggestedNewServices} />
      </>
    )}

    <DialogFooter>
      <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
      <Button onClick={handleApply} disabled={isApplying}>
        {isApplying ? <Loader2 className="animate-spin" /> : "Apply Selected"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Confidence badge colors**:
- `high`: `bg-green-100 text-green-800`
- `medium`: `bg-yellow-100 text-yellow-800`
- `low`: `bg-gray-100 text-gray-600`

---

## Phase 5: Services Tab Integration

Integrate the AI enhance button and modal into the services tab.

### Tasks

- [x] Modify `clinic-services-tab.tsx` to add AI Enhance button
- [x] Add state for modal visibility
- [x] Import and render `ServiceEnhanceModal`
- [x] Handle apply callback to refresh services

### Technical Details

**File to modify**: `src/components/admin/clinics/clinic-services-tab.tsx`

**New imports**:
```typescript
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServiceEnhanceModal } from "@/components/admin/services/service-enhance-modal";
```

**State to add**:
```typescript
const [showEnhanceModal, setShowEnhanceModal] = useState(false);
```

**Button placement** (add wrapper div around ClinicServiceSelector):
```tsx
return (
  <div className="space-y-4">
    <div className="flex justify-end">
      <Button variant="outline" onClick={() => setShowEnhanceModal(true)}>
        <Sparkles className="mr-2 h-4 w-4" />
        AI Enhance
      </Button>
    </div>

    <ClinicServiceSelector
      clinicId={clinicId}
      initialServices={initialServices}
      availableServices={availableServices}
      onSave={handleSave}
    />

    <ServiceEnhanceModal
      open={showEnhanceModal}
      onOpenChange={setShowEnhanceModal}
      clinicId={clinicId}
      clinicName={clinicName}
      currentServices={initialServices}
      onApply={handleApplySuggestions}
    />
  </div>
);
```

**Apply handler**:
```typescript
const handleApplySuggestions = async (services: SetServiceInput[]) => {
  await handleSave(services);
  setShowEnhanceModal(false);
};
```

---

## Phase 6: Update Clinic Page to Pass Amenities

Ensure the clinic admin page passes amenities data to the details tab.

### Tasks

- [x] Update clinic detail page query to include amenities
- [x] Pass amenities to ClinicDetailsTab component
- [x] Ensure save handler includes amenities in update payload

### Technical Details

**File to check**: `src/app/admin/clinics/[clinicId]/page.tsx`

The `getClinicById` function likely already returns amenities. Verify and ensure it's passed to `ClinicDetailsTab`.

**Update in details tab save handler** (if not already included):
```typescript
const updates: Record<string, unknown> = {
  // ... existing fields
  amenities: formData.amenities || null,
};
```
