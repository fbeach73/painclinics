import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi } from "@/lib/admin-auth";
import { reverseClinicClaim } from "@/lib/admin-customer-queries";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> }
) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  const { clinicId } = await params;

  let reason: string | undefined;
  try {
    const body = await request.json();
    reason = body.reason;
  } catch {
    // Body parsing is optional
  }

  try {
    const result = await reverseClinicClaim(clinicId, adminCheck.user.id, reason);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to reverse claim" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin] Error reversing claim:", error);
    return NextResponse.json(
      { error: "Failed to reverse claim" },
      { status: 500 }
    );
  }
}
