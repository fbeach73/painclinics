import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi } from "@/lib/admin-auth";
import { cancelSubscription } from "@/lib/admin-customer-queries";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> }
) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  const { subscriptionId } = await params;

  try {
    const result = await cancelSubscription(subscriptionId, adminCheck.user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to cancel subscription" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin] Error canceling subscription:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
