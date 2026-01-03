"use client";

import { Search, Shield, Edit, TrendingUp } from "lucide-react";
import { motion } from "motion/react";

const steps = [
  {
    number: 1,
    title: "Search",
    description:
      "Find your clinic in our directory of 5,000+ pain management practices.",
    icon: <Search className="h-8 w-8" />,
    color: "cyan",
  },
  {
    number: 2,
    title: "Claim",
    description:
      "Verify you're the owner. Our team reviews claims within 1-2 business days.",
    icon: <Shield className="h-8 w-8" />,
    color: "green",
  },
  {
    number: 3,
    title: "Customize",
    description:
      "Update your info, add photos, select your plan, and make your listing shine.",
    icon: <Edit className="h-8 w-8" />,
    color: "yellow",
  },
  {
    number: 4,
    title: "Grow",
    description:
      "Start receiving patient inquiries from people actively seeking pain relief.",
    icon: <TrendingUp className="h-8 w-8" />,
    color: "purple",
  },
];

const colorStyles = {
  cyan: {
    bg: "bg-cyan-500/20",
    border: "border-cyan-500/30",
    text: "text-cyan-400",
    number: "bg-cyan-500/30 text-cyan-300",
  },
  green: {
    bg: "bg-green-500/20",
    border: "border-green-500/30",
    text: "text-green-400",
    number: "bg-green-500/30 text-green-300",
  },
  yellow: {
    bg: "bg-yellow-500/20",
    border: "border-yellow-500/30",
    text: "text-yellow-400",
    number: "bg-yellow-500/30 text-yellow-300",
  },
  purple: {
    bg: "bg-purple-500/20",
    border: "border-purple-500/30",
    text: "text-purple-400",
    number: "bg-purple-500/30 text-purple-300",
  },
};

export function HowItWorks() {
  return (
    <section className="bg-slate-950 py-20">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            How It Works
          </h2>
          <p className="mt-4 text-neutral-400 max-w-2xl mx-auto">
            Get your clinic claimed and visible in just four simple steps.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => {
            const colors =
              colorStyles[step.color as keyof typeof colorStyles];
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative rounded-xl ${colors.bg} border ${colors.border} p-6`}
              >
                <div
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${colors.number} font-bold text-lg mb-4`}
                >
                  {step.number}
                </div>
                <div className={`${colors.text} mb-3`}>{step.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-neutral-400 text-sm">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
