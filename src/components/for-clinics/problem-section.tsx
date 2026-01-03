"use client";

import { Search, Shield, TrendingDown, Users } from "lucide-react";
import { motion } from "motion/react";

const problems = [
  {
    icon: Search,
    title: "Patients Can't Find You",
    description:
      "Patients are actively searching online for pain management, but your clinic isn't showing up where they're looking.",
  },
  {
    icon: Users,
    title: "Competitors Get Your Patients",
    description:
      "While you're invisible, other clinics are capturing the patients who could have been yours.",
  },
  {
    icon: Shield,
    title: "No Control Over Your Presence",
    description:
      "Your clinic information may be outdated, incomplete, or missing entirely from major directories.",
  },
  {
    icon: TrendingDown,
    title: "Missing Qualified Leads",
    description:
      "Every day, patients ready for treatment are choosing other providers because they can't discover you.",
  },
];

export function ProblemSection() {
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
            The Problem with Being Invisible
          </h2>
          <p className="mt-4 text-neutral-400 max-w-2xl mx-auto">
            If patients can&apos;t find you online, they&apos;ll find someone
            else.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {problems.map((problem, index) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="flex gap-4 p-6 rounded-xl border border-red-500/20 bg-red-950/10"
            >
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <problem.icon className="w-6 h-6 text-red-400" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {problem.title}
                </h3>
                <p className="mt-2 text-neutral-400 text-sm">
                  {problem.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
