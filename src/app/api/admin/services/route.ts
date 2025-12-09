import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import {
  getServicesWithClinicCount,
  createService,
  getServiceBySlug,
} from "@/lib/services-queries";
import type { CreateServiceInput, ServiceCategory } from "@/types/service";

const VALID_CATEGORIES: ServiceCategory[] = [
  "injection",
  "procedure",
  "physical",
  "diagnostic",
  "management",
  "specialized",
];

/**
 * GET /api/admin/services
 * List all services with clinic usage counts
 */
export async function GET() {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  try {
    const services = await getServicesWithClinicCount();
    return NextResponse.json({ services });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/services
 * Create a new service
 *
 * Body: { name, slug, iconName, description?, category, isActive?, displayOrder? }
 */
export async function POST(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  try {
    const body = await request.json();

    // Validate required fields
    const { name, slug, iconName, category } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!slug || typeof slug !== "string" || slug.trim().length === 0) {
      return NextResponse.json(
        { error: "Slug is required" },
        { status: 400 }
      );
    }

    // Validate slug format (lowercase, alphanumeric, hyphens only)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: "Slug must contain only lowercase letters, numbers, and hyphens" },
        { status: 400 }
      );
    }

    if (!iconName || typeof iconName !== "string") {
      return NextResponse.json(
        { error: "Icon name is required" },
        { status: 400 }
      );
    }

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Category must be one of: ${VALID_CATEGORIES.join(", ")}` },
        { status: 400 }
      );
    }

    // Check for duplicate slug
    const existingService = await getServiceBySlug(slug);
    if (existingService) {
      return NextResponse.json(
        { error: "A service with this slug already exists" },
        { status: 409 }
      );
    }

    // Build service input
    const serviceInput: CreateServiceInput = {
      name: name.trim(),
      slug: slug.trim(),
      iconName: iconName.trim(),
      category,
      description: body.description?.trim() || null,
      isActive: body.isActive !== false,
      displayOrder: typeof body.displayOrder === "number" ? body.displayOrder : 0,
    };

    const service = await createService(serviceInput);

    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}
