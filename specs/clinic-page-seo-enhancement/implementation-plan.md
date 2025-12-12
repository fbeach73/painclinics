# Implementation Plan: Clinic Page SEO Enhancement

## Overview

Display unused database fields on clinic detail pages and generate AI-enhanced "About" content. Implementation progresses from exposing data in the type system, through creating display components, to building the AI generation system.

---

## Phase 1: Expose Unused Fields in Type System ✅

Add currently unused database fields to the Clinic type and transformation layer.

### Tasks

- [x] Update `Clinic` type with new optional fields
- [x] Update `transformDbClinicToType` to include new fields
- [x] Verify fields are accessible in page components

### Technical Details

**File:** `src/types/clinic.ts`

Add to Clinic interface:
```typescript
// FAQ & Questions
questions?: { question: string; answer: string }[];

// Reviews
featuredReviews?: { text: string; rating: number; author?: string; date?: string }[];
reviewsPerScore?: Record<string, number>; // { "5": 42, "4": 18, ... }
reviewKeywords?: string[];

// Services & Amenities
checkboxFeatures?: string[]; // Procedures/services
amenities?: string[];

// Enhanced content
enhancedAbout?: string; // AI-generated, stored in newPostContent
```

**File:** `src/lib/clinic-db-to-type.ts`

Add field mappings:
```typescript
questions: dbClinic.questions ?? undefined,
featuredReviews: dbClinic.featuredReviews ?? undefined,
reviewsPerScore: dbClinic.reviewsPerScore ?? undefined,
reviewKeywords: dbClinic.reviewKeywords ?? undefined,
checkboxFeatures: dbClinic.checkboxFeatures ?? undefined,
amenities: dbClinic.amenities ?? undefined,
enhancedAbout: dbClinic.newPostContent ?? undefined,
```

---

## Phase 2: Create FAQ Section Component ✅

Build accordion-style FAQ section with structured data.

### Tasks

- [x] Create `ClinicFAQ` component with accordion UI
- [x] Add FAQPage structured data generation
- [x] Integrate into clinic detail page

### Technical Details

**File:** `src/components/clinic/clinic-faq.tsx`

```typescript
interface ClinicFAQProps {
  questions: { question: string; answer: string }[];
  className?: string;
}

export function ClinicFAQ({ questions, className }: ClinicFAQProps) {
  if (!questions?.length) return null;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Frequently Asked Questions</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible>
          {questions.map((q, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger>{q.question}</AccordionTrigger>
              <AccordionContent>{q.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
```

**File:** `src/lib/structured-data.ts`

Add FAQ schema generator (may already exist):
```typescript
export function generateFAQStructuredData(questions: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map(q => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };
}
```

**Integration:** `src/app/pain-management/[...slug]/page.tsx`

Add below About section:
```tsx
{clinic.questions && clinic.questions.length > 0 && (
  <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(generateFAQStructuredData(clinic.questions)) }}
    />
    <ClinicFAQ questions={clinic.questions} />
  </>
)}
```

---

## Phase 3: Create Reviews Section Components ✅

Build testimonials, star breakdown, and keyword display components.

### Tasks

- [x] Create `ClinicTestimonials` component for featured reviews
- [x] Create `ReviewBreakdown` component for star distribution
- [x] Create `ReviewKeywords` component for keyword badges
- [x] Create wrapper `ClinicReviews` component
- [x] Integrate into clinic detail page

### Technical Details

**File:** `src/components/clinic/clinic-testimonials.tsx`

```typescript
interface ClinicTestimonialsProps {
  reviews: { text: string; rating: number; author?: string; date?: string }[];
}

export function ClinicTestimonials({ reviews }: ClinicTestimonialsProps) {
  if (!reviews?.length) return null;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Patient Testimonials</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {reviews.slice(0, 4).map((review, i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: review.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-4">"{review.text}"</p>
              {review.author && (
                <p className="text-sm font-medium mt-2">— {review.author}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

**File:** `src/components/clinic/review-breakdown.tsx`

```typescript
interface ReviewBreakdownProps {
  reviewsPerScore: Record<string, number>;
  totalReviews: number;
}

export function ReviewBreakdown({ reviewsPerScore, totalReviews }: ReviewBreakdownProps) {
  if (!reviewsPerScore || !totalReviews) return null;

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">Rating Breakdown</h3>
      {[5, 4, 3, 2, 1].map(score => {
        const count = reviewsPerScore[String(score)] || 0;
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
        return (
          <div key={score} className="flex items-center gap-2">
            <span className="w-8 text-sm">{score}★</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 rounded-full"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="w-12 text-sm text-muted-foreground">{count}</span>
          </div>
        );
      })}
    </div>
  );
}
```

**File:** `src/components/clinic/review-keywords.tsx`

```typescript
interface ReviewKeywordsProps {
  keywords: string[];
}

