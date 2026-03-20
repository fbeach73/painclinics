import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MedicalReviewBadge } from "@/components/medical-review-badge";

export const metadata: Metadata = {
  title: "Is My Pain Serious? When to See a Doctor for Pain | PainClinics.com",
  description:
    "Learn when pain needs medical attention. Understand red flag symptoms, when to go to the ER vs. scheduling a specialist, and how to assess your pain severity with a free AI assessment.",
  keywords: [
    "is my back pain serious",
    "when to see doctor for pain",
    "pain red flags",
    "should I go to ER for pain",
    "when is pain an emergency",
    "serious pain symptoms",
    "pain warning signs",
    "when to see a pain specialist",
  ],
  alternates: {
    canonical: "/is-my-pain-serious",
  },
  openGraph: {
    title: "Is My Pain Serious? When to See a Doctor for Pain",
    description:
      "Learn when pain needs immediate attention, how to recognize red flag symptoms by body area, and when to go to the ER vs. a pain specialist.",
    url: "/is-my-pain-serious",
    type: "article",
  },
  twitter: {
    card: "summary",
    title: "Is My Pain Serious? When to See a Doctor",
    description:
      "Red flag symptoms, ER vs. specialist guidance, and how to assess your pain at home.",
  },
};

export default function IsMyPainSeriousPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Is My Pain Serious? When to See a Doctor for Pain",
    description:
      "A guide to recognizing red flag pain symptoms, understanding when to seek emergency care vs. a pain specialist, and how to assess your pain severity at home.",
    url: "https://painclinics.com/is-my-pain-serious",
    about: [
      {
        "@type": "MedicalCondition",
        name: "Pain",
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
    datePublished: "2026-03-18",
    lastReviewed: "2026-03-18",
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
        name: "Is My Pain Serious?",
        item: "https://painclinics.com/is-my-pain-serious",
      },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How do I know if my pain is serious?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Pain may be serious if it is sudden and severe, getting progressively worse over days or weeks, accompanied by other symptoms like fever, unexplained weight loss, numbness, or weakness, or if it follows a traumatic injury. Pain that disrupts sleep, limits daily activities, or does not improve with rest and over-the-counter care after a few days also warrants a medical evaluation. When in doubt, contact a healthcare provider.",
        },
      },
      {
        "@type": "Question",
        name: "When should I go to the ER for pain?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Go to the emergency room or call 911 if you experience a sudden, severe headache unlike any you have had before, chest pain or pressure (especially with shortness of breath or sweating), pain accompanied by loss of bladder or bowel control, pain with sudden numbness or weakness in your limbs, or severe pain following a significant trauma such as a fall or accident. These symptoms may indicate a life-threatening condition requiring immediate care.",
        },
      },
      {
        "@type": "Question",
        name: "What are red flag symptoms for back pain?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Red flag symptoms for back pain include pain that follows a trauma, pain accompanied by loss of bladder or bowel control, progressive weakness or numbness in the legs, back pain with unexplained fever or weight loss, and pain that is constant and severe even at rest. These symptoms should prompt urgent or emergency medical evaluation rather than a wait-and-see approach.",
        },
      },
      {
        "@type": "Question",
        name: "Should I see a pain specialist or my primary care doctor?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Your primary care doctor is a good starting point for most new pain concerns and can coordinate basic treatment and referrals. Consider seeing a pain management specialist if your pain has lasted more than three months, is not adequately controlled by current treatment, significantly affects your daily function or sleep, or if your primary care provider recommends it. Pain specialists have advanced training in diagnosing and treating complex or chronic pain conditions.",
        },
      },
      {
        "@type": "Question",
        name: "Can an online pain assessment help me decide if I need a doctor?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "An online pain assessment tool, such as PainConsult AI on PainClinics.com, can help you organize your symptoms, understand their patterns, and get an evidence-based overview of what your pain may indicate. However, it is not a substitute for a medical evaluation. If you are experiencing red flag symptoms or are concerned about your pain, seek care from a qualified healthcare provider.",
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <main
        id="main-content"
        className="container mx-auto py-8 md:py-12 px-4"
      >
        <div className="max-w-4xl mx-auto prose prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-a:text-primary prose-ol:text-foreground">
          <h1>Is My Pain Serious? When to See a Doctor</h1>
          <p className="lead text-foreground/70">
            Not all pain is the same. Some pain needs immediate emergency care,
            some warrants a specialist visit, and some can be safely managed at
            home with time and rest. This guide helps you tell the difference.
          </p>

          <Alert variant="warning" className="not-prose my-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This information is for educational purposes only and is not a
              substitute for professional medical advice. If you are experiencing
              a medical emergency, call 911 or go to your nearest emergency room
              immediately.
            </AlertDescription>
          </Alert>

          <h2>When Pain Needs Immediate Attention</h2>
          <p>
            Some pain symptoms are medical emergencies. Call 911 or go to the
            emergency room right away if you experience any of the following:
          </p>
          <ul>
            <li>
              <strong>Sudden, severe headache</strong> &mdash; especially one
              described as &ldquo;the worst headache of your life,&rdquo; which
              can be a sign of a brain aneurysm or stroke
            </li>
            <li>
              <strong>Chest pain or pressure</strong> &mdash; particularly if
              accompanied by shortness of breath, sweating, nausea, or pain
              radiating to the arm, jaw, or back
            </li>
            <li>
              <strong>Pain with numbness or sudden weakness</strong> &mdash;
              especially on one side of the body, which may indicate a stroke or
              serious nerve compression
            </li>
            <li>
              <strong>Pain after a significant trauma</strong> &mdash; such as a
              fall, car accident, or sports injury, where fractures or internal
              injury are possible
            </li>
            <li>
              <strong>Loss of bladder or bowel control</strong> along with back
              or leg pain &mdash; this may indicate cauda equina syndrome, a
              serious spinal emergency
            </li>
            <li>
              <strong>Severe abdominal pain</strong> that comes on suddenly,
              especially if accompanied by fever, vomiting, or a rigid abdomen
            </li>
          </ul>
          <p>
            These symptoms do not always mean something catastrophic is
            happening, but they require prompt evaluation to rule out
            life-threatening causes. Do not drive yourself &mdash; call for help.
          </p>

          <h2>Red Flag Symptoms by Body Area</h2>
          <p>
            Beyond general emergencies, certain warning signs in specific body
            areas should prompt you to seek care sooner rather than later.
          </p>

          <h3>Back Pain</h3>
          <ul>
            <li>Pain following a fall, accident, or trauma</li>
            <li>
              Numbness, tingling, or weakness that travels down one or both legs
            </li>
            <li>Loss of bladder or bowel control</li>
            <li>
              Back pain with unexplained fever, chills, or unintentional weight
              loss
            </li>
            <li>
              Constant, severe pain that does not improve with any position or
              rest
            </li>
            <li>Back pain in someone with a history of cancer</li>
          </ul>

          <h3>Neck Pain</h3>
          <ul>
            <li>Neck pain after a head or neck injury</li>
            <li>
              Pain accompanied by weakness, numbness, or tingling in the arms or
              hands
            </li>
            <li>Severe stiffness with fever or sensitivity to light</li>
            <li>
              Neck pain with difficulty swallowing or breathing
            </li>
            <li>
              Pain that wakes you from sleep and is not related to sleeping
              position
            </li>
          </ul>

          <h3>Headache</h3>
          <ul>
            <li>
              A sudden, thunderclap headache (reaching peak intensity within
              seconds)
            </li>
            <li>
              Headache with fever, stiff neck, rash, confusion, or vision
              changes
            </li>
            <li>
              Headache after a head injury
            </li>
            <li>
              A new headache pattern in someone over 50
            </li>
            <li>
              Progressively worsening headaches over days or weeks
            </li>
          </ul>

          <h3>Joint Pain</h3>
          <ul>
            <li>
              A joint that is hot, red, severely swollen, or unable to bear
              weight after injury
            </li>
            <li>
              Joint pain with fever &mdash; this combination may indicate
              infection
            </li>
            <li>
              Sudden onset of severe joint pain in someone with no prior joint
              problems
            </li>
            <li>
              Pain that limits your ability to use a limb for daily tasks
            </li>
          </ul>

          <h3>Nerve Pain</h3>
          <ul>
            <li>
              New numbness or weakness in a limb rather than just burning or
              tingling
            </li>
            <li>
              Nerve-type pain after a known injury or surgery that is worsening
            </li>
            <li>
              Burning pain with significant skin changes (blistering, color
              changes) &mdash; this may indicate shingles or complex regional
              pain syndrome
            </li>
            <li>
              Rapid progression of symptoms affecting more areas of the body
            </li>
          </ul>

          <h2>ER vs. Urgent Care vs. Pain Specialist</h2>
          <p>
            Knowing where to seek care can save time, money, and anxiety. Here
            is a practical framework:
          </p>
          <ul>
            <li>
              <strong>Emergency room (ER):</strong> For symptoms that may be
              life-threatening or require immediate diagnostic testing and
              intervention &mdash; such as the emergency red flags listed above.
              ERs are equipped to rule out serious conditions quickly and can
              provide stabilizing treatment around the clock.
            </li>
            <li>
              <strong>Urgent care:</strong> For pain that is not an emergency
              but cannot wait for a regular appointment &mdash; such as a
              suspected minor fracture, a new injury that needs imaging, or an
              acute flare of a known condition over the weekend. Urgent care
              centers can evaluate, prescribe, and refer you for follow-up.
            </li>
            <li>
              <strong>Pain specialist:</strong> For chronic, ongoing, or complex
              pain that has persisted beyond a few weeks, is not responding to
              initial treatment, or significantly affects your quality of life.
              Pain management specialists have advanced training to diagnose and
              treat conditions that go beyond what primary care can address. See
              our guide to{" "}
              <Link href="/treatment-options/chronic-pain-management">
                chronic pain management
              </Link>{" "}
              for more on what these specialists offer.
            </li>
            <li>
              <strong>Primary care doctor:</strong> The right starting point for
              most new pain that is not urgent &mdash; your doctor can evaluate,
              run tests, start treatment, and refer you to a specialist when
              needed.
            </li>
          </ul>

          <h2>How to Assess Your Pain at Home</h2>
          <p>
            When pain is not clearly an emergency, a structured self-assessment
            can help you communicate with your provider and decide how quickly
            to seek care.
          </p>
          <ul>
            <li>
              <strong>Use a pain scale:</strong> Rate your pain on a scale from
              0 (no pain) to 10 (worst imaginable pain). Scores of 7 or higher
              that are not improving generally warrant same-day or next-day
              evaluation. Scores of 4&ndash;6 that persist for more than a few
              days should prompt a call to your doctor.
            </li>
            <li>
              <strong>Track the pattern:</strong> Note when your pain is worse
              (morning vs. evening, with activity vs. at rest), what makes it
              better, and whether it is staying the same, improving, or getting
              worse. A pattern that is progressively worsening is more concerning
              than one that fluctuates.
            </li>
            <li>
              <strong>Note associated symptoms:</strong> Fever, unexplained
              weight loss, night sweats, fatigue, or changes in bowel and bladder
              function alongside pain are important details for your provider.
            </li>
            <li>
              <strong>Consider duration:</strong> Acute pain &mdash; pain
              lasting less than three months &mdash; often has a clear cause and
              resolves with treatment or natural healing. Pain persisting beyond
              three months is considered chronic and benefits from a specialist
              evaluation. Our{" "}
              <Link href="/pain-management-guide">pain management guide</Link>{" "}
              explains this distinction in more detail.
            </li>
          </ul>

          <h2>Signs Your Pain Needs a Specialist</h2>
          <p>
            You may benefit from seeing a pain management specialist if your
            pain fits any of these patterns:
          </p>
          <ul>
            <li>
              <strong>Persistent beyond three months</strong> despite treatment
              or rest &mdash; this crosses the threshold into chronic pain
            </li>
            <li>
              <strong>Progressive</strong> &mdash; getting worse over time
              rather than following the expected path of improvement
            </li>
            <li>
              <strong>Functionally limiting</strong> &mdash; affecting your
              ability to work, sleep, move, or take part in daily life
            </li>
            <li>
              <strong>Not responding to over-the-counter treatments</strong> or
              initial prescribed therapies
            </li>
            <li>
              <strong>Radiating or changing in pattern</strong> &mdash; for
              example, back pain that now travels down the leg, or a new burning
              quality added to a familiar aching pain
            </li>
            <li>
              <strong>Accompanied by mood changes</strong> &mdash; depression
              and anxiety are common in people with persistent pain and are part
              of comprehensive pain care
            </li>
          </ul>

          <h2>Get an Evidence-Based Assessment</h2>
          <p>
            If you are unsure whether your symptoms warrant a doctor visit,{" "}
            <Link href="/consult">PainConsult AI</Link> can help. Describe your
            symptoms and get a free, evidence-based assessment of your pain
            pattern &mdash; including whether your symptoms suggest a need for
            urgent evaluation, a specialist visit, or home management. It is not
            a diagnosis, but it gives you a clearer starting point before
            calling your doctor.
          </p>
          <p>
            PainConsult AI uses current clinical guidelines to help you
            understand your symptoms in plain language. Many people find it
            useful for organizing their thoughts before an appointment so they
            can communicate more clearly with their provider.
          </p>

          <h2>Find a Pain Specialist Near You</h2>
          <p>
            If your pain has been going on for weeks or months, a board-certified
            pain management specialist can help identify the source and create a
            treatment plan tailored to you. Use our{" "}
            <Link href="/clinics">clinic directory</Link> to search more than
            5,000 pain management practices across all 50 states. You can filter
            by location, read patient reviews, and compare providers to find the
            right fit. You can also browse our{" "}
            <Link href="/treatment-options/chronic-pain-management">
              chronic pain management guide
            </Link>{" "}
            or the full{" "}
            <Link href="/pain-management-guide">pain management guide</Link> to
            learn more about what treatment may look like.
          </p>

          <div className="not-prose mt-8">
            <MedicalReviewBadge />
          </div>
        </div>
      </main>
    </>
  );
}
