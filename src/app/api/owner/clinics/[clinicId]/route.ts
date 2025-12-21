import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getClinicById } from "@/lib/clinic-queries";
import { db } from "@/lib/db";
import {
  getClinicForOwner,
  updateClinicByOwner,
  updateClinicByAdmin,
  type ClinicUpdateData,
} from "@/lib/owner-queries";
import * as schema from "@/lib/schema";

/**
 * GET /api/owner/clinics/[clinicId] - Get a specific clinic owned by the current user
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

    // Verify user role
    const user = await db.query.user.findFirst({
      where: eq(schema.user.id, session.user.id),
    });

    if (!user || !["admin", "clinic_owner"].includes(user.role)) {
      return NextResponse.json(
        { error: "You must be a clinic owner to access this resource" },
        { status: 403 }
      );
    }

    // Admins can access any clinic
    let clinic;
    if (user.role === "admin") {
      clinic = await getClinicById(clinicId, { includeRelations: true });
    } else {
      clinic = await getClinicForOwner(clinicId, session.user.id);
    }

    if (!clinic) {
      return NextResponse.json(
        { error: "Clinic not found or you do not have permission to access it" },
        { status: 404 }
      );
    }

    return NextResponse.json({ clinic });
  } catch (error) {
    console.error("Error fetching clinic:", error);
    return NextResponse.json(
      { error: "Failed to fetch clinic" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/owner/clinics/[clinicId] - Update a clinic owned by the current user
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> }
) {
  try {
    const { clinicId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user role
    const user = await db.query.user.findFirst({
      where: eq(schema.user.id, session.user.id),
    });

    if (!user || !["admin", "clinic_owner"].includes(user.role)) {
      return NextResponse.json(
        { error: "You must be a clinic owner to access this resource" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate and sanitize input
    const updateData: ClinicUpdateData = {};

    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.phones !== undefined) updateData.phones = body.phones;
    if (body.website !== undefined) updateData.website = body.website;
    if (body.emails !== undefined) updateData.emails = body.emails;
    if (body.streetAddress !== undefined) updateData.streetAddress = body.streetAddress;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.state !== undefined) updateData.state = body.state;
    if (body.postalCode !== undefined) updateData.postalCode = body.postalCode;
    if (body.clinicHours !== undefined) updateData.clinicHours = body.clinicHours;
    if (body.closedOn !== undefined) updateData.closedOn = body.closedOn;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.facebook !== undefined) updateData.facebook = body.facebook;
    if (body.instagram !== undefined) updateData.instagram = body.instagram;
    if (body.twitter !== undefined) updateData.twitter = body.twitter;
    if (body.youtube !== undefined) updateData.youtube = body.youtube;
    if (body.linkedin !== undefined) updateData.linkedin = body.linkedin;
    if (body.tiktok !== undefined) updateData.tiktok = body.tiktok;
    if (body.pinterest !== undefined) updateData.pinterest = body.pinterest;

    // Perform the update
    let updatedClinic;
    try {
      if (user.role === "admin") {
        updatedClinic = await updateClinicByAdmin(clinicId, updateData);
      } else {
        updatedClinic = await updateClinicByOwner(clinicId, session.user.id, updateData);
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("not found")) {
        return NextResponse.json(
          { error: "Clinic not found or you do not have permission to edit it" },
          { status: 404 }
        );
      }
      throw err;
    }

    return NextResponse.json({ clinic: updatedClinic });
  } catch (error) {
    console.error("Error updating clinic:", error);
    return NextResponse.json(
      { error: "Failed to update clinic" },
      { status: 500 }
    );
  }
}
