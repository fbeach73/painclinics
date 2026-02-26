import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import {
  getGuidesAdmin,
  getGuideCountsByStatus,
  createGuide,
} from "@/lib/guides/guide-admin-queries";

export async function GET(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) return adminErrorResponse(adminCheck);

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || undefined;

    const [result, counts] = await Promise.all([
      getGuidesAdmin({ page, limit, status, search }),
      getGuideCountsByStatus(),
    ]);

    return NextResponse.json({ ...result, counts });
  } catch (error) {
    console.error("Error fetching guides:", error);
    return NextResponse.json(
      { error: "Failed to fetch guides" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) return adminErrorResponse(adminCheck);

  try {
    const body = await request.json();

    if (!body.title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const id = await createGuide(body);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("Error creating guide:", error);
    return NextResponse.json(
      { error: "Failed to create guide" },
      { status: 500 }
    );
  }
}
