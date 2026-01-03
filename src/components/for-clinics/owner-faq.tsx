"use client";

import { motion } from "motion/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqItems = [
  {
    question: "Is my clinic already listed?",
    answer:
      "Most likely, yes! We've pre-loaded over 5,000 pain management clinics across all 50 states. Search for your clinic name or address to find your listing.",
  },
  {
    question: "How long does verification take?",
    answer:
      "Our team typically reviews and approves claim requests within 1-2 business days. You'll receive an email notification once your claim is approved.",
  },
  {
    question: "What if I just want the free listing?",
    answer:
      "That's perfectly fine! Claiming your free listing gives you a verified badge and the ability to update your basic information. You can always upgrade later.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes, absolutely. There are no long-term contracts. You can cancel your Basic or Premium subscription at any time, and you'll retain access until the end of your billing period.",
  },
  {
    question: "How do patients find me?",
    answer:
      "Our directory is SEO-optimized and ranks well for local pain management searches. Patients search by location, treatment type, and insurance accepted. Premium members get top placement in search results.",
  },
];

export function OwnerFAQ() {
  return (
    <section className="bg-slate-900 py-20">
      <div className="mx-auto max-w-3xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-neutral-400">
            Everything you need to know about claiming your clinic listing.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border-slate-700"
              >
                <AccordionTrigger className="text-white hover:text-cyan-400 hover:no-underline text-left text-base">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-neutral-400">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
