import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import {
  removeServiceFromClinic,
  updateClinicService,
} from "@/lib/clinic-services-queries";

/**
 * PATCH /api/owner/clinics/[clinicId]/services/[serviceId] - Update a service for a clinic
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string; serviceId: string }> }
) {
  try {
    const { clinicId, serviceId } = await params;
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
    const updates: { isFeatured?: boolean; displayOrder?: number } = {};

    if (typeof body.isFeatured === "boolean") {
      updates.isFeatured = body.isFeatured;
    }
    if (typeof body.displayOrder === "number") {
      updates.displayOrder = body.displayOrder;
    }

    await updateClinicService(clinicId, serviceId, updates);

    return NextResponse.json({ message: "Service updated" });
  } catch (error) {
    console.error("Error updating clinic service:", error);
    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/owner/clinics/[clinicId]/services/[serviceId] - Remove a service from a clinic
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ clinicId: string; serviceId: string }> }
) {
  try {
    const { clinicId, serviceId } = await params;
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

    await removeServiceFromClinic(clinicId, serviceId);

    return NextResponse.json({ message: "Service removed" });
  } catch (error) {
    console.error("Error removing clinic service:", error);
    return NextResponse.json(
      { error: "Failed to remove service" },
      { status: 500 }
    );
  }
}