export function ReviewKeywords({ keywords }: ReviewKeywordsProps) {
  if (!keywords?.length) return null;

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">What Patients Say</h3>
      <div className="flex flex-wrap gap-2">
        {keywords.slice(0, 10).map((keyword, i) => (
          <Badge key={i} variant="secondary">{keyword}</Badge>
        ))}
      </div>
    </div>
  );
}
```

**File:** `src/components/clinic/clinic-reviews.tsx`

Wrapper component combining all three:
```typescript
interface ClinicReviewsProps {
  featuredReviews?: { text: string; rating: number; author?: string }[];
  reviewsPerScore?: Record<string, number>;
  reviewKeywords?: string[];
  totalReviews: number;
}

export function ClinicReviews(props: ClinicReviewsProps) {
  const hasContent = props.featuredReviews?.length ||
                     props.reviewsPerScore ||
                     props.reviewKeywords?.length;

  if (!hasContent) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient Reviews</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ReviewBreakdown
          reviewsPerScore={props.reviewsPerScore}
          totalReviews={props.totalReviews}
        />
        <ReviewKeywords keywords={props.reviewKeywords} />
        <ClinicTestimonials reviews={props.featuredReviews} />
      </CardContent>
    </Card>
  );
}
```

---

## Phase 4: Create Amenities Component ✅

Build visual amenities display with icons.

### Tasks

- [x] Create `ClinicAmenities` component
- [x] Map amenity names to icons
- [x] Add to sidebar or main content area

### Technical Details

**File:** `src/components/clinic/clinic-amenities.tsx`

```typescript
const AMENITY_ICONS: Record<string, LucideIcon> = {
  'wheelchair accessible': Accessibility,
  'parking': ParkingCircle,
  'free wifi': Wifi,
  'restroom': Bath,
  'waiting area': Sofa,
  // Add more mappings as needed
};

interface ClinicAmenitiesProps {
  amenities: string[];
  className?: string;
}

