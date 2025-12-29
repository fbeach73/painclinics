import { NextResponse } from "next/server";
import { checkAdminApi } from "@/lib/admin-auth";
import { removeClinicOwnership } from "@/lib/clinic-queries";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ clinicId: string }> }
) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return NextResponse.json(
      { error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  const { clinicId } = await params;

  try {
    const result = await removeClinicOwnership(clinicId);

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Clinic not found" },
        { status: 404 }
      );
    }

    console.log(
      `[Admin] Ownership removed from clinic ${clinicId} by admin ${adminCheck.user.id}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing ownership:", error);
    return NextResponse.json(
      { error: "Failed to remove ownership" },
      { status: 500 }
    );
  }
}
