import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import {
  getServiceById,
  getServiceBySlug,
  updateService,
  deleteService,
} from "@/lib/services-queries";
import type { ServiceCategory, UpdateServiceInput } from "@/types/service";

const VALID_CATEGORIES: ServiceCategory[] = [
  "injection",
  "procedure",
  "physical",
  "diagnostic",
  "management",
  "specialized",
];

interface RouteParams {
  params: Promise<{ serviceId: string }>;
}

/**
 * GET /api/admin/services/[serviceId]
 * Get a single service by ID
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const { serviceId } = await params;

  try {
    const service = await getServiceById(serviceId);

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ service });
  } catch (error) {
    console.error("Error fetching service:", error);
    return NextResponse.json(
      { error: "Failed to fetch service" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/services/[serviceId]
 * Update a service
 *
 * Body: { name?, slug?, iconName?, description?, category?, isActive?, displayOrder? }
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const { serviceId } = await params;

  try {
    // Check if service exists
    const existingService = await getServiceById(serviceId);
    if (!existingService) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updates: UpdateServiceInput = {};

    // Validate and collect updates
    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim().length === 0) {
        return NextResponse.json(
          { error: "Name cannot be empty" },
          { status: 400 }
        );
      }
      updates.name = body.name.trim();
    }

    if (body.slug !== undefined) {
      if (typeof body.slug !== "string" || body.slug.trim().length === 0) {
        return NextResponse.json(
          { error: "Slug cannot be empty" },
          { status: 400 }
        );
      }

      const slug = body.slug.trim();

      // Validate slug format
      if (!/^[a-z0-9-]+$/.test(slug)) {
        return NextResponse.json(
          { error: "Slug must contain only lowercase letters, numbers, and hyphens" },
          { status: 400 }
        );
      }

      // Check for duplicate slug (excluding current service)
      const serviceWithSlug = await getServiceBySlug(slug);
      if (serviceWithSlug && serviceWithSlug.id !== serviceId) {
        return NextResponse.json(
          { error: "A service with this slug already exists" },
          { status: 409 }
        );
      }

      updates.slug = slug;
    }

    if (body.iconName !== undefined) {
      if (typeof body.iconName !== "string" || body.iconName.trim().length === 0) {
        return NextResponse.json(
          { error: "Icon name cannot be empty" },
          { status: 400 }
        );
      }
      updates.iconName = body.iconName.trim();
    }

    if (body.description !== undefined) {
      updates.description = body.description?.trim() || null;
    }

    if (body.category !== undefined) {
      if (!VALID_CATEGORIES.includes(body.category)) {
        return NextResponse.json(
          { error: `Category must be one of: ${VALID_CATEGORIES.join(", ")}` },
          { status: 400 }
        );
      }
      updates.category = body.category;
    }

    if (body.isActive !== undefined) {
      updates.isActive = Boolean(body.isActive);
    }

    if (body.displayOrder !== undefined) {
      if (typeof body.displayOrder !== "number") {
        return NextResponse.json(
          { error: "Display order must be a number" },
          { status: 400 }
        );
      }
      updates.displayOrder = body.displayOrder;
    }

    // Check if there are any updates
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const service = await updateService(serviceId, updates);

    return NextResponse.json({ service });
  } catch (error) {
    console.error("Error updating service:", error);
    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/services/[serviceId]
 * Delete a service (only if not used by any clinics)
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const { serviceId } = await params;

  try {
    // Check if service exists
    const existingService = await getServiceById(serviceId);
    if (!existingService) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    await deleteService(serviceId);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete service";

    // Check if it's a "service in use" error
    if (message.includes("clinic(s) are using")) {
      return NextResponse.json(
        { error: message },
        { status: 409 }
      );
    }

    console.error("Error deleting service:", error);
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
}
