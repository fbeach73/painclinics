import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MedicalReviewBadge } from "@/components/medical-review-badge";

export const metadata: Metadata = {
  title: "Headache & Migraine Symptoms: Pain at Base of Skull, Types & Warning Signs",
  description:
    "Understand headache and migraine symptoms including pain at the base of the skull, cervicogenic headaches, and occipital neuralgia. Learn warning signs and when to see a specialist.",
  keywords: [
    "headache symptoms",
    "migraine symptoms",
    "pain in back of head at base of skull",
    "cervicogenic headache symptoms",
    "occipital neuralgia symptoms",
    "types of headaches",
    "when to worry about headaches",
    "chronic headache causes",
  ],
  alternates: {
    canonical: "/pain-symptoms/headache-migraine",
  },
  openGraph: {
    title: "Headache & Migraine: Pain at Base of Skull, Types & Warning Signs",
    description:
      "Headache and migraine symptoms including pain at the base of the skull, cervicogenic headaches, and occipital neuralgia.",
    url: "/pain-symptoms/headache-migraine",
    type: "article",
  },
  twitter: {
    card: "summary",
    title: "Headache & Migraine: Types, Base of Skull Pain & Warning Signs",
    description:
      "Headache types, pain at the base of the skull, cervicogenic headache symptoms, and when to worry.",
  },
};

