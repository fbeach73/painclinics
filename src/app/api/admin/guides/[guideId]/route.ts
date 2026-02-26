import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import {
  getGuideByIdAdmin,
  updateGuide,
  deleteGuide,
} from "@/lib/guides/guide-admin-queries";

interface RouteParams {
  params: Promise<{ guideId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) return adminErrorResponse(adminCheck);

  try {
    const { guideId } = await params;
    const guide = await getGuideByIdAdmin(guideId);
    if (!guide) {
      return NextResponse.json({ error: "Guide not found" }, { status: 404 });
    }
    return NextResponse.json({ guide });
  } catch (error) {
    console.error("Error fetching guide:", error);
    return NextResponse.json(
      { error: "Failed to fetch guide" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) return adminErrorResponse(adminCheck);

  try {
    const { guideId } = await params;
    const existing = await getGuideByIdAdmin(guideId);
    if (!existing) {
      return NextResponse.json({ error: "Guide not found" }, { status: 404 });
    }

    const body = await request.json();
    await updateGuide(guideId, body);
    const updated = await getGuideByIdAdmin(guideId);
    return NextResponse.json({ guide: updated });
  } catch (error) {
    console.error("Error updating guide:", error);
    return NextResponse.json(
      { error: "Failed to update guide" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) return adminErrorResponse(adminCheck);

  try {
    const { guideId } = await params;
    const existing = await getGuideByIdAdmin(guideId);
    if (!existing) {
      return NextResponse.json({ error: "Guide not found" }, { status: 404 });
    }

    await deleteGuide(guideId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting guide:", error);
    return NextResponse.json(
      { error: "Failed to delete guide" },
      { status: 500 }
    );
  }
}
