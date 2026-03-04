import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { upsertContact } from "@/lib/contact-queries";
import { sendSubmitClinicEmail } from "@/lib/email";
import { verifyTurnstile } from "@/lib/turnstile";
import { db } from "@/lib/db";
import { clinics } from "@/lib/schema";

const submitClinicSchema = z.object({
  clinicName: z.string().min(1, "Clinic name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  contactEmail: z.string().email("Please enter a valid email"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required").max(2, "Use 2-letter state code"),
  zip: z.string().min(5, "ZIP code is required"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  website: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  services: z.string().optional(),
  additionalInfo: z.string().optional(),
  turnstileToken: z.string().optional(),
});

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina",
  ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", DC: "District of Columbia",
};

function generatePermalink(title: string, city: string, stateAbbrev: string): string {
  const slug = `${title}-${city}-${stateAbbrev}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
  return `pain-management/${slug}`;
}

async function geocodeAddress(address: string, city: string, state: string, zip: string): Promise<{ lat: number; lng: number } | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;
  try {
    const query = encodeURIComponent(`${address}, ${city}, ${state} ${zip}`);
    const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${token}&limit=1`);
    if (!res.ok) return null;
    const data = await res.json();
    const coords = data.features?.[0]?.center;
    if (coords && coords.length === 2) {
      return { lng: coords[0], lat: coords[1] };
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify Turnstile token
    const isValidCaptcha = await verifyTurnstile(body.turnstileToken);
    if (!isValidCaptcha) {
      return NextResponse.json(
        { success: false, error: "Captcha verification failed. Please try again." },
        { status: 400 }
      );
    }

    const validationResult = submitClinicSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      const firstError = Object.values(errors).flat()[0] || "Validation failed";
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    const submittedAt = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
      dateStyle: "full",
      timeStyle: "short",
    });

    const result = await sendSubmitClinicEmail({
      clinicName: data.clinicName,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      address: data.address,
      city: data.city,
      state: data.state.toUpperCase(),
      zip: data.zip,
      phone: data.phone,
      website: data.website || undefined,
      services: data.services || undefined,
      additionalInfo: data.additionalInfo || undefined,
      submittedAt,
    });

    if (!result.success) {
      console.error("Failed to send clinic submission email:", result.error);
      return NextResponse.json(
        { success: false, error: "Failed to submit your clinic. Please try again." },
        { status: 500 }
      );
    }

    // Insert as draft clinic in the database
    try {
      const stateAbbrev = data.state.toUpperCase();
      const stateName = STATE_NAMES[stateAbbrev] || stateAbbrev;
      const permalink = generatePermalink(data.clinicName, data.city, stateAbbrev);

      // Check for duplicate permalink
      const existing = await db
        .select({ id: clinics.id })
        .from(clinics)
        .where(eq(clinics.permalink, permalink))
        .limit(1);

      if (existing.length === 0) {
        // Geocode the address for lat/lng
        const coords = await geocodeAddress(data.address, data.city, stateAbbrev, data.zip);

        await db.insert(clinics).values({
          title: data.clinicName.trim(),
          permalink,
          streetAddress: data.address.trim(),
          city: data.city.trim(),
          state: stateName,
          stateAbbreviation: stateAbbrev,
          postalCode: data.zip.trim(),
          mapLatitude: coords?.lat ?? 0,
          mapLongitude: coords?.lng ?? 0,
          phone: data.phone.trim(),
          website: data.website || null,
          content: data.services || null,
          emails: data.contactEmail ? [data.contactEmail] : null,
          status: "draft",
        });
      }
    } catch (dbError) {
      // Don't fail the submission if DB insert fails — email was already sent
      console.error("Failed to insert draft clinic:", dbError);
    }

    // Sync contact
    try {
      await upsertContact({
        email: data.contactEmail,
        name: data.contactName,
        phone: data.phone,
        tags: ["lead"],
      });
    } catch (contactErr) {
      console.error("Failed to upsert contact:", contactErr);
    }

    return NextResponse.json(
      { success: true, message: "Your clinic has been submitted successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing clinic submission:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