export default function HeadacheMigrainePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Headache & Migraine Symptoms: Pain at Base of Skull, Types & Warning Signs",
    description:
      "Comprehensive guide to headache and migraine symptoms including pain at the base of the skull, cervicogenic headaches, occipital neuralgia, types, triggers, and warning signs.",
    url: "https://painclinics.com/pain-symptoms/headache-migraine",
    about: [
      {
        "@type": "MedicalCondition",
        name: "Headache",
      },
      {
        "@type": "MedicalCondition",
        name: "Migraine",
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
        name: "Headache and Migraine",
        item: "https://painclinics.com/pain-symptoms/headache-migraine",
      },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is the difference between a migraine and a tension headache?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Tension headaches typically cause a dull, steady, band-like pressure on both sides of the head. They do not usually cause nausea or sensitivity to light and sound, and they do not worsen with routine physical activity. Migraines, by contrast, tend to cause moderate-to-severe throbbing pain, often on one side of the head, and are commonly associated with nausea, vomiting, and significant sensitivity to light and sound. Migraines are frequently worsened by movement and can last four to 72 hours without treatment.",
        },
      },
      {
        "@type": "Question",
        name: "What triggers migraines?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Common migraine triggers include hormonal changes (especially in women around menstruation), stress, irregular sleep patterns, skipping meals, dehydration, bright or flickering lights, strong odors, weather changes, and certain foods or drinks. Triggers are highly individual — what affects one person may not affect another. Keeping a headache diary to track potential triggers, pain patterns, and associated symptoms is one of the most effective ways to identify personal triggers and improve management.",
        },
      },
      {
        "@type": "Question",
        name: "When is a headache a medical emergency?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Call emergency services or go to an emergency room immediately if you experience: a sudden, severe headache that feels like the worst of your life (thunderclap headache); headache with fever and stiff neck; headache after a head injury; headache with confusion, slurred speech, vision changes, or weakness on one side; or headache with progressive worsening over days. These symptoms may indicate a serious condition such as a subarachnoid hemorrhage, meningitis, or stroke.",
        },
      },
      {
        "@type": "Question",
        name: "What is chronic daily headache?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Chronic daily headache is defined as headache occurring on 15 or more days per month for at least three months. It affects approximately 3-5% of the general population and can result from transformed migraine, chronic tension-type headache, or medication overuse headache. Medication overuse headache — sometimes called rebound headache — occurs when pain relievers are taken too frequently, causing the nervous system to become more sensitized to pain over time. Treating this pattern typically requires medically supervised withdrawal from overused medications.",
        },
      },
      {
        "@type": "Question",
        name: "What causes pain in the back of the head at the base of the skull?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Pain at the base of the skull is most commonly caused by tension headaches, cervicogenic headaches (originating from neck problems), or occipital neuralgia (irritation of the occipital nerves). Muscle tension in the upper neck and suboccipital muscles from poor posture or prolonged screen use is a very common contributor. Cervicogenic headache is triggered by structural issues in the cervical spine and is treated differently from migraines. If the pain is sharp, shooting, or electric rather than dull and aching, occipital neuralgia may be the cause.",
        },
      },
      {
        "@type": "Question",
        name: "What are cervicogenic headache symptoms?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Cervicogenic headaches start with pain at the base of the skull or upper neck that radiates to the forehead, temple, or area around the eye — usually on one side. Key features that distinguish them from migraines include: pain triggered by neck movement or sustained postures, reduced neck range of motion, and tenderness in the upper cervical spine. They do not typically cause nausea or light sensitivity. Treatment targets the cervical spine through physical therapy, nerve blocks, or manual therapy rather than standard headache medications.",
        },
      },
      {
        "@type": "Question",
        name: "When should I see a specialist for headaches?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "See a headache specialist if your headaches occur more than four days per month and interfere with daily activities, if you are using over-the-counter pain relievers more than two to three times per week, if your headache pattern has changed recently, if standard treatments have not provided adequate relief, or if headaches are significantly affecting your quality of life. A neurologist or headache specialist can evaluate your headache type and recommend preventive and abortive treatment strategies.",
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
          <h1>Headache and Migraine Symptoms</h1>
          <p className="lead text-foreground/70">
            Headaches are among the most common pain conditions in the world.
            Most are not dangerous, but some types &mdash; particularly migraines
            and chronic headaches &mdash; can be debilitating and require
            specialized care to manage effectively.
          </p>

          <Alert variant="warning" className="not-prose my-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This information is for educational purposes only. Certain
              headache symptoms require emergency evaluation. If you experience
              a sudden, severe headache unlike any before, headache with fever
              and stiff neck, or headache with neurological symptoms, seek
              emergency care immediately.
            </AlertDescription>
          </Alert>

          <h2>Types of Headaches</h2>
          <p>
            There are over 150 recognized types of headaches, but the vast
            majority of people experience one of a small number of primary
            headache disorders. Understanding which type you have is the first
            step toward better management.
          </p>

          <h3>Tension-Type Headache</h3>
          <p>
            Tension-type headaches are the most common headache disorder,
            affecting up to 78% of people at some point in their lives. They
            cause a dull, pressing, band-like pain that affects both sides of
            the head. Unlike migraines, tension headaches are not typically
            associated with nausea or sensitivity to light and sound, and they
            do not worsen with normal physical activity. They can last 30
            minutes to several hours. Stress, poor posture, eye strain, and
            dehydration are common contributors.
          </p>

          <h3>Migraine</h3>
          <p>
            Migraines are a neurological condition that causes moderate to
            severe throbbing pain, most often on one side of the head. They
            are typically accompanied by nausea, vomiting, and pronounced
            sensitivity to light (photophobia) and sound (phonophobia). Most
            people with migraines find that physical activity makes the pain
            worse. An untreated migraine attack typically lasts 4 to 72 hours.
          </p>
          <p>
            About one in three people with migraines experience an{" "}
            <strong>aura</strong> &mdash; a set of neurological symptoms that
            develop gradually before the headache begins. Aura symptoms include
            visual disturbances (flashing lights, zigzag lines, blind spots),
            tingling or numbness in the face or hands, difficulty speaking, or
            a feeling of confusion. Aura usually lasts 20 to 60 minutes.
          </p>

          <h3>Cluster Headache</h3>
          <p>
            Cluster headaches cause extremely severe, stabbing pain centered
            around or behind one eye. They occur in clusters &mdash; multiple
            attacks per day for weeks or months &mdash; followed by remission
            periods that may last months or years. Each individual attack is
            relatively short, lasting 15 minutes to three hours, but the
            intensity is often described as one of the most severe pains a
            person can experience. Cluster headaches are more common in men
            and are often accompanied by eye redness, tearing, nasal
            congestion, and restlessness on the affected side.
          </p>

          <h3>Cervicogenic Headache</h3>
          <p>
            Cervicogenic headaches originate from structural problems in the
            neck, particularly the upper cervical spine. Pain typically starts
            at the base of the skull or upper neck and radiates to the back of
            the head, forehead, or around the eye. Head and neck movement
            often triggers or worsens the pain. This type of headache is
            distinct from migraines and tension headaches and requires
            treatment directed at the cervical spine rather than standard
            headache medications.
          </p>

          <h3>Medication Overuse Headache</h3>
          <p>
            Medication overuse headache &mdash; also called rebound headache
            &mdash; develops when pain-relieving medications are taken too
            frequently. Using over-the-counter or prescription headache
            treatments on more than two to three days per week can cause the
            nervous system to adapt in a way that makes headaches more frequent
            and more difficult to treat. This is a common and underrecognized
            cause of chronic daily headache that requires careful medical
            management to resolve.
          </p>

          <h2>Migraine vs. Tension Headache: Key Differences</h2>
          <p>
            These two headache types are often confused, but the distinction
            matters for treatment:
          </p>
          <ul>
            <li>
              <strong>Location:</strong> Tension headaches usually affect
              both sides of the head; migraines typically affect one side
              (though not always)
            </li>
            <li>
              <strong>Quality:</strong> Tension headaches feel like pressure
              or squeezing; migraines are throbbing or pulsating
            </li>
            <li>
              <strong>Severity:</strong> Tension headaches are mild to
              moderate; migraines are moderate to severe
            </li>
            <li>
              <strong>Associated symptoms:</strong> Nausea, vomiting, and
              sensitivity to light and sound are hallmarks of migraine, not
              tension headache
            </li>
            <li>
              <strong>Activity:</strong> Migraines worsen with routine
              physical activity; tension headaches typically do not
            </li>
          </ul>

          <h2>Warning Signs That Require Emergency Evaluation</h2>
          <p>
            The following headache symptoms require immediate emergency care.
            Call emergency services or go to the nearest emergency room:
          </p>
          <ul>
            <li>
              <strong>Thunderclap headache</strong> &mdash; a sudden,
              explosive headache that reaches maximum intensity within seconds
              to a minute (&ldquo;the worst headache of my life&rdquo;). This
              pattern can indicate a subarachnoid hemorrhage, a life-threatening
              bleed in the brain.
            </li>
            <li>
              <strong>Headache with fever and stiff neck</strong> &mdash; may
              indicate meningitis or encephalitis
            </li>
            <li>
              <strong>Headache with neurological symptoms</strong> &mdash;
              confusion, slurred speech, double vision, weakness or numbness
              on one side of the face or body, or difficulty walking may
              indicate stroke
            </li>
            <li>
              <strong>Headache after head injury</strong> &mdash; especially
              if worsening over hours, or accompanied by loss of consciousness,
              memory gaps, or repeated vomiting
            </li>
            <li>
              <strong>New severe headache over age 50</strong> or in someone
              with cancer or a compromised immune system
            </li>
            <li>
              <strong>Progressively worsening headache</strong> over days or
              weeks without any relieving factors
            </li>
          </ul>

          <h2>Chronic Daily Headache</h2>
          <p>
            When headaches occur on 15 or more days per month for at least
            three months, they are classified as chronic daily headache. This
            pattern affects millions of people and is often underdiagnosed.
            Causes include transformed migraine (migraine that has become more
            frequent over time), chronic tension-type headache, and medication
            overuse headache.
          </p>
          <p>
            People with chronic daily headache often find that standard
            over-the-counter treatments are no longer effective, and that
            taking more medication makes the pattern worse. Specialist
            evaluation is particularly important in this group because
            treatment typically involves a combination of preventive
            strategies, behavioral approaches, and careful medication
            management.
          </p>

          <h2>When to See a Headache Specialist</h2>
          <p>
            Consider seeing a neurologist, headache specialist, or pain
            management provider if:
          </p>
          <ul>
            <li>
              Headaches occur more than four days per month and affect your
              ability to function
            </li>
            <li>
              You are using pain relievers more than two to three days per
              week for headaches
            </li>
            <li>
              Standard treatments have not provided adequate relief
            </li>
            <li>
              Your headache pattern has recently changed in character, location,
              frequency, or severity
            </li>
            <li>
              Headaches are significantly affecting your work, relationships,
              or quality of life
            </li>
            <li>
              You have migraines with aura and want to discuss preventive
              options
            </li>
          </ul>

          <h2>Treatment Options for Headaches and Migraines</h2>
          <p>
            Headache treatment generally falls into two categories: acute
            (abortive) treatments taken at the start of an attack, and
            preventive treatments taken regularly to reduce attack frequency.
            A specialist will help determine which approach &mdash; or
            combination &mdash; is right for you.
          </p>
          <ul>
            <li>
              <strong>Lifestyle and trigger management:</strong> Identifying
              and reducing personal triggers (sleep consistency, hydration,
              meal timing, stress) can significantly reduce attack frequency
              for many people
            </li>
            <li>
              <strong>Behavioral therapies:</strong> Biofeedback, cognitive
              behavioral therapy, and relaxation techniques have good evidence
              for migraine prevention and are often recommended alongside
              medical treatment
            </li>
            <li>
              <strong>
                <Link href="/treatment-options/interventional-pain-management">
                  Interventional procedures
                </Link>:
              </strong>{" "}
              Nerve blocks (including occipital nerve blocks) and
              trigger point injections for refractory migraines and
              cervicogenic headaches
            </li>
            <li>
              <strong>
                <Link href="/treatment-options/chronic-pain-management">
                  Multidisciplinary pain management
                </Link>:
              </strong>{" "}
              For chronic daily headache, a comprehensive team approach
              addressing physical, psychological, and lifestyle factors
              is often most effective
            </li>
          </ul>

          <h2>Get a Personalized Headache Assessment</h2>
          <p>
            If headaches are affecting your daily life, our{" "}
            <Link href="/consult">free pain consultation tool</Link> can help
            you organize your symptoms &mdash; including frequency, severity,
            and associated features &mdash; to create a summary for your
            provider. A clear symptom picture speeds up diagnosis and helps
            you get to the right treatment faster.
          </p>

          <h2>Related Symptom Guides</h2>
          <ul>
            <li>
              <Link href="/pain-symptoms/nerve-pain">Nerve Pain</Link>{" "}
              &mdash; When head and facial pain involves nerve pathways
            </li>
            <li>
              <Link href="/pain-symptoms/lower-back">Lower Back Pain</Link>{" "}
              &mdash; Understanding other chronic pain conditions that often
              co-occur with migraines
            </li>
            <li>
              <Link href="/treatment-options/chronic-pain-management">
                Chronic Pain Management
              </Link>{" "}
              &mdash; Multidisciplinary approaches for frequent headache
            </li>
            <li>
              <Link href="/treatment-options/interventional-pain-management">
                Interventional Pain Management
              </Link>{" "}
              &mdash; Nerve blocks and other procedures for headache
            </li>
          </ul>

          <h2>Find a Headache Specialist Near You</h2>
          <p>
            Use our{" "}
            <Link href="/clinics">clinic directory</Link> to find pain
            management and neurology specialists near you who treat migraines
            and chronic headache conditions. With over 5,000 clinics listed
            across all 50 states, you can search by location and read patient
            reviews to find the right provider.
          </p>

          <div className="not-prose mt-8">
            <MedicalReviewBadge />
          </div>
        </div>
      </main>
    </>
  );
}
