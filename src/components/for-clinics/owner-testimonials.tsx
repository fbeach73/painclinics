"use client";

import { motion } from "motion/react";

import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";

const testimonials = [
  {
    quote:
      "Since claiming our listing on Pain Clinics, patient inquiries have increased significantly. The premium placement has been a game-changer for our practice.",
    name: "Dr. Sarah Mitchell",
    title: "Pain Management Specialist, Phoenix AZ",
  },
  {
    quote:
      "The verification process was simple and quick. Within two days, we had full control of our listing and could update our services and photos.",
    name: "James Thompson",
    title: "Practice Manager, Austin TX",
  },
  {
    quote:
      "Premium placement has been worth every penny. We're now the first result when patients search for pain management in our area.",
    name: "Dr. Maria Garcia",
    title: "Interventional Pain Physician, Miami FL",
  },
  {
    quote:
      "Finally, we have control over how our practice appears online. The verified badge gives patients confidence that we're legitimate.",
    name: "Dr. David Lee",
    title: "Pain Clinic Director, Seattle WA",
  },
];

export function OwnerTestimonials() {
  return (
    <section className="bg-slate-950 py-20">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Trusted by Clinic Owners
          </h2>
          <p className="mt-4 text-neutral-400 max-w-2xl mx-auto">
            See what other pain management professionals are saying about their
            experience.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <InfiniteMovingCards
            items={testimonials}
            direction="left"
            speed="slow"
            pauseOnHover
            className="mx-auto"
          />
        </motion.div>
      </div>
    </section>
  );
}
