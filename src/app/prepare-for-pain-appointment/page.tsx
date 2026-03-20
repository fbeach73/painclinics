import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MedicalReviewBadge } from "@/components/medical-review-badge";

export const metadata: Metadata = {
  title:
    "How to Describe Pain to Your Doctor | Pain Appointment Prep Guide",
  description:
    "Learn how to describe your pain to a doctor so they understand. Plus: what to bring to your first pain clinic visit, what to expect, and 10 questions to ask your pain management specialist.",
  keywords: [
    "how to describe pain to doctor",
    "first pain management appointment",
    "what to bring to pain clinic",
    "questions to ask pain doctor",
    "what to expect at pain clinic",
    "pain management appointment checklist",
    "how to talk to doctor about pain",
    "pain clinic preparation",
  ],
  alternates: {
    canonical: "/prepare-for-pain-appointment",
  },
  openGraph: {
    title:
      "How to Describe Pain to Your Doctor | Pain Appointment Prep Guide",
    description:
      "Learn how to describe your pain effectively, what to bring to your first pain clinic visit, and the key questions to ask your pain management specialist.",
    url: "/prepare-for-pain-appointment",
    type: "article",
  },
  twitter: {
    card: "summary",
    title: "How to Describe Pain to Your Doctor | Appointment Prep",
    description:
      "Describe your pain so your doctor understands, plus what to bring and questions to ask at your first pain clinic visit.",
  },
};

export default function PrepareForPainAppointmentPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "How to Prepare for Your First Pain Management Appointment",
    description:
      "A practical guide to preparing for your first pain clinic visit — what to bring, how to describe your pain, what to expect, and questions to ask your specialist.",
    url: "https://painclinics.com/prepare-for-pain-appointment",
    about: [
      {
        "@type": "MedicalCondition",
        name: "Chronic Pain",
      },
      {
        "@type": "MedicalTherapy",
        name: "Pain Management",
        medicineSystem: "WesternConventional",
      },
    ],
    mainContentOfPage: {
      "@type": "WebPageElement",
      cssSelector: "#main-content",
    },
    lastReviewed: "2026-03-18",
    datePublished: "2026-03-18",
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://painclinics.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Prepare for Your Pain Appointment",
        item: "https://painclinics.com/prepare-for-pain-appointment",
      },
    ],
  };

  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Prepare for Your First Pain Management Appointment",
    description:
      "Steps to take before your first visit to a pain management specialist so you can make the most of your appointment.",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Gather your medical records and imaging",
        text: "Collect any MRI, X-ray, or CT scan reports and discs. Include prior treatment summaries from other providers. These help your specialist avoid duplicate testing and build on what has already been tried.",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Write down your medication list with doses",
        text: "List every medication, supplement, and over-the-counter product you take, including the dose and frequency. Bring the actual pill bottles or a photo of each label if it is easier.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Track your pain for 1-2 weeks",
        text: "Keep a brief daily record of your pain levels (0-10), location, timing, and what makes it better or worse. Even a few days of data gives your doctor meaningful patterns to work with.",
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Prepare a list of questions",
        text: "Write down everything you want to ask before your appointment so you don't forget in the moment. Prioritize your top three questions in case time is limited.",
      },
      {
        "@type": "HowToStep",
        position: 5,
        name: "Arrive 15 minutes early with all documents",
        text: "New patient paperwork takes time. Arriving early ensures you can complete forms before your scheduled appointment time and reduces stress before your visit.",
      },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What should I bring to my first pain management appointment?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Bring a photo ID, insurance cards, any required referral, and copies of imaging studies (MRI, X-ray, CT) including the actual discs or digital files. Also bring a complete medication list with doses, a summary of previous treatments and their results, a written description of your pain history, and a list of questions for your doctor. If you have been keeping a pain diary, bring that as well.",
        },
      },
      {
        "@type": "Question",
        name: "How long does a first pain clinic visit take?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "A first appointment with a pain management specialist typically lasts 45 to 90 minutes. It is longer than a standard medical visit because the doctor needs time for a thorough pain history, physical examination, review of your records and imaging, goal setting, and treatment plan discussion. Plan to arrive 15 minutes early for new patient paperwork.",
        },
      },
      {
        "@type": "Question",
        name: "How do I describe my pain to a doctor?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Describe your pain using these dimensions: location (point to the exact spot and note if it radiates), type (sharp, burning, aching, throbbing, stabbing, or pressure-like), intensity on a 0-10 scale, timing (constant or comes and goes, worse at certain times of day), and what makes it better or worse. Most importantly, explain how it affects your daily life — what activities you can no longer do or do with difficulty.",
        },
      },
      {
        "@type": "Question",
        name: "Will I receive treatment at my first visit?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "It depends on your situation and the practice. Some clinics are able to begin treatment at the first visit, while others use the initial appointment purely for evaluation and diagnosis before scheduling procedures or therapies. Your specialist will review your records, perform an examination, and then discuss a treatment plan with you. Ask what to expect when you schedule your appointment.",
        },
      },
      {
        "@type": "Question",
        name: "What questions should I ask a pain management doctor?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Key questions include: What is causing my pain? What treatment approach do you recommend and why? What results are realistic to expect? What are the risks and benefits of the recommended treatments? Will I need physical therapy or psychological support? How long before I may notice improvement? How will we know if the treatment is working? What can I do at home to help? What happens if the first treatment doesn't work? How often will I need follow-up visits?",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <main
        id="main-content"
        className="container mx-auto py-8 md:py-12 px-4"
      >
        <div className="max-w-4xl mx-auto prose prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-a:text-primary prose-ol:text-foreground">
          <h1>How to Prepare for Your First Pain Management Appointment</h1>
          <p className="lead text-foreground/70">
            A well-prepared patient gets more out of every appointment. This
            guide walks you through exactly what to bring, how to describe your
            pain, what to expect during your visit, and the questions that will
            help you get answers.
          </p>

          <Alert variant="warning" className="not-prose my-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This information is for educational purposes only. Pain management
              treatment should be guided by a qualified healthcare provider who
              understands your individual condition and medical history.
            </AlertDescription>
          </Alert>

          <h2>Why Preparation Matters</h2>
          <p>
            Pain management specialists are thorough, but they work within a
            limited appointment window. A first visit typically runs 45 to 90
            minutes &mdash; and a meaningful portion of that time can disappear
            trying to reconstruct your history from memory. The more organized
            you arrive, the faster your doctor can get to the part that matters:
            figuring out what is causing your pain and what to do about it.
          </p>
          <p>
            Patients who bring complete records, a clear pain description, and
            specific questions tend to leave their first appointment with a
            concrete treatment plan rather than a follow-up order for tests that
            were already done elsewhere.
          </p>

          <h2>What to Bring</h2>
          <p>
            Gather these items before your appointment. A missing insurance card
            or imaging disc can delay care and frustrate an otherwise productive
            visit.
          </p>
          <ul>
            <li>
              <strong>Photo ID</strong> (driver&rsquo;s license, passport, or
              state ID)
            </li>
            <li>
              <strong>Insurance cards</strong> &mdash; all active plans,
              including secondary coverage
            </li>
            <li>
              <strong>Referral paperwork</strong>, if your insurance or primary
              care doctor requires one
            </li>
            <li>
              <strong>Imaging studies</strong> &mdash; MRI, X-ray, and CT scan
              reports plus the original discs or digital files. Reports alone
              are less useful than the actual images.
            </li>
            <li>
              <strong>Medication list</strong> with the name, dose, and
              frequency of every prescription drug, supplement, and
              over-the-counter product you take
            </li>
            <li>
              <strong>Pain diary or tracking records</strong> &mdash; even a
              week&rsquo;s worth of daily notes on your pain levels, location,
              and timing gives your doctor useful data (see{" "}
              <Link href="/pain-tracking">pain tracking tools</Link> and our
              printable{" "}
              <Link href="/pain-diary-template">pain diary template</Link>)
            </li>
            <li>
              <strong>List of previous treatments</strong> &mdash; what you
              tried, when, and how well it worked
            </li>
            <li>
              <strong>Your questions for the doctor</strong> &mdash; written
              down so you don&rsquo;t forget them under pressure
            </li>
          </ul>

          <h2>How to Describe Your Pain Effectively</h2>
          <p>
            Vague descriptions like &ldquo;my back hurts&rdquo; are harder for
            your doctor to work with than a specific account. Use these
            dimensions when preparing what you will say:
          </p>
          <ul>
            <li>
              <strong>Location:</strong> Point to the exact spot on your body.
              Does the pain stay in one place or does it travel (radiate) down
              your arm, leg, or elsewhere?
            </li>
            <li>
              <strong>Type:</strong> Is it sharp, burning, aching, throbbing,
              stabbing, or a pressure-like sensation? More than one type at
              once? The character of pain often points toward the cause.
            </li>
            <li>
              <strong>Intensity:</strong> Rate your pain on a 0-to-10 scale at
              its typical level, at its worst, and at its best. Bring your pain
              diary if you have been tracking this.
            </li>
            <li>
              <strong>Timing:</strong> Is the pain constant or does it come and
              go? Is it worse in the morning, after activity, when sitting, or
              at night?
            </li>
            <li>
              <strong>Triggers and relievers:</strong> What makes it worse
              (movement, weather, stress)? What provides relief (rest, heat,
              ice, certain positions)?
            </li>
            <li>
              <strong>Impact on daily life:</strong> Which activities can you no
              longer do or do with difficulty? Work, sleep, walking, household
              tasks, hobbies? This is often the most important thing your doctor
              needs to hear.
            </li>
          </ul>

          <h2>What to Expect at Your First Visit</h2>
          <p>
            Knowing the structure of a first pain clinic appointment reduces
            anxiety and helps you participate more fully.
          </p>
          <ol>
            <li>
              <strong>Paperwork:</strong> Arrive 15 minutes early. New patient
              intake forms typically ask about your health history, current
              medications, and pain description in writing. Some clinics send
              these electronically in advance.
            </li>
            <li>
              <strong>Comprehensive pain history:</strong> Your specialist will
              ask detailed questions about when your pain started, how it
              developed, and what has been tried. Be honest and specific,
              including treatments that didn&rsquo;t help.
            </li>
            <li>
              <strong>Physical examination:</strong> A focused exam to assess
              your posture, range of motion, strength, reflexes, and sensation.
              Wear comfortable clothing that allows access to the affected area.
            </li>
            <li>
              <strong>Review of imaging and records:</strong> Your doctor will
              look at the imaging you brought. If you don&rsquo;t have it yet,
              they may order new studies before making treatment recommendations.
            </li>
            <li>
              <strong>Goal setting:</strong> Rather than promising to eliminate
              your pain, your specialist will work with you to set realistic
              goals &mdash; such as returning to specific activities, sleeping
              better, or reducing your reliance on certain medications.
            </li>
            <li>
              <strong>Treatment plan discussion:</strong> You will discuss
              options together. This may include follow-up appointments,
              procedures, physical therapy, medication adjustments, or a
              combination. Ask questions here &mdash; this is the right moment.
            </li>
          </ol>

          <h2>10 Questions to Ask Your Pain Doctor</h2>
          <ol>
            <li>What do you think is causing my pain?</li>
            <li>What treatment approach do you recommend, and why this one?</li>
            <li>What results are realistic to expect, and over what timeframe?</li>
            <li>What are the risks and benefits of the treatments you are suggesting?</li>
            <li>Will physical therapy be part of my plan, and if so, how does it work alongside other treatments?</li>
            <li>Is there a psychological component to my pain that could benefit from treatment like cognitive behavioral therapy?</li>
            <li>How will we know if the treatment is working?</li>
            <li>What can I do at home to support my care between appointments?</li>
            <li>What happens if the first treatment doesn&rsquo;t provide enough relief?</li>
            <li>How often will I need follow-up visits?</li>
          </ol>

          <h2>Track Your Pain Before Your Visit</h2>
          <p>
            One of the most useful things you can do before your first
            appointment is keep a brief pain diary for one to two weeks. Daily
            notes on your pain level (0-10), location, timing, and what you were
            doing when the pain flared give your doctor concrete data instead of
            estimates. Patterns that feel random often become clear when written
            down &mdash; which helps your specialist make faster, more confident
            decisions.
          </p>
          <p>
            Use our{" "}
            <Link href="/pain-tracking">online pain tracking tool</Link> to log
            entries digitally, or download our{" "}
            <Link href="/pain-diary-template">printable pain diary template</Link>{" "}
            to fill in by hand and bring to your appointment.
          </p>

          <h2>Get a Personalized Preparation Plan</h2>
          <p>
            Not sure how to explain what you&rsquo;re experiencing or what
            questions apply to your situation?{" "}
            <Link href="/consult">PainConsult AI</Link> is a free assessment
            tool that helps you understand your symptoms before your appointment.
            It asks structured questions about your pain and generates a
            personalized question list and self-care protocol you can bring to
            your first visit &mdash; so you walk in prepared, not overwhelmed.
          </p>
          <p>
            Start your free assessment at{" "}
            <Link href="/consult">painclinics.com/consult</Link>. No account
            required.{" "}
            <a
              href="/consult/sample-plan"
              target="_blank"
              rel="noopener noreferrer"
            >
              See a sample plan
            </a>{" "}
            to preview what you&rsquo;ll receive.
          </p>

          <h2>Find a Pain Specialist Near You</h2>
          <p>
            Ready to book your first appointment? Use our{" "}
            <Link href="/clinics">pain clinic directory</Link> to find
            board-certified pain management specialists near you. Search by
            location, read patient reviews, and compare providers across more
            than 5,000 clinics listed nationwide. You can also{" "}
            <Link href="/treatment-options">browse treatment options</Link> to
            learn what types of care pain specialists offer before you go.
          </p>

          <div className="not-prose mt-8">
            <MedicalReviewBadge />
          </div>
        </div>
      </main>
    </>
  );
}
