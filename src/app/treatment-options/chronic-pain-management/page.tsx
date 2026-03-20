import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MedicalReviewBadge } from "@/components/medical-review-badge";
import { ConsultCTA } from "@/components/consult/consult-cta";

export const metadata: Metadata = {
  title: "Chronic Pain Management: Treatment Options, Specialists & Support",
  description:
    "Understand chronic pain management including treatment options, the multidisciplinary approach, when to see a specialist, and what to expect at your first visit. Find a chronic pain specialist near you.",
  keywords: [
    "chronic pain management",
    "chronic pain management near me",
    "chronic pain specialist",
    "chronic pain treatment",
    "long-term pain management",
    "multidisciplinary pain management",
    "chronic pain doctor",
    "living with chronic pain",
  ],
  alternates: {
    canonical: "/treatment-options/chronic-pain-management",
  },
  openGraph: {
    title: "Chronic Pain Management: Treatment Options, Specialists & Support",
    description:
      "A comprehensive guide to chronic pain management covering treatment options, the biopsychosocial approach, when to see a specialist, and how to find the right care.",
    url: "/treatment-options/chronic-pain-management",
    type: "article",
  },
  twitter: {
    card: "summary",
    title: "Chronic Pain Management: Treatment Options & Specialists",
    description:
      "Treatment options, the multidisciplinary approach, and how to find a chronic pain specialist near you.",
  },
};

