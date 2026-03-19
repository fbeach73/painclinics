import { NextResponse } from "next/server";
import { sendConsultSummaryEmail } from "@/lib/email";
import { db } from "@/lib/db";
import { contacts, consultLeadMatches } from "@/lib/schema";
import { eq } from "drizzle-orm";

interface SendSummaryBody {
  email?: string;
  firstName?: string;
  condition?: string;
  zipCode?: string;
  age?: string;
  assessmentSummary?: string;
  clinics?: Array<{
    id?: string;
    title: string;
    permalink: string;
    city: string;
    stateAbbreviation: string | null;
    rating: number | null;
    reviewCount: number | null;
  }>;
}

export async function POST(request: Request) {
  let body: SendSummaryBody;
  try {
    body = (await request.json()) as SendSummaryBody;
  } catch {
    return NextResponse.json({ success: false }, { status: 200 });
  }

  const { email, firstName, condition, zipCode, age, assessmentSummary, clinics } = body;

  if (!email || !firstName || !condition || !zipCode || !assessmentSummary) {
    return NextResponse.json({ success: false }, { status: 200 });
  }

  const consultDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Look up the contact's unsubscribeToken so we can include unsub + delete links in the email
  const contactRow = await db
    .select({ unsubscribeToken: contacts.unsubscribeToken })
    .from(contacts)
    .where(eq(contacts.email, email.toLowerCase().trim()))
    .limit(1)
    .then((rows) => rows[0])
    .catch(() => undefined);

  // Fire and forget — errors are swallowed so UX is never affected
  sendConsultSummaryEmail(
    email,
    {
      firstName,
      condition,
      consultDate,
      zipCode,
      age: age ?? undefined,
      assessmentSummary,
      clinics: clinics?.slice(0, 5),
    },
    { unsubscribeToken: contactRow?.unsubscribeToken ?? undefined }
  ).catch(() => {});

  // Save lead-clinic matches (fire and forget)
  if (clinics && clinics.length > 0) {
    const clinicsWithIds = clinics.filter((c) => c.id);
    if (clinicsWithIds.length > 0) {
      db.select({ id: contacts.id })
        .from(contacts)
        .where(eq(contacts.email, email.toLowerCase().trim()))
        .limit(1)
        .then(async (rows) => {
          const contactId = rows[0]?.id;
          if (!contactId) return;
          const matchRows = clinicsWithIds.map((c) => ({
            contactId,
            clinicId: c.id!,
            condition: condition ?? null,
            zipCode: zipCode ?? null,
          }));
          await db
            .insert(consultLeadMatches)
            .values(matchRows)
            .onConflictDoNothing();
        })
        .catch(() => {});
    }
  }

  return NextResponse.json({ success: true });
}
