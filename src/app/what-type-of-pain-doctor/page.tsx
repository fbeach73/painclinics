import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MedicalReviewBadge } from "@/components/medical-review-badge";

export const metadata: Metadata = {
  title: "What Type of Pain Doctor Do I Need? Specialist Guide | PainClinics.com",
  description:
    "Not sure which pain doctor to see? Compare pain management specialists, orthopedic surgeons, neurologists, and rheumatologists. Find the right specialist for your condition.",
  keywords: [
    "what type of doctor for back pain",
    "pain management vs orthopedic",
    "do I need a pain specialist",
    "what kind of doctor treats nerve pain",
    "pain management specialist",
    "neurologist for pain",
    "rheumatologist vs pain management",
    "physiatrist",
  ],
  alternates: {
    canonical: "/what-type-of-pain-doctor",
  },
  openGraph: {
    title: "What Type of Pain Doctor Do I Need? Specialist Guide",
    description:
      "Compare pain management specialists, orthopedic surgeons, neurologists, and rheumatologists to find the right doctor for your pain condition.",
    url: "/what-type-of-pain-doctor",
    type: "article",
  },
  twitter: {
    card: "summary",
    title: "What Type of Pain Doctor Do I Need?",
    description:
      "Compare pain specialists, orthopedic surgeons, neurologists, and rheumatologists to find the right doctor for your condition.",
  },
};

export default function WhatTypeOfPainDoctorPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "What Type of Pain Doctor Do I Need? Specialist Guide",
    description:
      "A guide comparing pain management specialists, orthopedic surgeons, neurologists, rheumatologists, and physiatrists to help patients find the right doctor for their condition.",
    url: "https://painclinics.com/what-type-of-pain-doctor",
    about: [
      {
        "@type": "MedicalSpecialty",
        name: "Pain Management",
      },
      {
        "@type": "MedicalSpecialty",
        name: "Orthopedic Surgery",
      },
      {
        "@type": "MedicalSpecialty",
        name: "Neurology",
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
        name: "What Type of Pain Doctor Do I Need?",
        item: "https://painclinics.com/what-type-of-pain-doctor",
      },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is the difference between a pain management doctor and an orthopedic surgeon?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "A pain management doctor (also called a pain specialist) focuses on diagnosing and treating pain itself using medications, injections, nerve blocks, and other non-surgical procedures. An orthopedic surgeon specializes in the musculoskeletal system — bones, joints, ligaments, and tendons — and performs surgical procedures when structural problems are the source of pain. Many patients see both: an orthopedic surgeon to evaluate whether surgery is needed and a pain management specialist to manage pain before or instead of surgery.",
        },
      },
      {
        "@type": "Question",
        name: "Do I need a referral to see a pain specialist?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "It depends on your insurance plan. Many insurance plans require a referral from your primary care physician before seeing a pain specialist. Even if a referral is not required, starting with your primary care doctor is often helpful — they can review your history, order initial imaging, and help determine which type of specialist is most appropriate for your condition.",
        },
      },
      {
        "@type": "Question",
        name: "What kind of doctor should I see for nerve pain?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "For nerve pain (neuropathy), numbness, tingling, or burning sensations, a neurologist or pain management specialist are the most appropriate starting points. Neurologists can diagnose the type and cause of nerve pain through tests like nerve conduction studies and EMG. Pain management specialists can provide targeted treatments such as nerve blocks and spinal cord stimulation. If the nerve pain is related to spine compression, an orthopedic surgeon or neurosurgeon may also be involved.",
        },
      },
      {
        "@type": "Question",
        name: "When should I see a pain management doctor vs. my primary care physician?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Your primary care physician (PCP) is a good first step for most new pain concerns. Consider seeing a pain management specialist if your pain has lasted more than three months, is not well controlled with current treatments, significantly interferes with daily activities or sleep, or if you want to explore interventional options like nerve blocks or spinal injections. Your PCP can also coordinate a referral to the most appropriate specialist based on your specific condition.",
        },
      },
      {
        "@type": "Question",
        name: "Can PainConsult AI help me figure out which doctor to see?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. PainConsult AI asks about your symptoms, pain location, duration, and history, then helps narrow down which type of specialist is most likely to be the right fit for your situation. It takes about 2 minutes and provides personalized guidance to help you have a more informed conversation with your doctor. Visit painclinics.com/consult to get started.",
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
          <h1>What Type of Pain Doctor Do I Need?</h1>
          <p className="lead text-foreground/70">
            Pain can come from many different sources &mdash; nerves, joints,
            muscles, or the immune system. The type of specialist you need
            depends on what is causing your pain. This guide breaks down the
            main types of pain doctors and helps you figure out who to see first.
          </p>

          <Alert variant="warning" className="not-prose my-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This information is for educational purposes only and is not a
              substitute for professional medical advice. Talk to your primary
              care physician about which specialist is right for your specific
              situation.
            </AlertDescription>
          </Alert>

          <h2>Types of Pain Doctors</h2>
          <p>
            There is no single &ldquo;pain doctor.&rdquo; Several medical
            specialties treat pain, each with a different focus and skill set.
            Depending on the source and nature of your pain, one or more of
            these specialists may be part of your care team. Understanding what
            each one does can help you ask better questions and navigate the
            healthcare system more effectively.
          </p>

          <h3>Pain Management Specialist</h3>
          <p>
            A pain management specialist (also called a pain medicine physician)
            focuses specifically on diagnosing and treating pain. These doctors
            complete residency training in fields like anesthesiology, physical
            medicine and rehabilitation, or neurology, followed by a fellowship
            in pain medicine. Many are board-certified through the American Board
            of Anesthesiology or the American Board of Physical Medicine and
            Rehabilitation.
          </p>
          <p>
            Pain management specialists treat a wide range of conditions using
            medications, <Link href="/treatment-options/interventional-pain-management">interventional procedures</Link>{" "}
            (such as nerve blocks and spinal cord stimulation),{" "}
            <Link href="/treatment-options/pain-management-injections">injection therapies</Link>,
            and coordinated care with physical therapists and psychologists.
          </p>
          <p>
            <strong>Best for:</strong> Chronic pain that has not responded to
            conservative treatment, complex pain conditions, patients who want
            to explore non-surgical options, or anyone needing ongoing pain
            management with procedures.
          </p>

          <h3>Orthopedic Surgeon</h3>
          <p>
            Orthopedic surgeons specialize in the musculoskeletal system
            &mdash; bones, joints, cartilage, ligaments, tendons, and muscles.
            Despite the title, orthopedic surgeons do not always recommend
            surgery. Many offer conservative treatments first, such as physical
            therapy, corticosteroid injections, and bracing. Surgery is
            considered when structural damage is severe enough that non-surgical
            options are unlikely to provide meaningful relief.
          </p>
          <p>
            <strong>Best for:</strong> Joint pain (knee, hip, shoulder),
            fractures, sports injuries, herniated discs with structural
            compression, spinal stenosis, and conditions where surgical repair
            may be the most effective option.
          </p>

          <h3>Neurologist</h3>
          <p>
            Neurologists specialize in conditions of the nervous system &mdash;
            the brain, spinal cord, and peripheral nerves. They are experts in
            diagnosing nerve disorders using tests like nerve conduction studies
            (NCS) and electromyography (EMG), which measure how well electrical
            signals travel through nerves and muscles.
          </p>
          <p>
            When pain is caused by nerve damage, compression, or dysfunction,
            a neurologist can identify the specific nerve involved and the
            underlying cause. They also manage conditions like migraines,
            multiple sclerosis, and epilepsy.
          </p>
          <p>
            <strong>Best for:</strong> Neuropathy, numbness and tingling,
            burning pain, migraines, nerve disorders, weakness, and any pain
            that may be rooted in the nervous system.
          </p>

          <h3>Rheumatologist</h3>
          <p>
            Rheumatologists specialize in autoimmune and inflammatory conditions
            that affect the joints, muscles, and connective tissue. Many
            rheumatologic diseases cause significant pain as a primary symptom.
            Rheumatologists can diagnose these conditions through blood tests,
            imaging, and joint fluid analysis, then manage them with disease-
            modifying medications.
          </p>
          <p>
            <strong>Best for:</strong> Rheumatoid arthritis, lupus,
            fibromyalgia, gout, psoriatic arthritis, ankylosing spondylitis,
            Sj&ouml;gren&rsquo;s syndrome, and other inflammatory or autoimmune
            conditions that cause pain.
          </p>

          <h3>Physical Medicine &amp; Rehabilitation (PM&amp;R)</h3>
          <p>
            Physicians who specialize in physical medicine and rehabilitation
            are called physiatrists. They focus on restoring function and
            reducing pain in patients with musculoskeletal injuries, spine
            conditions, and neurological disorders. Physiatrists take a
            non-surgical approach, using physical therapy, exercise programs,
            injections, and assistive devices to improve daily functioning.
          </p>
          <p>
            PM&amp;R physicians often work closely with physical therapists,
            occupational therapists, and other rehabilitation professionals to
            develop coordinated care plans.
          </p>
          <p>
            <strong>Best for:</strong> Rehabilitation after injury or surgery,
            non-surgical musculoskeletal pain, spine conditions, sports injuries,
            and patients whose primary goal is restoring physical function.
          </p>

          <h2>Which Specialist Is Right for You?</h2>
          <p>
            The right specialist depends on your symptoms, diagnosis, and
            treatment goals. Here is a quick reference by pain type:
          </p>
          <ul>
            <li>
              <strong>Back or neck pain:</strong> Start with a pain management
              specialist or PM&amp;R physician. If structural damage (like a
              herniated disc with nerve compression) is suspected, an orthopedic
              surgeon or neurosurgeon may also evaluate you.
            </li>
            <li>
              <strong>Joint pain (knee, hip, shoulder):</strong> An orthopedic
              surgeon is typically the first choice. If inflammation or
              autoimmune disease is suspected, a rheumatologist may be more
              appropriate.
            </li>
            <li>
              <strong>Nerve pain, numbness, or tingling:</strong> A neurologist
              can diagnose nerve damage and identify the cause. A pain management
              specialist can provide targeted treatments once the diagnosis is
              established.
            </li>
            <li>
              <strong>Migraines or chronic headaches:</strong> A neurologist
              specializes in headache disorders and has the most targeted
              treatment options.
            </li>
            <li>
              <strong>Inflammatory or autoimmune conditions:</strong> A
              rheumatologist is the right specialist for conditions like
              rheumatoid arthritis, lupus, or fibromyalgia.
            </li>
            <li>
              <strong>Chronic pain that has not responded to treatment:</strong>{" "}
              A pain management specialist can offer a comprehensive evaluation
              and a broader range of interventional options. Learn more in our{" "}
              <Link href="/treatment-options/chronic-pain-management">
                chronic pain management guide
              </Link>.
            </li>
          </ul>
          <p>
            If you are unsure where to start, your primary care physician (PCP)
            is often the best first step. They can review your history, order
            initial imaging, and refer you to the most appropriate specialist.
            You can also browse our{" "}
            <Link href="/pain-management-guide">pain management guide</Link>{" "}
            for a broader overview of{" "}
            <Link href="/treatment-options">treatment options</Link>.
          </p>

          <h2>Not Sure? Let AI Help You Decide</h2>
          <p>
            Figuring out which type of doctor to see can be confusing,
            especially when your symptoms overlap multiple specialties.{" "}
            <Link href="/consult">PainConsult AI</Link> asks about your
            symptoms &mdash; pain location, duration, character, and history
            &mdash; and helps narrow down which type of specialist is most
            likely to be the right fit for your situation. The process takes
            about 2 minutes and gives you personalized guidance you can bring
            to your next doctor&rsquo;s appointment.
          </p>
          <p>
            PainConsult AI is not a diagnostic tool and does not replace a
            physician evaluation, but it can help you ask better questions and
            walk into your first specialist visit more prepared.{" "}
            <Link href="/consult">Try PainConsult AI &rarr;</Link>
          </p>

          <h2>Find a Pain Specialist Near You</h2>
          <p>
            Once you know which type of specialist you need, use our{" "}
            <Link href="/clinics">clinic directory</Link> to find board-certified
            pain management physicians near you. With over 5,000 clinics listed
            across all 50 states, you can search by location, read patient
            reviews, and compare providers. Browse by{" "}
            <Link href="/treatment-options">treatment type</Link> to learn more
            about specific procedures before your visit.
          </p>

          <div className="not-prose mt-8">
            <MedicalReviewBadge />
          </div>
        </div>
      </main>
    </>
  );
}
