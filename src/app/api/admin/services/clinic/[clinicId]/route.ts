import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import {
  getClinicServices,
  setClinicServices,
} from "@/lib/clinic-services-queries";
import { db } from "@/lib/db";
import { clinics } from "@/lib/schema";
import { getAllServices } from "@/lib/services-queries";
import type { SetServiceInput } from "@/types/service";

interface RouteParams {
  params: Promise<{ clinicId: string }>;
}

/**
 * GET /api/admin/services/clinic/[clinicId]
 * Get a clinic's services and available services for management
 *
 * Response: {
 *   clinicId: string;
 *   clinicName: string;
 *   services: ClinicService[];
 *   availableServices: Service[];
 *   featuredCount: number;
 * }
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const { clinicId } = await params;

  try {
    // Get clinic info
    const clinic = await db
      .select({ id: clinics.id, title: clinics.title })
      .from(clinics)
      .where(eq(clinics.id, clinicId))
      .limit(1);

    if (!clinic[0]) {
      return NextResponse.json(
        { error: "Clinic not found" },
        { status: 404 }
      );
    }

    // Get clinic's current services
    const clinicServices = await getClinicServices(clinicId);

    // Get all active services for the available list
    const allServices = await getAllServices(true);

    // Filter out services already assigned to this clinic
    const assignedServiceIds = new Set(clinicServices.map((cs) => cs.serviceId));
    const availableServices = allServices.filter(
      (service) => !assignedServiceIds.has(service.id)
    );

    // Count featured services
    const featuredCount = clinicServices.filter((cs) => cs.isFeatured).length;

    return NextResponse.json({
      clinicId: clinic[0].id,
      clinicName: clinic[0].title,
      services: clinicServices,
      availableServices,
      featuredCount,
    });
  } catch (error) {
    console.error("Error fetching clinic services:", error);
    return NextResponse.json(
      { error: "Failed to fetch clinic services" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/services/clinic/[clinicId]
 * Update a clinic's services (full replacement)
 *
 * Body: {
 *   services: {
 *     serviceId: string;
 *     isFeatured: boolean;
 *     displayOrder: number;
 *   }[];
 * }
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const { clinicId } = await params;

  try {
    // Verify clinic exists
    const clinic = await db
      .select({ id: clinics.id })
      .from(clinics)
      .where(eq(clinics.id, clinicId))
      .limit(1);

    if (!clinic[0]) {
      return NextResponse.json(
        { error: "Clinic not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validate services array
    if (!body.services || !Array.isArray(body.services)) {
      return NextResponse.json(
        { error: "Services must be an array" },
        { status: 400 }
      );
    }

    // Validate each service entry
    const serviceInputs: SetServiceInput[] = [];
    const seenServiceIds = new Set<string>();

    for (let i = 0; i < body.services.length; i++) {
      const item = body.services[i];

      if (!item.serviceId || typeof item.serviceId !== "string") {
        return NextResponse.json(
          { error: `Invalid serviceId at index ${i}` },
          { status: 400 }
        );
      }

      // Check for duplicates
      if (seenServiceIds.has(item.serviceId)) {
        return NextResponse.json(
          { error: `Duplicate serviceId: ${item.serviceId}` },
          { status: 400 }
        );
      }
      seenServiceIds.add(item.serviceId);

      serviceInputs.push({
        serviceId: item.serviceId,
        isFeatured: Boolean(item.isFeatured),
        displayOrder: typeof item.displayOrder === "number" ? item.displayOrder : i,
      });
    }

    // Count featured services and warn if over recommended limit
    const featuredCount = serviceInputs.filter((s) => s.isFeatured).length;
    const warnings: string[] = [];
    if (featuredCount > 8) {
      warnings.push(
        `You have ${featuredCount} featured services. We recommend 8 or fewer for optimal display.`
      );
    }

    // Update clinic services
    await setClinicServices(clinicId, serviceInputs, adminCheck.user.id);

    // Fetch updated services to return
    const updatedServices = await getClinicServices(clinicId);

    return NextResponse.json({
      success: true,
      services: updatedServices,
      featuredCount,
      ...(warnings.length > 0 && { warnings }),
    });
  } catch (error) {
    console.error("Error updating clinic services:", error);
    return NextResponse.json(
      { error: "Failed to update clinic services" },
      { status: 500 }
    );
  }
}
