import { ConsultChat } from "./consult-chat";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Online Pain Assessment | PainConsult AI — PainClinics.com",
  description:
    "Get an evidence-based pain assessment from PainConsult AI. Describe your symptoms, understand potential causes, and find pain management specialists near you — no appointment needed.",
  keywords: [
    "online pain assessment",
    "AI pain symptom checker",
    "find pain specialist",
    "pain assessment tool",
    "pain symptom checker",
    "PainConsult AI",
  ],
  robots: { index: true, follow: true },
  alternates: {
    canonical: "/consult",
  },
  openGraph: {
    title: "Online Pain Assessment | PainConsult AI — PainClinics.com",
    description:
      "Get an evidence-based pain assessment from PainConsult AI. Describe your symptoms, understand potential causes, and find pain management specialists near you — no appointment needed.",
    url: "/consult",
    type: "website",
    images: [
      {
        url: "/images/consult-plan-cover.png",
        width: 1024,
        height: 1536,
        alt: "PainClinics.com — Your Personalized Pain Management Plan",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Online Pain Assessment | PainConsult AI",
    description:
      "Describe your symptoms, understand potential causes, and find pain management specialists near you — no appointment needed.",
    images: ["/images/consult-plan-cover.png"],
  },
};

export default function ConsultPage() {
  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "PainConsult AI",
    description:
      "AI-powered pain assessment tool that helps you understand your symptoms, learn about potential causes and treatment options, and find pain management specialists near you.",
    applicationCategory: "HealthApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    publisher: {
      "@type": "Organization",
      name: "PainClinics.com",
      url: "https://painclinics.com",
    },
    url: "https://painclinics.com/consult",
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How does an online pain assessment work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "An online pain assessment guides you through a series of questions about the location, intensity, duration, and character of your pain, as well as any accompanying symptoms and relevant medical history. PainConsult AI uses this information to provide an evidence-based summary of potential causes and relevant treatment options. The assessment typically takes 3 to 5 minutes to complete and requires no registration.",
        },
      },
      {
        "@type": "Question",
        name: "Is PainConsult AI a substitute for seeing a doctor?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. PainConsult AI is an educational tool designed to help you better understand your symptoms and prepare for conversations with healthcare providers — it is not a diagnostic service and cannot replace a medical evaluation. If you are experiencing severe, sudden, or worsening pain, or pain accompanied by concerning symptoms such as chest tightness, numbness, or loss of bladder control, seek medical attention promptly.",
        },
      },
      {
        "@type": "Question",
        name: "What information do I need to provide?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You will be asked to describe where your pain is located, how long you have had it, what it feels like (sharp, burning, aching, etc.), what makes it better or worse, and whether you have any other symptoms. You do not need medical records or test results to complete the assessment, though having that information available can help you get more relevant guidance.",
        },
      },
      {
        "@type": "Question",
        name: "How long does the pain assessment take?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Most users complete the PainConsult AI assessment in 3 to 5 minutes. The tool asks a focused set of clinically relevant questions and then immediately generates your personalized summary — there is no waiting period and no appointment required. You can also save or email your results to share with your doctor.",
        },
      },
      {
        "@type": "Question",
        name: "Is my health information kept private?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Your responses are used only to generate your assessment and are not sold to third parties or shared with insurers. If you choose to provide your email address to receive your results, that information is stored securely and used only to deliver your summary and relevant clinic recommendations. You can complete the assessment without providing any personal information.",
        },
      },
    ],
  };

  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Use PainConsult AI for an Online Pain Assessment",
    description:
      "Follow these steps to get your evidence-based pain assessment and find matching pain management specialists near you.",
    totalTime: "PT5M",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Select your pain location",
        text: "Choose the area of your body where you are experiencing pain. PainConsult AI covers common pain locations including the back, neck, joints, head, and extremities, and tailors follow-up questions based on your selection.",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Answer questions about your symptoms",
        text: "Describe your pain in detail — how long you have had it, what it feels like, what makes it better or worse, and any accompanying symptoms. These clinically relevant questions help the AI understand the full picture of your pain.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Receive your evidence-based assessment",
        text: "PainConsult AI analyzes your responses and generates a personalized summary covering potential causes, red flag symptoms to watch for, and an overview of treatment approaches that pain management specialists commonly use for your symptom pattern.",
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Find matching pain clinics near you",
        text: "Based on your assessment, PainConsult AI surfaces pain management specialists in your area from the PainClinics.com directory of 5,000+ verified clinics. Filter by location, specialty, and insurance to find the right provider.",
      },
      {
        "@type": "HowToStep",
        position: 5,
        name: "Get your summary emailed or download a detailed plan",
        text: "Save your assessment results by entering your email to receive a full summary you can share with your doctor, or download a detailed care plan PDF. Your results include your symptom overview, potential diagnoses to discuss, and a list of questions to ask your pain specialist.",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <ConsultChat />
    </>
  );
}
