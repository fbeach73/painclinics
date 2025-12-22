import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { resourceDownloads } from "@/lib/schema";

const downloadSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  resourceName: z.enum([
    "pain-tracker-daily",
    "pain-tracker-weekly",
    "pain-tracker-monthly",
  ]),
  source: z.string().default("pain-tracking-page"),
});

const resourceFileMap: Record<string, string> = {
  "pain-tracker-daily": "/templates/Daily-Pain-Log.xlsx",
  "pain-tracker-weekly": "/templates/Weekly-Pain-Tracker.xlsx",
  "pain-tracker-monthly": "/templates/Monthly-Pain-Overview.xlsx",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validationResult = downloadSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      const firstError =
        Object.values(errors).flat()[0] || "Validation failed";
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if email already exists
    const existing = await db
      .select({ id: resourceDownloads.id })
      .from(resourceDownloads)
      .where(eq(resourceDownloads.email, data.email))
      .limit(1);

    // Only insert if email is new
    if (existing.length === 0) {
      await db.insert(resourceDownloads).values({
        email: data.email,
        resourceName: data.resourceName,
        source: data.source,
      });
    }

    // Return download URL
    const downloadUrl = resourceFileMap[data.resourceName];

    return NextResponse.json(
      {
        success: true,
        downloadUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing resource download:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred. Please try again.",
      },
      { status: 500 }
    );
  }
}
