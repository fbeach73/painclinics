import { NextResponse } from "next/server";

/**
 * Health check endpoint for blog webhook
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "blog-webhook",
    timestamp: new Date().toISOString(),
  });
}
