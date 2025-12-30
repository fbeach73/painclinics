import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { duplicateBroadcast } from "@/lib/broadcast/broadcast-queries";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/admin/broadcasts/[id]/duplicate
 * Duplicate a broadcast (creates a copy as draft)
 */
export async function POST(
  _request: NextRequest,
  { params }: RouteParams
) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  try {
    const { id } = await params;
    const newBroadcast = await duplicateBroadcast(id, adminCheck.user.id);

    if (!newBroadcast) {
      return NextResponse.json(
        { error: "Broadcast not found or failed to duplicate" },
        { status: 404 }
      );
    }

    return NextResponse.json({ broadcast: newBroadcast });
  } catch (error) {
    console.error("Error duplicating broadcast:", error);
    return NextResponse.json(
      { error: "Failed to duplicate broadcast" },
      { status: 500 }
    );
  }
}
