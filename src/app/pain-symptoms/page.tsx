import { AlertTriangle } from "lucide-react";
import { Metadata } from "next";
import { MedicalReviewBadge } from "@/components/medical-review-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const metadata: Metadata = {
  title: "Pain Symptom Checker: Identify Your Pain by Body Location | PainClinics.com",
  description:
    "Explore common pain symptoms by body location. Learn about causes, warning signs, and when to see a specialist for lower back, knee, neck, hip, shoulder, headache, and nerve pain.",
  keywords: ["pain symptom checker", "pain symptoms", "body pain causes", "pain by location", "what causes pain", "identify pain type"],
  alternates: {
    canonical: "/pain-symptoms",
  },
};

export default function PainSymptomsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MedicalWebPage",
        "@id": "https://painclinics.com/pain-symptoms",
        name: "Pain Symptoms by Body Location",
        url: "https://painclinics.com/pain-symptoms",
        description:
          "Explore common pain symptoms by body location. Learn about causes, warning signs, and when to see a specialist for lower back, knee, neck, hip, shoulder, headache, and nerve pain.",
        inLanguage: "en-US",
        medicalAudience: {
          "@type": "MedicalAudience",
          audienceType: "Patient",
        },
        about: {
          "@type": "MedicalCondition",
          name: "Pain",
        },
        publisher: {
          "@type": "Organization",
          name: "PainClinics.com",
          url: "https://painclinics.com",
        },
      },
      {
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
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main id="main-content" className="container mx-auto py-8 md:py-12 px-4">
        <div className="max-w-4xl mx-auto prose prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-a:text-primary">
          <h1>Pain Symptoms by Body Location</h1>
          <p className="lead text-foreground/70">
            Understanding where your pain occurs is the first step toward finding the right
            diagnosis and care. Different parts of the body have distinct structures, nerve
            pathways, and common conditions — and the location of your pain often points to
            what&apos;s causing it.
          </p>

          <Alert variant="warning" className="not-prose my-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This information is for educational purposes only and does not constitute medical
              advice. Always consult a qualified healthcare provider for diagnosis and treatment
              of pain symptoms, especially if you experience sudden, severe, or worsening pain.
            </AlertDescription>
          </Alert>

          <p>
            Each body area has its own set of common conditions, warning signs, and treatment
            considerations. The guides below walk through typical causes, symptoms to watch for,
            and guidance on when to seek care from a pain management specialist.
          </p>

          <h2>Choose Your Pain Location</h2>
          <ul>
            <li>
              <a href="/pain-symptoms/lower-back">Lower Back Pain</a> — Common causes, red
              flags, and when to see a specialist for lower back pain
            </li>
            <li>
              <a href="/pain-symptoms/knee">Knee Pain</a> — Injury, arthritis, and other
              causes of knee pain by age group
            </li>
            <li>
              <a href="/pain-symptoms/neck">Neck Pain</a> — Cervical conditions, tension,
              and nerve-related neck pain
            </li>
            <li>
              <a href="/pain-symptoms/hip">Hip Pain</a> — Joint, muscle, and referred pain
              in the hip area
            </li>
            <li>
              <a href="/pain-symptoms/shoulder">Shoulder Pain</a> — Rotator cuff, frozen
              shoulder, and other shoulder conditions
            </li>
            <li>
              <a href="/pain-symptoms/headache-migraine">Headache and Migraine</a> — Types
              of headaches, migraine patterns, and when headaches signal something serious
            </li>
            <li>
              <a href="/pain-symptoms/nerve-pain">Nerve Pain</a> — Neuropathy, radiculopathy,
              and other nerve-related pain conditions
            </li>
            <li>
              <a href="/pain-symptoms/upper-back">Upper Back Pain</a> — Pain between shoulder blades,
              thoracic spine conditions, and the neck-shoulder connection
            </li>
          </ul>

          <h2>Not Sure Where to Start?</h2>
          <p>
            If you&apos;re unsure which category fits your symptoms, or your pain spans multiple
            areas,{" "}
            <a href="/consult">describe your symptoms to PainConsult AI</a> for a free,
            evidence-based assessment. The tool helps identify potential causes and guides you
            toward the right type of specialist.
          </p>

          <h2>Related Resources</h2>
          <ul>
            <li>
              <a href="/treatment-options">Treatment Options</a> — Overview of medications,
              interventional procedures, and therapies used in pain management
            </li>
            <li>
              <a href="/pain-management-guide">Pain Management Guide</a> — Comprehensive
              guide to understanding and managing chronic and acute pain
            </li>
            <li>
              <a href="/is-my-pain-serious">Is My Pain Serious?</a> — Learn which symptoms
              require urgent evaluation
            </li>
            <li>
              <a href="/what-type-of-pain-doctor">What Type of Pain Doctor Do I Need?</a>{" "}
              — Guide to navigating pain specialist types and referral pathways
            </li>
          </ul>

          <div className="not-prose mt-8">
            <MedicalReviewBadge />
          </div>
        </div>
      </main>
    </>
  );
}
