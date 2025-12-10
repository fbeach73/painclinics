import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import {
  getClinicServices,
  addServiceToClinic,
} from "@/lib/clinic-services-queries";

/**
 * GET /api/owner/clinics/[clinicId]/services - Get all services for a clinic
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> }
) {
  try {
    const { clinicId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user role and ownership
    const user = await db.query.user.findFirst({
      where: eq(schema.user.id, session.user.id),
    });

    if (!user || !["admin", "clinic_owner"].includes(user.role)) {
      return NextResponse.json(
        { error: "You must be a clinic owner to access this resource" },
        { status: 403 }
      );
    }

    // Verify ownership (unless admin)
    if (user.role !== "admin") {
      const clinic = await db.query.clinics.findFirst({
        where: and(
          eq(schema.clinics.id, clinicId),
          eq(schema.clinics.ownerUserId, session.user.id)
        ),
      });

      if (!clinic) {
        return NextResponse.json(
          { error: "Clinic not found or you do not have permission to access it" },
          { status: 404 }
        );
      }
    }

    const services = await getClinicServices(clinicId);

    return NextResponse.json({ services });
  } catch (error) {
    console.error("Error fetching clinic services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/owner/clinics/[clinicId]/services - Add services to a clinic
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> }
) {
  try {
    const { clinicId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user role and ownership
    const user = await db.query.user.findFirst({
      where: eq(schema.user.id, session.user.id),
    });

    if (!user || !["admin", "clinic_owner"].includes(user.role)) {
      return NextResponse.json(
        { error: "You must be a clinic owner to access this resource" },
        { status: 403 }
      );
    }

    // Verify ownership (unless admin)
    if (user.role !== "admin") {
      const clinic = await db.query.clinics.findFirst({
        where: and(
          eq(schema.clinics.id, clinicId),
          eq(schema.clinics.ownerUserId, session.user.id)
        ),
      });

      if (!clinic) {
        return NextResponse.json(
          { error: "Clinic not found or you do not have permission to access it" },
          { status: 404 }
        );
      }
    }

    const body = await request.json();
    const { serviceIds } = body;

    if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
      return NextResponse.json(
        { error: "serviceIds array is required" },
        { status: 400 }
      );
    }

    // Verify all service IDs are valid
    const validServices = await db.query.services.findMany({
      where: eq(schema.services.isActive, true),
    });
    const validServiceIds = new Set(validServices.map((s) => s.id));

    const invalidIds = serviceIds.filter((id: string) => !validServiceIds.has(id));
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: `Invalid service IDs: ${invalidIds.join(", ")}` },
        { status: 400 }
      );
    }

    // Add each service
    for (const serviceId of serviceIds) {
      await addServiceToClinic(clinicId, serviceId, false, 0, session.user.id);
    }

    const services = await getClinicServices(clinicId);

    return NextResponse.json({
      message: `Added ${serviceIds.length} service(s)`,
      services,
    });
  } catch (error) {
    console.error("Error adding clinic services:", error);
    return NextResponse.json(
      { error: "Failed to add services" },
      { status: 500 }
    );
  }
}
