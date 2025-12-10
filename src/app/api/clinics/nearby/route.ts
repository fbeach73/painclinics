import { NextResponse } from "next/server";
import { getNearbyClinicsByCoordinates } from "@/lib/clinic-queries";
import { formatDistance } from "@/lib/distance";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") || "");
  const lng = parseFloat(searchParams.get("lng") || "");
  const radius = parseFloat(searchParams.get("radius") || "50");
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      { error: "Invalid coordinates. lat and lng are required." },
      { status: 400 }
    );
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json(
      { error: "Coordinates out of range." },
      { status: 400 }
    );
  }

  try {
    const clinics = await getNearbyClinicsByCoordinates(
      lat,
      lng,
      Math.min(radius, 100), // Cap at 100 miles
      Math.min(limit, 100) // Cap at 100 results
    );

    // Transform to match expected frontend format
    const formattedClinics = clinics.map((clinic) => ({
      id: clinic.id,
      name: clinic.title,
      slug: clinic.permalink?.replace("pain-management/", "") || "",
      address: {
        street: clinic.streetAddress || "",
        city: clinic.city,
        state: clinic.stateAbbreviation || "",
        zipCode: clinic.postalCode || "",
        formatted: `${clinic.streetAddress || ""}, ${clinic.city}, ${clinic.stateAbbreviation || ""} ${clinic.postalCode || ""}`.trim(),
      },
      coordinates: {
        lat: clinic.mapLatitude ? parseFloat(String(clinic.mapLatitude)) : 0,
        lng: clinic.mapLongitude ? parseFloat(String(clinic.mapLongitude)) : 0,
      },
      phone: clinic.phone || "",
      rating: clinic.rating ? parseFloat(String(clinic.rating)) : 0,
      reviewCount: clinic.reviewCount || 0,
      isFeatured: clinic.isFeatured || false,
      featuredTier: clinic.featuredTier || "none",
      photos: clinic.imageFeatured ? [clinic.imageFeatured] : [],
      distance: clinic.distance,
      distanceFormatted: formatDistance(clinic.distance),
    }));

    return NextResponse.json({
      clinics: formattedClinics,
      total: formattedClinics.length,
      center: { lat, lng },
      radius,
    });
  } catch (error) {
    console.error("Error fetching nearby clinics:", error);
    return NextResponse.json(
      { error: "Failed to fetch nearby clinics" },
      { status: 500 }
    );
  }
}
