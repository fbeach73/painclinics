import { NextResponse } from "next/server";
import { checkAdminApi } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { consultLeadMatches } from "@/lib/schema";
import { eq } from "drizzle-orm";

type MatchStatus = "matched" | "contacted" | "booked" | "converted";

interface PatchBody {
  status?: MatchStatus;
  notes?: string;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const authResult = await checkAdminApi();
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { matchId } = await params;

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { status, notes } = body;

  const validStatuses: MatchStatus[] = ["matched", "contacted", "booked", "converted"];
  if (status !== undefined && !validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updateData: Partial<{ status: MatchStatus; notes: string }> = {};
  if (status !== undefined) updateData.status = status;
  if (notes !== undefined) updateData.notes = notes;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const updated = await db
    .update(consultLeadMatches)
    .set(updateData)
    .where(eq(consultLeadMatches.id, matchId))
    .returning({ id: consultLeadMatches.id, status: consultLeadMatches.status });

  if (updated.length === 0) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, match: updated[0] });
}