export function ClinicAmenities({ amenities, className }: ClinicAmenitiesProps) {
  if (!amenities?.length) return null;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Amenities</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {amenities.map((amenity, i) => {
            const Icon = AMENITY_ICONS[amenity.toLowerCase()] || CheckCircle;
            return (
              <Badge key={i} variant="outline" className="gap-1">
                <Icon className="h-3 w-3" />
                {amenity}
              </Badge>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Integration:** Add to sidebar in clinic detail page

---

## Phase 5: AI About Enhancement Endpoint ✅

Create API endpoint for generating enhanced About content.

### Tasks

- [x] Create AI enhancement API endpoint
- [x] Implement content cleaning and generation logic
- [x] Add database update for `newPostContent`
- [x] Create admin UI trigger button

### Technical Details

**File:** `src/app/api/admin/clinics/[clinicId]/enhance-about/route.ts`

```typescript
import { openrouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ clinicId: string }> }
) {
  // Auth check (admin only)
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user?.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clinicId } = await params;

  // Fetch clinic data
  const clinic = await getClinicById(clinicId);
  if (!clinic) {
    return Response.json({ error: "Clinic not found" }, { status: 404 });
  }

  // Generate enhanced content
  const prompt = buildEnhancementPrompt(clinic);

  const { text } = await generateText({
    model: openrouter(process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini"),
    prompt,
    maxTokens: 1000,
  });

  // Save to database
  await db
    .update(clinics)
    .set({ newPostContent: text, updatedAt: new Date() })
    .where(eq(clinics.id, clinicId));

  return Response.json({ success: true, content: text });
}

function buildEnhancementPrompt(clinic: DbClinic): string {
  return `You are enhancing a pain management clinic's description. Create a clean, professional 2-3 paragraph description.

RULES:
- Remove any addresses, phone numbers, or email addresses (displayed elsewhere on page)
- Fix formatting, punctuation, and grammar issues
- Keep it concise but informative (150-250 words)
- Naturally incorporate the clinic's services and amenities if provided
- Mention positive themes from review keywords if available
- Do NOT invent information not present in the data
- Write in third person
- Do NOT use phrases like "this clinic" repeatedly - vary the language

CLINIC DATA:
Name: ${clinic.title}
Services: ${clinic.checkboxFeatures?.join(", ") || "Not specified"}
Amenities: ${clinic.amenities?.join(", ") || "Not specified"}
Review Keywords: ${clinic.reviewKeywords?.join(", ") || "Not available"}
Original Content: ${clinic.content || "No content available"}

OUTPUT: A clean, SEO-friendly description without addresses, phone numbers, or emails.`;
}
```

**Admin UI:** Add button to clinic detail admin page

```tsx
<Button onClick={handleEnhanceAbout} disabled={isEnhancing}>
  {isEnhancing ? "Enhancing..." : "Generate Enhanced About"}
</Button>
```

---

## Phase 6: Update Clinic About Component ✅

Modify About component to use enhanced content when available.

### Tasks

- [x] Update `ClinicAbout` to prefer `enhancedAbout` over `about`
- [x] Add fallback to original content
- [x] Handle HTML stripping for original content

### Technical Details

**File:** `src/components/clinic/clinic-about.tsx`

```typescript
interface ClinicAboutProps {
  about: string;
  enhancedAbout?: string;
  className?: string;
}

export function ClinicAbout({ about, enhancedAbout, className }: ClinicAboutProps) {
  // Prefer enhanced content if available
  const content = enhancedAbout || about;

  if (!content) return null;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>About</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {enhancedAbout ? (
            // Enhanced content is clean text, render directly
            <p>{content}</p>
          ) : (
            // Original content may have HTML, sanitize and render
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## Phase 7: Integrate All Components into Clinic Page ✅

Add all new sections to the clinic detail page.

### Tasks

- [x] Add FAQ section below About
- [x] Add Reviews section below FAQ
- [x] Add Amenities to sidebar
- [x] Update About component usage
- [x] Add FAQ structured data

### Technical Details

**File:** `src/app/pain-management/[...slug]/page.tsx`

Update left column content:
```tsx
{/* About Section - use enhanced if available */}
{(clinic.about || clinic.enhancedAbout) && (
  <ClinicAbout
    about={clinic.about}
    enhancedAbout={clinic.enhancedAbout}
  />
)}

{/* FAQ Section */}
{clinic.questions && clinic.questions.length > 0 && (
  <ClinicFAQ questions={clinic.questions} />
)}

{/* Reviews Section */}
<ClinicReviews
  featuredReviews={clinic.featuredReviews}
  reviewsPerScore={clinic.reviewsPerScore}
  reviewKeywords={clinic.reviewKeywords}
  totalReviews={clinic.reviewCount}
/>

{/* Insurance Section */}
{clinic.insuranceAccepted.length > 0 && (
  <ClinicInsurance insurance={clinic.insuranceAccepted} />
)}
```

Update sidebar:
```tsx
{/* Amenities */}
{clinic.amenities && clinic.amenities.length > 0 && (
  <ClinicAmenities amenities={clinic.amenities} />
)}

{/* Location Map */}
<Card>
  ...existing map card...
</Card>
```

Add FAQ structured data at top of page:
```tsx
{clinic.questions && clinic.questions.length > 0 && (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify(generateFAQStructuredData(clinic.questions))
    }}
  />
)}
```

---

## File Summary

### New Files to Create

| File | Purpose |
|------|---------|
| `src/components/clinic/clinic-faq.tsx` | FAQ accordion component |
| `src/components/clinic/clinic-testimonials.tsx` | Featured reviews display |
| `src/components/clinic/review-breakdown.tsx` | Star distribution chart |
| `src/components/clinic/review-keywords.tsx` | Keyword badges |
| `src/components/clinic/clinic-reviews.tsx` | Reviews wrapper component |
| `src/components/clinic/clinic-amenities.tsx` | Amenities display |
| `src/app/api/admin/clinics/[clinicId]/enhance-about/route.ts` | AI enhancement endpoint |

### Existing Files to Modify

| File | Changes |
|------|---------|
| `src/types/clinic.ts` | Add new optional fields |
| `src/lib/clinic-db-to-type.ts` | Map new database fields |
| `src/lib/structured-data.ts` | Add/verify FAQ schema generator |
| `src/components/clinic/clinic-about.tsx` | Support enhanced content |
| `src/app/pain-management/[...slug]/page.tsx` | Add all new sections |

---

## Suggested Implementation Order

1. **Phase 1**: Type system updates (enables all other work)
2. **Phase 2**: FAQ component (highest SEO value)
3. **Phase 3**: Reviews components (high trust signal)
4. **Phase 4**: Amenities component (quick win)
5. **Phase 7**: Page integration (make everything visible)
6. **Phase 5-6**: AI enhancement (can be done last, adds uniqueness)
