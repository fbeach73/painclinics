import { Metadata } from "next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | Pain Clinics",
  description:
    "Find answers to common questions about Pain Clinics, our pain management clinic directory, how to find clinics, submit listings, and more.",
};

const faqs = [
  {
    question: "How do I find a pain clinic near me?",
    answer:
      "Use our search feature on the homepage or browse by state. You can also use the 'Find Clinics Near Me' option which uses your location to find nearby pain management clinics. Our directory includes thousands of clinics across the United States.",
  },
  {
    question: "Are the clinics on your site verified?",
    answer:
      "We gather information from publicly available sources including clinic websites, medical directories, and healthcare databases. While we strive for accuracy, we recommend verifying information directly with the clinic before your visit. If you find any inaccurate information, please report it through our Contact page.",
  },
  {
    question: "How can I submit my clinic to be listed?",
    answer:
      "Visit our Submit a Clinic page to provide your clinic's information. We review submissions to ensure they meet our listing criteria. Basic listings are free, and we also offer enhanced listing options for clinics wanting greater visibility.",
  },
  {
    question: "Is the information on this site medical advice?",
    answer:
      "No, our directory is for informational purposes only. Pain Clinics does not provide medical advice, diagnosis, or treatment. Always consult with a qualified healthcare professional for medical concerns. Please read our Medical Disclaimer for more details.",
  },
  {
    question: "How do I report incorrect information?",
    answer:
      "If you notice any inaccurate clinic information, please contact us through our Contact page with the clinic name, the incorrect information, and the correct details. We appreciate user feedback to keep our directory accurate and up-to-date.",
  },
  {
    question: "What types of pain clinics are listed?",
    answer:
      "Our directory includes various types of pain management facilities including interventional pain clinics, chronic pain centers, physical therapy practices, spine centers, and multimodal pain treatment facilities. Each listing indicates the types of services offered.",
  },
  {
    question: "Do you recommend specific clinics?",
    answer:
      "We do not endorse or recommend specific clinics. Our directory provides information to help you find and research pain management options in your area. We encourage you to verify credentials, read reviews, and consult with your primary care physician when choosing a clinic.",
  },
  {
    question: "How often is the directory updated?",
    answer:
      "We regularly update our directory to add new clinics and verify existing information. However, clinic details like hours of operation, services offered, and contact information can change. We recommend calling ahead to confirm details before your visit.",
  },
  {
    question: "Can I leave reviews for clinics?",
    answer:
      "Currently, we do not have a review system on our platform. We recommend checking third-party review sites like Google Reviews, Healthgrades, or Vitals for patient feedback on specific clinics.",
  },
  {
    question: "Is Pain Clinics free to use?",
    answer:
      "Yes, using our pain clinic directory to search and find clinics is completely free for patients. We also offer free basic listings for clinics. Our revenue comes from enhanced listings and advertising partnerships.",
  },
  {
    question: "What should I bring to my first pain clinic appointment?",
    answer:
      "While we recommend confirming with your specific clinic, you should generally bring: photo ID, insurance cards, a list of current medications, previous medical records or imaging results related to your pain, and a list of questions for your doctor.",
  },
  {
    question: "How do I contact Pain Clinics?",
    answer:
      "You can reach us through our Contact page. We welcome feedback about our directory, questions about listings, and suggestions for improvement. For clinic-specific questions, please contact the clinic directly using the information in their listing.",
  },
];

export default function FAQPage() {
  return (
    <main id="main-content" className="container mx-auto py-8 md:py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Frequently Asked Questions</h1>
          <p className="text-lg text-foreground/70">
            Find answers to common questions about Pain Clinics and our pain
            management clinic directory.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Still Have Questions?</h2>
          <p className="text-foreground">
            If you couldn&apos;t find the answer you were looking for, please
            don&apos;t hesitate to{" "}
            <a href="/contact" className="text-primary hover:underline">contact us</a>. We&apos;re here to help.
          </p>
        </div>
      </div>
    </main>
  );
}
