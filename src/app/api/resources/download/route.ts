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
  "pain-tracker-daily": "/templates/pain-tracker-daily.pdf",
  "pain-tracker-weekly": "/templates/pain-tracker-weekly.pdf",
  "pain-tracker-monthly": "/templates/pain-tracker-monthly.pdf",
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

    // Save email to database
    await db.insert(resourceDownloads).values({
      email: data.email,
      resourceName: data.resourceName,
      source: data.source,
    });

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
