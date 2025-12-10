import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { getEmailLogs, getUniqueTemplateNames, type EmailStatus } from "@/lib/email-queries";
import { emailStatusEnum } from "@/lib/schema";

export async function GET(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const status = searchParams.get("status") as EmailStatus | null;
    const templateName = searchParams.get("template") || undefined;
    const recipientEmail = searchParams.get("recipient") || undefined;
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    // Validate status if provided
    if (status && !emailStatusEnum.enumValues.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${emailStatusEnum.enumValues.join(", ")}` },
        { status: 400 }
      );
    }

    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    const [result, templates] = await Promise.all([
      getEmailLogs({
        limit,
        offset,
        ...(status ? { status } : {}),
        templateName,
        recipientEmail,
        startDate,
        endDate,
      }),
      getUniqueTemplateNames(),
    ]);

    return NextResponse.json({
      ...result,
      templates,
      statuses: emailStatusEnum.enumValues,
    });
  } catch (error) {
    console.error("Error fetching email logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch email logs" },
      { status: 500 }
    );
  }
}