export default function ChronicPainManagementPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Chronic Pain Management: Treatment Options, Specialists & Support",
    description:
      "Comprehensive guide to chronic pain management including treatment modalities, the biopsychosocial approach, when to see a specialist, and finding the right care.",
    url: "https://painclinics.com/treatment-options/chronic-pain-management",
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
    lastReviewed: "2026-03-06",
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
        name: "Treatment Options",
        item: "https://painclinics.com/treatment-options",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Chronic Pain Management",
        item: "https://painclinics.com/treatment-options/chronic-pain-management",
      },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is considered chronic pain?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Chronic pain is pain that persists for more than three months, continuing beyond the normal healing period for an injury or illness. It can be constant or intermittent and range from mild to severe. Chronic pain affects approximately 20% of adults in the United States and can significantly impact daily activities, sleep, mood, and overall quality of life.",
        },
      },
      {
        "@type": "Question",
        name: "When should I see a chronic pain specialist?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Consider seeing a pain management specialist if your pain has lasted more than three months, is not adequately controlled by your primary care physician, interferes with daily activities or sleep, requires escalating medication doses, is accompanied by depression or anxiety, or if you want to explore treatment options beyond medication. A pain specialist can provide a comprehensive evaluation and develop a multidisciplinary treatment plan.",
        },
      },
      {
        "@type": "Question",
        name: "What happens at the first chronic pain management appointment?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Your first appointment typically lasts 45 to 90 minutes and includes a thorough review of your pain history, medical records, and previous treatments. The specialist will perform a physical examination and may order diagnostic tests. They will discuss your treatment goals and develop a personalized management plan that may include medication adjustments, interventional procedures, physical therapy, and psychological support.",
        },
      },
      {
        "@type": "Question",
        name: "Can chronic pain be cured?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "While some chronic pain conditions can be resolved by addressing the underlying cause, many require ongoing management. The goal of chronic pain treatment is typically to reduce pain to a manageable level, improve physical function, and enhance quality of life. Many patients find that a combination of treatments allows them to return to activities they enjoy and maintain daily functioning.",
        },
      },
      {
        "@type": "Question",
        name: "What is the biopsychosocial approach to chronic pain?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The biopsychosocial approach recognizes that chronic pain involves biological factors (tissue damage, nerve dysfunction), psychological factors (thoughts, emotions, behaviors), and social factors (relationships, work, daily activities). Treatment addresses all three dimensions, combining medical interventions with psychological support and lifestyle modifications for the most effective long-term outcomes.",
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
          <h1>Chronic Pain Management</h1>
          <p className="lead text-foreground/70">
            Living with chronic pain can feel overwhelming, but effective
            treatment options exist. This guide covers what chronic pain is, how
            specialists approach it, and how to find the right care.
          </p>

          <Alert variant="warning" className="not-prose my-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This information is for educational purposes only. Chronic pain
              treatment should be guided by a qualified healthcare provider who
              understands your individual condition and medical history.
            </AlertDescription>
          </Alert>

          <h2>Understanding Chronic Pain</h2>
          <p>
            Chronic pain is defined as pain that persists for more than three
            months &mdash; continuing beyond the normal healing period for an
            injury or illness. According to the Centers for Disease Control and
            Prevention, approximately 51 million adults in the United States
            (about 20% of the adult population) live with chronic pain, making
            it one of the most common reasons people seek medical care.
          </p>
          <p>
            Unlike acute pain, which serves as a warning signal of injury or
            illness, chronic pain often continues even after the original cause
            has healed. In many cases, the nervous system itself changes over
            time, becoming more sensitive to pain signals &mdash; a process
            known as central sensitization.
          </p>

          <h3>Chronic Pain vs. Acute Pain</h3>
          <p>
            Understanding the difference between chronic and acute pain is
            important because they require different treatment approaches:
          </p>
          <ul>
            <li>
              <strong>Acute pain</strong> is short-term, typically caused by a
              specific injury or illness, and resolves as the body heals.
              Treatment focuses on addressing the underlying cause and managing
              symptoms during recovery.
            </li>
            <li>
              <strong>Chronic pain</strong> persists beyond three months and
              may or may not have an identifiable ongoing cause. Treatment
              focuses on reducing pain, improving function, and enhancing
              quality of life through a combination of approaches.
            </li>
          </ul>

          <h3>Common Chronic Pain Conditions</h3>
          <ul>
            <li>Chronic lower back pain</li>
            <li>Neck pain and cervical spondylosis</li>
            <li>Osteoarthritis and rheumatoid arthritis</li>
            <li>Fibromyalgia</li>
            <li>Neuropathic pain (diabetic neuropathy, postherpetic neuralgia)</li>
            <li>Chronic migraine and tension-type headache</li>
            <li>Complex regional pain syndrome (CRPS)</li>
            <li>Failed back surgery syndrome</li>
            <li>Myofascial pain syndrome</li>
            <li>Chronic pelvic pain</li>
          </ul>

          <h2>The Multidisciplinary Approach</h2>
          <p>
            Modern chronic pain management is built on the biopsychosocial
            model, which recognizes that pain involves biological, psychological,
            and social factors. The most effective treatment plans address all
            three dimensions rather than focusing on any one alone.
          </p>
          <p>
            Pain management is a recognized medical specialty. Board-certified
            pain management physicians complete fellowship training after
            residency in fields like anesthesiology, physical medicine and
            rehabilitation, or neurology. Many work within multidisciplinary
            teams that include physical therapists, psychologists, nurses, and
            other specialists.
          </p>

          <h3>Biological Treatments</h3>
          <p>
            These address the physical sources and mechanisms of pain:
          </p>
          <ul>
            <li>
              <strong>Medication management:</strong> Your specialist may
              recommend a combination of medications tailored to your pain type,
              which may include anti-inflammatory drugs, nerve pain medications,
              muscle relaxants, or topical treatments
            </li>
            <li>
              <strong>
                <Link href="/treatment-options/interventional-pain-management">
                  Interventional procedures
                </Link>:
              </strong>{" "}
              Minimally invasive techniques such as nerve blocks, epidural
              injections, radiofrequency ablation, and spinal cord stimulation
              that target the specific source of pain
            </li>
            <li>
              <strong>
                <Link href="/treatment-options/pain-management-injections">
                  Injection therapies
                </Link>:
              </strong>{" "}
              Targeted injections that deliver medication directly to the
              affected area for anti-inflammatory and pain-relieving effects
            </li>
            <li>
              <strong>Physical therapy:</strong> Structured exercise programs,
              manual therapy, and modalities that improve strength, flexibility,
              and function while reducing pain
            </li>
            <li>
              <strong>
                <Link href="/treatment-options/regenerative-orthopedic-medicine">
                  Regenerative medicine
                </Link>:
              </strong>{" "}
              Treatments such as PRP therapy and prolotherapy that promote
              tissue healing
            </li>
          </ul>

          <h3>Psychological Approaches</h3>
          <p>
            Chronic pain affects and is affected by thoughts, emotions, and
            behaviors. Psychological treatment is not a replacement for medical
            care &mdash; it is an essential complement:
          </p>
          <ul>
            <li>
              <strong>Cognitive behavioral therapy (CBT):</strong> Helps
              identify and change thought patterns and behaviors that worsen
              pain. CBT for chronic pain has strong evidence supporting its
              effectiveness in reducing pain intensity and improving function.
            </li>
            <li>
              <strong>Acceptance and commitment therapy (ACT):</strong> Focuses
              on accepting pain as part of life while committing to valued
              activities and goals despite pain
            </li>
            <li>
              <strong>Mindfulness-based stress reduction (MBSR):</strong>{" "}
              Meditation and awareness practices that can change the
              relationship with pain and reduce suffering
            </li>
            <li>
              <strong>Biofeedback:</strong> Learn to consciously control
              physiological processes like muscle tension and heart rate that
              can influence pain
            </li>
          </ul>

          <h3>Lifestyle and Self-Management</h3>
          <p>
            Daily habits play a significant role in chronic pain management:
          </p>
          <ul>
            <li>
              <strong>Regular movement and exercise:</strong> Staying physically
              active within your limits helps maintain function and can reduce
              pain over time. Even gentle activities like walking, swimming, or
              yoga can make a meaningful difference.
            </li>
            <li>
              <strong>Sleep quality:</strong> Poor sleep worsens pain, and pain
              disrupts sleep &mdash; creating a cycle that treatment can help
              break. Sleep hygiene strategies and treating sleep disorders are
              often part of a comprehensive pain plan.
            </li>
            <li>
              <strong>Nutrition:</strong> Anti-inflammatory eating patterns
              (such as the Mediterranean diet) may help reduce certain types of
              chronic pain. Maintaining a healthy weight also reduces stress on
              joints and the spine.
            </li>
            <li>
              <strong>Stress management:</strong> Chronic stress amplifies pain
              signals. Regular stress-reduction practices &mdash; whether
              meditation, deep breathing, or enjoyable hobbies &mdash; support
              overall pain management.
            </li>
            <li>
              <strong>Pain tracking:</strong> Keeping a record of your pain
              levels, triggers, and relief patterns helps your provider fine-tune
              your treatment plan. Try our{" "}
              <Link href="/pain-tracking">pain tracking tools</Link> to get
              started.
            </li>
          </ul>

          <h2>When to See a Chronic Pain Specialist</h2>
          <p>
            While many pain conditions can be managed by your primary care
            physician, consider seeing a pain management specialist if:
          </p>
          <ul>
            <li>Your pain has lasted more than three months</li>
            <li>Pain is not adequately controlled with current treatments</li>
            <li>
              Pain significantly interferes with work, sleep, relationships, or
              daily activities
            </li>
            <li>You are taking increasing amounts of pain medication</li>
            <li>You want to explore non-medication treatment options</li>
            <li>
              Pain is accompanied by depression, anxiety, or social withdrawal
            </li>
            <li>
              You have been told &ldquo;nothing more can be done&rdquo; by other
              providers
            </li>
          </ul>

          <h2>What to Expect at Your First Visit</h2>
          <p>
            Your initial appointment with a chronic pain specialist is typically
            longer and more thorough than a standard medical visit, often lasting
            45 to 90 minutes. Here is what to expect:
          </p>
          <ol>
            <li>
              <strong>Comprehensive pain history:</strong> Your specialist will
              ask detailed questions about your pain &mdash; when it started,
              what it feels like, what makes it better or worse, and how it
              affects your life
            </li>
            <li>
              <strong>Medical record review:</strong> Bring copies of imaging
              studies (MRI, X-ray, CT), prior treatment records, and a list of
              all current medications
            </li>
            <li>
              <strong>Physical examination:</strong> A focused examination to
              assess your pain, mobility, strength, and neurological function
            </li>
            <li>
              <strong>Goal setting:</strong> Rather than promising to eliminate
              pain, your specialist will work with you to set realistic,
              meaningful goals &mdash; such as returning to specific activities,
              improving sleep, or reducing medication use
            </li>
            <li>
              <strong>Treatment plan development:</strong> A personalized plan
              that may include a combination of medication adjustments,
              interventional procedures, physical therapy, and psychological
              support
            </li>
          </ol>

          <h2>Questions to Ask Your Chronic Pain Specialist</h2>
          <ol>
            <li>What is causing my chronic pain?</li>
            <li>What treatment approach do you recommend and why?</li>
            <li>What realistic improvement can I expect?</li>
            <li>How will you measure my progress?</li>
            <li>What role does physical therapy play in my treatment plan?</li>
            <li>Would psychological support (such as CBT) benefit me?</li>
            <li>Are there interventional procedures that might help?</li>
            <li>What can I do at home to support my treatment?</li>
            <li>How often will I need follow-up appointments?</li>
            <li>What happens if the initial treatment plan is not effective?</li>
          </ol>

          <h2>Related Treatment Guides</h2>
          <ul>
            <li>
              <Link href="/treatment-options/interventional-pain-management">
                Interventional Pain Management
              </Link>{" "}
              &mdash; Nerve blocks, spinal cord stimulation, radiofrequency
              ablation, and other minimally invasive procedures
            </li>
            <li>
              <Link href="/treatment-options/pain-management-injections">
                Pain Management Injections
              </Link>{" "}
              &mdash; Epidural steroids, facet joint injections, trigger point
              injections, and more
            </li>
            <li>
              <Link href="/treatment-options/regenerative-orthopedic-medicine">
                Regenerative Orthopedic Medicine
              </Link>{" "}
              &mdash; PRP therapy, stem cell treatments, and prolotherapy
            </li>
            <li>
              <Link href="/pain-management-guide">
                Pain Management Guide
              </Link>{" "}
              &mdash; Overview of pain types, treatment approaches, and finding
              the right clinic
            </li>
          </ul>

          <div className="not-prose my-8">
            <ConsultCTA variant="section" />
          </div>

          <h2>Find a Chronic Pain Specialist Near You</h2>
          <p>
            You do not have to manage chronic pain alone. Use our{" "}
            <Link href="/clinics">
              clinic directory
            </Link>{" "}
            to find board-certified pain management specialists near you who
            take a comprehensive, multidisciplinary approach to chronic pain
            care. With over 5,000 clinics listed across all 50 states, you can
            search by location, read patient reviews, and compare providers. You
            can also{" "}
            <Link href="/treatment-options">
              browse all treatment options
            </Link>{" "}
            to learn about specific therapies.
          </p>

          <div className="not-prose mt-8">
            <MedicalReviewBadge />
          </div>
        </div>
      </main>
    </>
  );
}
