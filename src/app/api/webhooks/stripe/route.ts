import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { contacts, consultPurchases } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Stripe Webhook] Signature verification failed:", message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Only handle consult-pdf purchases
    if (session.metadata?.type !== "consult-pdf") {
      return NextResponse.json({ received: true });
    }

    const email = (
      session.metadata?.email ??
      session.customer_email ??
      ""
    )
      .toLowerCase()
      .trim();
    const firstName = session.metadata?.firstName ?? null;
    const condition = session.metadata?.condition ?? null;
    const zipCode = session.metadata?.zipCode ?? null;
    const age = session.metadata?.age ?? null;
    const assessmentSummary = session.metadata?.assessmentSummary ?? null;

    // 1. Look up existing contact
    const contactRow = await db
      .select({ id: contacts.id })
      .from(contacts)
      .where(eq(contacts.email, email))
      .limit(1)
      .then((rows) => rows[0])
      .catch(() => undefined);

    // 2. Record the purchase (idempotent via stripeSessionId unique constraint)
    await db
      .insert(consultPurchases)
      .values({
        contactId: contactRow?.id ?? null,
        email,
        firstName,
        condition,
        zipCode,
        age,
        amountCents: session.amount_total ?? 1999,
        currency: session.currency ?? "usd",
        stripeSessionId: session.id,
        stripePaymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : (session.payment_intent?.id ?? null),
      })
      .onConflictDoNothing();

    // 3. Trigger PDF generation (fallback in case the success page didn't fire)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://painclinics.com";

    try {
      const pdfRes = await fetch(`${appUrl}/api/consult/generate-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName: firstName ?? "there",
          condition: condition ?? "Pain",
          zipCode: zipCode ?? "",
          age: age ?? undefined,
          assessmentSummary: assessmentSummary ?? undefined,
        }),
      });

      if (pdfRes.ok) {
        await db
          .update(consultPurchases)
          .set({ pdfGenerated: true, pdfGeneratedAt: new Date() })
          .where(eq(consultPurchases.stripeSessionId, session.id));
      }
    } catch (err) {
      console.error("[Stripe Webhook] PDF generation trigger failed:", err);
      // Purchase is recorded — PDF can be manually re-triggered
    }

    // 4. Tag the contact as a purchaser
    if (contactRow?.id) {
      await db
        .update(contacts)
        .set({
          tags: sql`array_append(${contacts.tags}, 'consult-purchaser')`,
        })
        .where(
          sql`${contacts.id} = ${contactRow.id} AND NOT ('consult-purchaser' = ANY(${contacts.tags}))`
        )
        .catch(() => {});
    }

    console.log(
      `[Stripe Webhook] Consult PDF purchase recorded: ${email} (${condition})`
    );
  }

  return NextResponse.json({ received: true });
}
