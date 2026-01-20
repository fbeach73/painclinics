import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import {
  getLeadById,
  updateLead,
  type LeadStatus,
} from "@/lib/lead-queries";
import { leadStatusEnum } from "@/lib/schema";

interface RouteParams {
  params: Promise<{ leadId: string }>;
}

/**
 * GET /api/admin/leads/[leadId]
 * Get full details of a specific lead
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const { leadId } = await params;

  if (!leadId) {
    return NextResponse.json(
      { error: "Lead ID is required" },
      { status: 400 }
    );
  }

  try {
    const lead = await getLeadById(leadId);

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ lead });
  } catch (error) {
    console.error("Error fetching lead:", error);
    return NextResponse.json(
      { error: "Failed to fetch lead" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/leads/[leadId]
 * Update lead fields (status, adminNotes, followUpDate)
 *
 * Body: {
 *   status?: LeadStatus,
 *   adminNotes?: string,
 *   followUpDate?: string (ISO date) | null
 * }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const { leadId } = await params;

  if (!leadId) {
    return NextResponse.json(
      { error: "Lead ID is required" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { status, adminNotes, followUpDate } = body;

    // Validate status if provided
    if (status !== undefined) {
      const validStatuses = leadStatusEnum.enumValues;
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: {
      status?: LeadStatus;
      adminNotes?: string;
      followUpDate?: Date | null;
    } = {};

    if (status !== undefined) {
      updateData.status = status;
    }

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    if (followUpDate !== undefined) {
      updateData.followUpDate = followUpDate ? new Date(followUpDate) : null;
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const updated = await updateLead(leadId, updateData);

    if (!updated) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ lead: updated });
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json(
      { error: "Failed to update lead" },
      { status: 500 }
    );
  }
}
