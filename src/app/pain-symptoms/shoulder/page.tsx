import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MedicalReviewBadge } from "@/components/medical-review-badge";

export const metadata: Metadata = {
  title: "Shoulder Pain Symptoms: Causes, Red Flags & Treatment Guide",
  description:
    "Explore shoulder pain symptoms from rotator cuff injuries, frozen shoulder, impingement, and arthritis. Learn when shoulder pain needs specialist attention.",
  keywords: [
    "shoulder pain symptoms",
    "shoulder pain causes",
    "rotator cuff symptoms",
    "frozen shoulder",
    "shoulder and neck pain",
    "pain in left shoulder and left side of neck",
    "shoulder pain without injury",
  ],
  alternates: {
    canonical: "/pain-symptoms/shoulder",
  },
  openGraph: {
    title: "Shoulder Pain Symptoms: Causes, Red Flags & Treatment Guide",
    description:
      "A comprehensive guide to shoulder pain causes, symptom patterns, red flags, and treatment options from rotator cuff to frozen shoulder.",
    url: "/pain-symptoms/shoulder",
    type: "article",
  },
  twitter: {
    card: "summary",
    title: "Shoulder Pain Symptoms: Causes & Red Flags",
    description:
      "Rotator cuff, frozen shoulder, impingement, and other shoulder pain causes explained.",
  },
};

