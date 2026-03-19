import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";

interface CheckoutBody {
  email?: string;
  firstName?: string;
  condition?: string;
  zipCode?: string;
  age?: string;
  assessmentSummary?: string;
  consultSessionId?: string;
}

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Payment processing is not configured" },
      { status: 503 }
    );
  }

  let body: CheckoutBody;
  try {
    body = await request.json() as CheckoutBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, firstName, condition, zipCode, age, assessmentSummary, consultSessionId } = body;

  if (!email || !firstName || !condition || !zipCode) {
    return NextResponse.json(
      { error: "email, firstName, condition, and zipCode are required" },
      { status: 400 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Personalized Pain Management Plan",
              description:
                "Comprehensive PDF with treatment protocols, specialist questions, self-care routines, and red flags tailored to your condition.",
            },
            unit_amount: 1999,
          },
          quantity: 1,
        },
      ],
      metadata: {
        email,
        firstName,
        condition,
        zipCode,
        ...(age && { age }),
        ...(assessmentSummary && { assessmentSummary: assessmentSummary.slice(0, 500) }),
        ...(consultSessionId && { consultSessionId }),
        type: "consult-pdf",
      },
      success_url: `${appUrl}/consult/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/consult?canceled=true`,
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[Consult Checkout] Error creating session:", error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripe error: ${error.message}`, code: error.code },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
