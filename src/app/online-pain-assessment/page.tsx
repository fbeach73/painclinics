import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MedicalReviewBadge } from "@/components/medical-review-badge";

export const metadata: Metadata = {
  title: "Online Pain Assessment: Free AI-Powered Symptom Checker | PainClinics.com",
  description:
    "Understand your pain with a free online assessment. PainConsult AI asks about your symptoms, identifies potential causes, and helps you find the right pain specialist — no appointment needed.",
  keywords: [
    "online pain assessment",
    "pain symptom checker",
    "AI pain assessment",
    "check my pain symptoms online",
    "free pain assessment",
    "pain self assessment",
    "pain evaluation online",
    "what is causing my pain",
  ],
  alternates: {
    canonical: "/online-pain-assessment",
  },
  openGraph: {
    title: "Online Pain Assessment: Free AI-Powered Symptom Checker | PainClinics.com",
    description:
      "Understand your pain with a free online assessment. PainConsult AI asks about your symptoms, identifies potential causes, and helps you find the right pain specialist.",
    url: "/online-pain-assessment",
    type: "article",
  },
  twitter: {
    card: "summary",
    title: "Online Pain Assessment: Free AI-Powered Symptom Checker",
    description:
      "PainConsult AI asks about your symptoms, identifies potential causes, and helps you find the right pain specialist — no appointment needed.",
  },
};

