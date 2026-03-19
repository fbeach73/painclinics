import type { Metadata } from "next";
import Link from "next/link";
import { stripe } from "@/lib/stripe";
import "./success.css";

export const metadata: Metadata = {
  title: "Order Confirmed — PainConsult AI",
  robots: { index: false },
};

interface PageProps {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function ConsultSuccessPage({ searchParams }: PageProps) {
  const { session_id } = await searchParams;

  if (!session_id || !stripe) {
    return <ErrorState message="Invalid session. Please contact support." />;
  }

  let email = "";
  let firstName = "";
  let condition = "";
  let paid = false;

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    paid = session.payment_status === "paid";

    if (paid) {
      email = (session.metadata?.email ?? session.customer_email) || "";
      firstName = session.metadata?.firstName || "";
      condition = session.metadata?.condition || "";

      // Fire-and-forget PDF generation
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      fetch(`${appUrl}/api/consult/generate-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName,
          condition,
          zipCode: session.metadata?.zipCode || "",
          age: session.metadata?.age || undefined,
          assessmentSummary: session.metadata?.assessmentSummary || undefined,
        }),
      }).catch((err) => console.error("[ConsultSuccess] PDF trigger failed:", err));
    }
  } catch (err) {
    console.error("[ConsultSuccess] Stripe session retrieval failed:", err);
    return <ErrorState message="We could not verify your payment. Please contact support." />;
  }

  if (!paid) {
    return <ErrorState message="Payment was not completed. Please try again." />;
  }

  return (
    <div className="cs-body">
      <div className="cs-card">
        <div className="cs-check" aria-hidden="true">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 className="cs-title">Your plan is on its way!</h1>

        {firstName && (
          <p className="cs-name">Thanks, {firstName}.</p>
        )}

        <p className="cs-body-text">
          Your personalized pain management plan is being generated right now. You&apos;ll
          receive it at <strong>{email || "your email"}</strong> within the next 5 minutes.
        </p>

        <div className="cs-info-box">
          <div className="cs-info-row">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.84a16 16 0 0 0 6.24 6.24l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            Delivered to your inbox — check spam if needed
          </div>
          <div className="cs-info-row">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            Print or save as PDF from your email client
          </div>
          {condition && (
            <div className="cs-info-row">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Tailored for: {condition}
            </div>
          )}
        </div>

        <div className="cs-actions">
          <Link href="/pain-management" className="cs-btn-primary">
            Find a Specialist Near You
          </Link>
          <Link href="/consult" className="cs-btn-secondary">
            Start a New Consultation
          </Link>
        </div>

        <p className="cs-disclaimer">
          Questions? Email us at{" "}
          <a href="mailto:hello@painclinics.com">hello@painclinics.com</a>
        </p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="cs-body">
      <div className="cs-card">
        <div className="cs-check cs-check--error" aria-hidden="true">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
        </div>
        <h1 className="cs-title">Something went wrong</h1>
        <p className="cs-body-text">{message}</p>
        <div className="cs-actions">
          <Link href="/consult" className="cs-btn-primary">Return to Consult</Link>
        </div>
        <p className="cs-disclaimer">
          Need help? Email <a href="mailto:hello@painclinics.com">hello@painclinics.com</a>
        </p>
      </div>
    </div>
  );
}