export default function ShoulderPainPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Shoulder Pain Symptoms: Causes, Red Flags & Treatment Guide",
    description:
      "Comprehensive guide to shoulder pain symptoms including rotator cuff injuries, frozen shoulder, impingement syndrome, arthritis, and when to see a specialist.",
    url: "https://painclinics.com/pain-symptoms/shoulder",
    about: [
      {
        "@type": "MedicalCondition",
        name: "Shoulder Pain",
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
        name: "Pain Symptoms",
        item: "https://painclinics.com/pain-symptoms",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Shoulder Pain",
        item: "https://painclinics.com/pain-symptoms/shoulder",
      },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What are the most common causes of shoulder pain?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The most common causes of shoulder pain are rotator cuff injuries (including tears and tendinitis), impingement syndrome, frozen shoulder (adhesive capsulitis), acromioclavicular (AC) joint problems, biceps tendinitis, and glenohumeral arthritis. Rotator cuff issues are the most frequent cause overall, affecting people of all ages but becoming more common after 40. Pain that worsens when reaching overhead or behind the back is a classic sign of rotator cuff or impingement problems.",
        },
      },
      {
        "@type": "Question",
        name: "How do I know if I have a rotator cuff tear?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Rotator cuff tears typically cause pain on the outer side of the shoulder and upper arm that worsens with overhead movements or reaching behind the back. Weakness when lifting the arm is common, especially with larger tears. Pain at night — particularly when lying on the affected shoulder — is a hallmark symptom. Some people report a sudden onset of pain with a specific injury, while others notice a gradual worsening over time. An MRI is usually needed to confirm a tear and determine its size.",
        },
      },
      {
        "@type": "Question",
        name: "What is frozen shoulder and how long does it last?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Frozen shoulder, or adhesive capsulitis, is a condition where the shoulder capsule thickens and tightens, causing significant pain and stiffness. It typically progresses through three stages: a painful freezing phase (worsening pain and stiffness over months), a frozen phase (less pain but severely restricted movement), and a thawing phase (gradual return of motion). The entire process typically takes one to three years, though treatment can help speed recovery and reduce pain during each phase.",
        },
      },
      {
        "@type": "Question",
        name: "Can shoulder pain be a sign of a heart attack?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Left shoulder pain — especially when combined with chest pain, shortness of breath, sweating, nausea, or arm pain — can be a symptom of a heart attack. This type of referred cardiac pain occurs because the heart and shoulder share nerve pathways. If you experience sudden left shoulder or arm pain along with any chest discomfort or these accompanying symptoms, call emergency services immediately. This is a medical emergency.",
        },
      },
      {
        "@type": "Question",
        name: "When should I see a doctor for shoulder pain?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "See a doctor if shoulder pain has lasted more than two to four weeks without improvement, if pain significantly limits your arm movement or daily activities, if you have weakness in the shoulder or arm, or if pain is worse at night. Prompt evaluation is warranted if pain follows an injury, if you heard a pop at the time of injury, or if you notice any visible deformity. Left shoulder pain with chest symptoms requires emergency evaluation.",
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
          <h1>Shoulder Pain Symptoms</h1>
          <p className="lead text-foreground/70">
            Shoulder pain is one of the most common musculoskeletal complaints,
            affecting nearly 70% of people at some point in their lives. Because
            the shoulder has an exceptionally wide range of motion, it is also
            one of the most injury-prone joints in the body.
          </p>

          <Alert variant="warning" className="not-prose my-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This information is for educational purposes only. Shoulder pain
              has many potential causes and symptoms can overlap significantly.
              A qualified healthcare provider should evaluate your specific
              symptoms to determine the cause and appropriate treatment.
            </AlertDescription>
          </Alert>

          <h2>Common Causes of Shoulder Pain</h2>
          <p>
            The shoulder is made up of three bones, multiple muscles, tendons,
            and bursae &mdash; all of which can be sources of pain. Most
            shoulder pain falls into one of several common categories:
          </p>

          <h3>Rotator Cuff Injuries</h3>
          <p>
            The rotator cuff is a group of four muscles and their tendons that
            surround the shoulder joint and control rotation and lifting. Rotator
            cuff injuries are the most common source of shoulder pain, ranging
            from tendinitis (inflammation of the tendon) to partial or full
            tears. Pain is typically felt on the outer side of the shoulder and
            upper arm, worsens with overhead activity, and is often worse at
            night when lying on the affected shoulder. Weakness when lifting or
            rotating the arm is common with larger tears.
          </p>

          <h3>Shoulder Impingement Syndrome</h3>
          <p>
            Impingement occurs when the rotator cuff tendons become pinched
            between the bones of the shoulder during overhead movements. It
            causes a painful arc of motion &mdash; pain that appears when you
            lift your arm to shoulder height or higher and may ease once the arm
            is fully raised. Impingement is often the predecessor to rotator
            cuff tendinitis and, if left unaddressed, to rotator cuff tears.
          </p>

          <h3>Frozen Shoulder (Adhesive Capsulitis)</h3>
          <p>
            Frozen shoulder develops when the connective tissue surrounding the
            shoulder joint becomes thick and tight, severely restricting
            movement. It typically develops gradually, often without a clear
            triggering injury. Pain can be intense in the early stages, followed
            by profound stiffness. The condition is more common in people with
            diabetes and in those who have kept an arm immobile after an injury
            or surgery. Most people eventually recover, but the process can take
            one to three years.
          </p>

          <h3>Acromioclavicular (AC) Joint Problems</h3>
          <p>
            The AC joint is where the collarbone meets the shoulder blade at the
            top of the shoulder. AC joint injuries from falls or direct contact
            cause pain and tenderness directly at the top of the shoulder. AC
            joint arthritis causes a similar pattern &mdash; a dull ache at the
            top of the shoulder that is worse with reaching across the body or
            sleeping on that side.
          </p>

          <h3>Biceps Tendinitis</h3>
          <p>
            The biceps tendon attaches at the top of the shoulder and can become
            inflamed from repetitive overhead activity or lifting. It causes
            pain at the front of the shoulder that may travel down the upper
            arm. A sudden, sharp pain followed by a visible bulge in the upper
            arm (&ldquo;Popeye deformity&rdquo;) indicates a biceps tendon
            rupture.
          </p>

          <h3>Shoulder Arthritis</h3>
          <p>
            Osteoarthritis of the glenohumeral (ball-and-socket) joint causes
            deep, aching pain, stiffness, and a grinding or clicking sensation
            with movement. It is less common than hip or knee arthritis but
            becomes more prevalent with age. Pain that is present at rest and
            worsens with any shoulder movement suggests significant joint
            involvement.
          </p>

          <h2>Shoulder Pain Without a Clear Injury</h2>
          <p>
            Many people develop significant shoulder pain without any specific
            traumatic event. This pattern is common with rotator cuff
            degeneration, impingement, frozen shoulder, and arthritis &mdash;
            all of which can develop gradually from repetitive use, age-related
            changes, or postural factors. Shoulder pain without injury is just
            as real and just as treatable as pain following a clear trauma, and
            it warrants the same thorough evaluation.
          </p>
          <p>
            It is also important to note that left shoulder pain can be referred
            from the heart in cardiac events. Any left shoulder or arm pain
            accompanied by chest discomfort, shortness of breath, or sweating
            should be treated as a potential cardiac emergency.
          </p>

          <h2>Warning Signs Requiring Prompt Evaluation</h2>
          <ul>
            <li>
              <strong>Left shoulder pain with chest symptoms</strong> &mdash;
              shortness of breath, pressure, or sweating: call emergency
              services
            </li>
            <li>
              <strong>Sudden severe pain or a pop</strong> during an activity,
              especially with immediate weakness
            </li>
            <li>
              <strong>Visible deformity</strong> of the shoulder or collarbone
              after an injury
            </li>
            <li>
              <strong>Complete inability to raise the arm</strong> after an
              injury (may indicate a full rotator cuff tear or dislocation)
            </li>
            <li>
              <strong>Shoulder dislocation</strong> &mdash; the shoulder
              appears out of its normal position; do not attempt to reduce it
              yourself
            </li>
            <li>
              <strong>Pain with fever, redness, and warmth</strong> in the
              shoulder &mdash; may indicate infection
            </li>
            <li>
              <strong>Unexplained shoulder pain with unintended weight loss</strong>{" "}
              &mdash; requires evaluation to rule out serious underlying causes
            </li>
          </ul>

          <h2>When to See a Shoulder Pain Specialist</h2>
          <p>
            Consider scheduling an evaluation with a pain management or
            orthopedic specialist if:
          </p>
          <ul>
            <li>Shoulder pain has persisted for more than two to four weeks</li>
            <li>
              You have noticeable weakness when lifting, reaching, or rotating
              the arm
            </li>
            <li>
              Pain significantly limits your range of motion or daily activities
            </li>
            <li>
              Night pain is regularly disrupting your sleep
            </li>
            <li>
              You have tried rest and over-the-counter approaches without
              meaningful improvement
            </li>
            <li>
              You want an accurate diagnosis before deciding on treatment
            </li>
          </ul>

          <h2>Treatment Options for Shoulder Pain</h2>
          <p>
            Treatment is guided by the specific cause and severity of your
            condition. Options commonly used by shoulder pain specialists
            include:
          </p>
          <ul>
            <li>
              <strong>Physical therapy:</strong> The most important non-surgical
              treatment for most shoulder conditions, focusing on rotator cuff
              strengthening, scapular stabilization, and restoring range of
              motion
            </li>
            <li>
              <strong>
                <Link href="/treatment-options/pain-management-injections">
                  Injection therapies
                </Link>:
              </strong>{" "}
              Corticosteroid injections into the shoulder joint, subacromial
              space, or AC joint to reduce inflammation; hyaluronic acid for
              arthritis; hydrodilatation for frozen shoulder
            </li>
            <li>
              <strong>
                <Link href="/treatment-options/regenerative-orthopedic-medicine">
                  Regenerative medicine
                </Link>:
              </strong>{" "}
              PRP therapy to support healing in rotator cuff tendinopathy and
              partial tears in appropriate candidates
            </li>
            <li>
              <strong>
                <Link href="/treatment-options/interventional-pain-management">
                  Interventional procedures
                </Link>:
              </strong>{" "}
              Nerve blocks or suprascapular nerve blocks for refractory
              shoulder pain
            </li>
            <li>
              <strong>Activity modification and postural correction:</strong>{" "}
              Guidance on avoiding aggravating movements and correcting
              postural contributors to impingement
            </li>
          </ul>

          <h2>Get a Personalized Shoulder Pain Assessment</h2>
          <p>
            If you have been dealing with shoulder pain and want a clearer
            picture of your options before seeing a provider, our{" "}
            <Link href="/consult">free pain consultation tool</Link> can help
            you organize your symptoms and generate a summary to bring to your
            appointment.
          </p>

          <h2>Related Symptom Guides</h2>
          <ul>
            <li>
              <Link href="/pain-symptoms/nerve-pain">Nerve Pain</Link>{" "}
              &mdash; When shoulder pain involves nerve compression or
              radiculopathy from the cervical spine
            </li>
            <li>
              <Link href="/pain-symptoms/hip">Hip Pain</Link>{" "}
              &mdash; Understanding other common joint pain patterns
            </li>
            <li>
              <Link href="/treatment-options/chronic-pain-management">
                Chronic Pain Management
              </Link>{" "}
              &mdash; Approaches for long-standing shoulder pain
            </li>
            <li>
              <Link href="/treatment-options/pain-management-injections">
                Pain Management Injections
              </Link>{" "}
              &mdash; Shoulder injection options explained
            </li>
          </ul>

          <h2>Find a Shoulder Pain Specialist Near You</h2>
          <p>
            Use our{" "}
            <Link href="/clinics">clinic directory</Link> to find pain
            management and orthopedic specialists near you who treat shoulder
            pain. With over 5,000 clinics listed across all 50 states, you can
            search by location, read patient reviews, and compare providers.
          </p>

          <div className="not-prose mt-8">
            <MedicalReviewBadge />
          </div>
        </div>
      </main>
    </>
  );
}