export default function OnlinePainAssessmentPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Online Pain Assessment: Free AI-Powered Symptom Checker",
    description:
      "Learn how online pain assessments work, what PainConsult AI can and cannot tell you, and how to use a symptom checker to prepare for seeing a pain specialist.",
    url: "https://painclinics.com/online-pain-assessment",
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
        name: "Online Pain Assessment",
        item: "https://painclinics.com/online-pain-assessment",
      },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is an online pain assessment?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "An online pain assessment is an AI-guided questionnaire that helps you describe and understand your pain. It asks about where you feel pain, what it feels like, how long you have had it, and what makes it better or worse. Based on your answers, the tool identifies potential causes, suggests an urgency level, and recommends what type of specialist may help you most. It is not a medical diagnosis — it is a starting point to help you make sense of your symptoms and take the next right step.",
        },
      },
      {
        "@type": "Question",
        name: "Is an online pain assessment accurate?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Online pain assessments are built on evidence-based clinical guidelines and can reliably point you toward likely causes and appropriate care. However, no symptom checker replaces a physical examination, imaging, or lab work. Think of the result as an informed starting point — a way to arrive at your first doctor visit with a clearer picture of your symptoms, not a final answer.",
        },
      },
      {
        "@type": "Question",
        name: "Can an online assessment diagnose my condition?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. An online pain assessment cannot diagnose a medical condition. Diagnosis requires a licensed healthcare provider who can examine you in person, review your full medical history, and order appropriate tests. The assessment helps you identify possible explanations for your symptoms and guides you toward the right type of care — it does not replace that care.",
        },
      },
      {
        "@type": "Question",
        name: "How long does PainConsult AI take?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Most people complete the PainConsult AI assessment in about five minutes. The tool asks a focused set of questions about your pain location, quality, duration, and related symptoms. You will receive your personalized results immediately after finishing the questionnaire.",
        },
      },
      {
        "@type": "Question",
        name: "Do I need to create an account?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No account is required to start your free assessment. You can complete the full questionnaire and receive your results without registering. If you would like to save your results or return to them later, you have the option to create a free account.",
        },
      },
    ],
  };

  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Use PainConsult AI for an Online Pain Assessment",
    description:
      "Step-by-step guide to completing a free online pain assessment with PainConsult AI.",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Select your pain location",
        text: "Use the interactive body map to identify where you feel pain. You can select multiple areas if your pain affects more than one region.",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Describe your symptoms",
        text: "Answer questions about what your pain feels like — sharp, dull, burning, aching — and how it behaves. Describe intensity, duration, and any patterns you have noticed.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Answer follow-up questions",
        text: "PainConsult AI asks targeted follow-up questions based on your initial answers to narrow down potential causes and better understand your situation.",
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Receive your evidence-based assessment",
        text: "Review a personalized summary of potential conditions that match your symptoms, an urgency level, and guidance on what type of specialist to see.",
      },
      {
        "@type": "HowToStep",
        position: 5,
        name: "Find matching pain clinics",
        text: "Use your results to search our directory of 5,000+ pain management clinics and find a specialist near you who treats your type of pain.",
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <main
        id="main-content"
        className="container mx-auto py-8 md:py-12 px-4"
      >
        <div className="max-w-4xl mx-auto prose prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-a:text-primary prose-ol:text-foreground">
          <h1>Online Pain Assessment</h1>
          <p className="lead text-foreground/70">
            Not sure what is causing your pain or what kind of doctor to see?
            A free online assessment can help you understand your symptoms,
            identify possible causes, and take the right first step toward
            relief.
          </p>

          <Alert variant="warning" className="not-prose my-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This information is for educational purposes only. An online
              pain assessment is not a medical diagnosis. Always consult a
              qualified healthcare provider for evaluation and treatment of
              pain symptoms.
            </AlertDescription>
          </Alert>

          <h2>What Is an Online Pain Assessment?</h2>
          <p>
            An online pain assessment is an AI-guided questionnaire that helps
            you put your pain into words and make sense of what you are
            experiencing. It asks structured questions about where you hurt,
            what the pain feels like, how long you have had it, and what
            affects it. Based on your answers, the tool surfaces potential
            explanations, tells you how urgently you may need care, and
            suggests which type of specialist is most likely to help.
          </p>
          <p>
            This is different from a medical diagnosis. A diagnosis requires a
            licensed provider who can examine you in person, review your full
            medical history, and order tests like imaging or blood work. An
            online assessment works more like a knowledgeable guide &mdash; it
            helps you arrive at that appointment better prepared, with a
            clearer picture of your symptoms and the right questions to ask.
          </p>
          <p>
            AI symptom checkers like <Link href="/consult">PainConsult AI</Link>{" "}
            apply the same clinical reasoning patterns that pain specialists use
            &mdash; pattern recognition across symptom combinations, body
            regions, and risk factors &mdash; to match your description against
            evidence-based diagnostic frameworks. The result is a structured
            starting point, not a final answer.
          </p>

          <h2>How PainConsult AI Works</h2>
          <p>
            PainConsult AI is designed to be simple and fast. Most people
            finish in about five minutes:
          </p>
          <ol>
            <li>
              <strong>Select your pain location.</strong> Use an interactive
              body map to identify where you feel pain. You can mark more than
              one area if your symptoms affect multiple regions.
            </li>
            <li>
              <strong>Describe your symptoms.</strong> Answer questions about
              what the pain feels like &mdash; sharp, dull, burning, aching,
              throbbing &mdash; along with how intense it is, when it started,
              and whether it comes and goes or stays constant.
            </li>
            <li>
              <strong>Answer targeted follow-ups.</strong> Based on your initial
              answers, PainConsult AI asks follow-up questions to clarify your
              situation. These questions mirror the kind of intake a pain
              specialist would conduct in a clinical setting.
            </li>
            <li>
              <strong>Receive your personalized assessment.</strong> Your
              results include potential conditions that match your symptom
              profile, a recommended urgency level, and guidance on what type
              of specialist to see. Results are presented in plain language.
            </li>
            <li>
              <strong>Find matching clinics near you.</strong> Use your results
              directly to search our{" "}
              <Link href="/pain-management-guide">pain management directory</Link>{" "}
              and find a specialist who treats your type of pain.
            </li>
          </ol>

          <h2>What an Online Assessment Can Tell You</h2>
          <p>
            A well-designed online pain assessment provides meaningful,
            actionable information:
          </p>
          <ul>
            <li>
              <strong>Potential conditions matching your symptoms.</strong> The
              assessment surfaces the most likely explanations for your pain
              pattern based on clinical evidence, helping you understand what
              may be going on.
            </li>
            <li>
              <strong>Urgency level.</strong> Some pain symptoms require prompt
              evaluation. The tool distinguishes between symptoms that warrant
              urgent attention and those that can be addressed through a
              scheduled appointment.
            </li>
            <li>
              <strong>What type of specialist to see.</strong> Pain care spans
              many specialties &mdash; physiatry, anesthesiology-based pain
              medicine, orthopedics, neurology, and others. Your assessment
              results point you toward the type of provider best suited to your
              situation.
            </li>
            <li>
              <strong>Self-care topics to discuss with your doctor.</strong>{" "}
              The results may highlight lifestyle factors, activity
              modifications, or self-management approaches worth raising at
              your appointment. See our{" "}
              <Link href="/treatment-options">treatment options guide</Link> for
              an overview of what pain specialists can offer.
            </li>
          </ul>

          <h2>What an Online Assessment Cannot Do</h2>
          <p>
            It is equally important to understand the limits of any online tool:
          </p>
          <ul>
            <li>
              <strong>It cannot diagnose your condition.</strong> Diagnosis
              requires a physical examination, your full medical history, and
              often imaging or laboratory tests. No questionnaire, however
              thorough, can replace that process.
            </li>
            <li>
              <strong>It cannot prescribe or recommend treatment.</strong> Only
              a licensed provider who has evaluated you can determine the right
              treatment approach for your specific situation.
            </li>
            <li>
              <strong>It does not replace imaging or lab work.</strong> Many
              pain conditions require an MRI, X-ray, nerve conduction study, or
              blood work to confirm what is happening. An assessment can suggest
              that testing may be appropriate, but it cannot perform those tests.
            </li>
            <li>
              <strong>It cannot account for your full medical history.</strong>{" "}
              Your other health conditions, prior injuries, surgeries, and
              current medications all influence pain and its treatment. A
              provider who knows your history is essential.
            </li>
          </ul>

          <h2>Who Should Use an Online Pain Assessment?</h2>
          <p>
            An online pain assessment is most useful for people who:
          </p>
          <ul>
            <li>
              Are experiencing <strong>new or unexplained pain</strong> and want
              to understand what might be causing it before seeing a doctor
            </li>
            <li>
              Are <strong>preparing for a doctor visit</strong> and want to
              organize their symptoms, describe them more clearly, and know what
              questions to ask
            </li>
            <li>
              Are <strong>unsure which specialist to see</strong> &mdash; a
              primary care physician, orthopedist, neurologist, or pain
              management specialist
            </li>
            <li>
              Are living with <strong>chronic pain</strong> and want to explore
              whether other treatment options or a different type of provider
              might help
            </li>
            <li>
              Want a <strong>second opinion starting point</strong> before
              pursuing additional evaluation
            </li>
          </ul>
          <p>
            If you are experiencing severe pain, sudden onset of new
            neurological symptoms such as weakness or numbness, or pain
            following a significant injury, seek in-person medical evaluation
            promptly rather than starting with an online tool.
          </p>

          <h2>Privacy and Your Data</h2>
          <p>
            PainConsult AI is designed with your privacy in mind. You do not
            need to create an account to complete your assessment. The
            information you share is used only to generate your personalized
            results. We do not sell your health information to third parties.
            If you choose to save your results or receive clinic recommendations
            by email, you will be asked to provide contact information at that
            point.
          </p>
          <p>
            Review our full privacy practices on the{" "}
            <Link href="/medical-disclaimer">medical disclaimer page</Link> for
            details on how we handle health-related information.
          </p>

          <h2>Start Your Free Assessment</h2>
          <p>
            Understanding your pain is the first step toward managing it.
            PainConsult AI is free, takes about five minutes, and requires no
            account or insurance information. You will receive a clear summary
            of potential causes, an urgency recommendation, and guidance on
            finding the right specialist.
          </p>
          <p>
            <Link href="/consult">
              Start your free pain assessment &rarr;
            </Link>
          </p>
          <p>
            Already know you need a specialist? Browse our directory of
            5,000+ pain clinics across the United States to find board-certified
            pain management providers near you.{" "}
            <Link href="/pain-management-guide">
              Search pain clinics near you &rarr;
            </Link>
          </p>

          <div className="not-prose mt-8">
            <MedicalReviewBadge />
          </div>
        </div>
      </main>
    </>
  );
}
