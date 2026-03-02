import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getFeaturedClinics, getSimilarClinicsByServices } from "@/lib/clinic-queries";
import { formatDistance } from "@/lib/distance";

/**
 * GET /api/clinics/featured
 *
 * Fetch featured clinics with optional geo-filtering and random mode.
 *
 * Query parameters:
 * - lat: Latitude (optional) - enables distance-based sorting
 * - lng: Longitude (optional) - enables distance-based sorting
 * - radius: Search radius in miles (default: 50, max: 100)
 * - state: Filter by state abbreviation (e.g., "CA", "NY")
 * - city: Filter by city name
 * - limit: Maximum results (default: 10, max: 20)
 * - exclude: Clinic ID to exclude from results
 * - random: Set to "true" for random ordering (only when no lat/lng)
 * - services: Comma-separated service IDs for fallback similar-clinic matching
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Parse optional location parameters
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const lat = latParam ? parseFloat(latParam) : undefined;
  const lng = lngParam ? parseFloat(lngParam) : undefined;

  // Validate coordinates if provided
  if (lat !== undefined || lng !== undefined) {
    if (lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: "Both lat and lng are required when providing coordinates." },
        { status: 400 }
      );
    }
    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: "Invalid coordinates. lat and lng must be numbers." },
        { status: 400 }
      );
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: "Coordinates out of range." },
        { status: 400 }
      );
    }
  }

  // Parse other parameters
  const radius = Math.min(
    parseFloat(searchParams.get("radius") || "50"),
    100 // Cap at 100 miles
  );
  const limit = Math.min(
    parseInt(searchParams.get("limit") || "10", 10),
    20 // Cap at 20 results
  );
  const stateAbbrev = searchParams.get("state") || undefined;
  const city = searchParams.get("city") || undefined;
  const excludeClinicId = searchParams.get("exclude") || undefined;
  const randomize = searchParams.get("random") === "true";
  const serviceIdsParam = searchParams.get("services") || undefined;
  const serviceIds = serviceIdsParam ? serviceIdsParam.split(",").filter(Boolean) : [];

  try {
    // Build options object, only including defined values
    const queryOptions: Parameters<typeof getFeaturedClinics>[0] = {
      radiusMiles: radius,
      limit,
      randomize,
    };

    // Only add location if both are valid numbers
    if (lat !== undefined && lng !== undefined) {
      queryOptions.lat = lat;
      queryOptions.lng = lng;
    }

    // Only add optional filters if defined
    if (stateAbbrev) queryOptions.stateAbbrev = stateAbbrev;
    if (city) queryOptions.city = city;
    if (excludeClinicId) queryOptions.excludeClinicId = excludeClinicId;

    // Cache key derived from query params — featured clinics change weekly at most
    const cacheKey = [
      "featured",
      stateAbbrev || "all",
      city || "all",
      excludeClinicId || "none",
      String(limit),
      randomize ? "rand" : "det",
      serviceIds.join("-") || "no-svc",
    ].join(":");

    const { clinics, fallbackUsed } = await unstable_cache(
      async () => {
        let result = await getFeaturedClinics(queryOptions);
        let fb = false;

        if (result.length === 0 && stateAbbrev && serviceIds.length > 0) {
          const similarClinics = await getSimilarClinicsByServices({
            stateAbbrev,
            serviceIds,
            ...(excludeClinicId ? { excludeClinicId } : {}),
            limit,
          });
          result = similarClinics as typeof result;
          fb = true;
        }

        return { clinics: result, fallbackUsed: fb };
      },
      [cacheKey],
      { revalidate: 3600, tags: ["featured-clinics"] }
    )();

    // Transform to frontend-friendly format
    const formattedClinics = clinics.map((clinic) => {
      // Build photos array with fallbacks: imageFeatured > clinicImageUrls > imageUrl
      const photos: string[] = [];
      if (clinic.imageFeatured) {
        photos.push(clinic.imageFeatured);
      }
      if (clinic.clinicImageUrls && clinic.clinicImageUrls.length > 0) {
        // Add clinic images, avoiding duplicates
        for (const url of clinic.clinicImageUrls) {
          if (url && !photos.includes(url)) {
            photos.push(url);
          }
        }
      }
      // Fallback to imageUrl if we still have no images
      if (photos.length === 0 && clinic.imageUrl) {
        // imageUrl may contain multiple URLs separated by |
        const urls = clinic.imageUrl.split("|").filter(Boolean);
        photos.push(...urls);
      }

      return {
        id: clinic.id,
        name: clinic.title,
        slug: clinic.permalink?.replace("pain-management/", "") || "",
        address: {
          street: clinic.streetAddress || "",
          city: clinic.city,
          state: clinic.stateAbbreviation || "",
          zipCode: clinic.postalCode || "",
          formatted: [
            clinic.streetAddress,
            clinic.city,
            clinic.stateAbbreviation,
            clinic.postalCode,
          ]
            .filter(Boolean)
            .join(", "),
        },
        coordinates: {
          lat: clinic.mapLatitude ?? 0,
          lng: clinic.mapLongitude ?? 0,
        },
        phone: clinic.phone || "",
        rating: clinic.rating ?? 0,
        reviewCount: clinic.reviewCount ?? 0,
        isFeatured: clinic.isFeatured,
        featuredTier: clinic.featuredTier || "none",
        isVerified: clinic.isVerified,
        photos,
        distance: lat !== undefined ? clinic.distance : null,
        distanceFormatted:
          lat !== undefined && clinic.distance
            ? formatDistance(clinic.distance)
            : null,
      };
    });

    return NextResponse.json({
      clinics: formattedClinics,
      total: formattedClinics.length,
      fallback: fallbackUsed,
      filters: {
        state: stateAbbrev || null,
        city: city || null,
        radius: lat !== undefined ? radius : null,
        randomized: randomize && lat === undefined,
      },
    });
  } catch (error) {
    console.error("Error fetching featured clinics:", error);
    return NextResponse.json(
      { error: "Failed to fetch featured clinics" },
      { status: 500 }
    );
  }
}
