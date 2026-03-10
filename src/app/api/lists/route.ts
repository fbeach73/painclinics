import { NextRequest, NextResponse } from "next/server";
import { validateNewsletterApiKey } from "@/lib/newsletter/auth";
import { getSubscriberCount } from "@/lib/newsletter/send";

/**
 * Available subscriber lists — maps list_id to contacts tag.
 * Add new lists here as needed.
 */
const AVAILABLE_LISTS = [
  { list_id: "newsletter", name: "Newsletter Subscribers" },
  { list_id: "user", name: "Registered Users" },
  { list_id: "lead", name: "Leads" },
  { list_id: "tool-user", name: "AI Tool Users" },
  { list_id: "patient-education", name: "Patient Education Users" },
] as const;

export async function GET(request: NextRequest) {
  const authError = validateNewsletterApiKey(request);
  if (authError) return authError;

  try {
    const lists = await Promise.all(
      AVAILABLE_LISTS.map(async (list) => ({
        list_id: list.list_id,
        name: list.name,
        subscriber_count: await getSubscriberCount(list.list_id),
      }))
    );

    return NextResponse.json({ lists });
  } catch (error) {
    console.error("Failed to fetch lists:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
