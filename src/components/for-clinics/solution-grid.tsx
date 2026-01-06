"use client";

import { BadgeCheck, MapPin, Pencil, TrendingUp } from "lucide-react";
import { motion } from "motion/react";

import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";

const solutions = [
  {
    title: "Already Listed",
    description:
      "Your clinic is probably already in our database. We've done the hard work of compiling pain management clinics across all 50 states.",
    icon: <MapPin className="h-6 w-6 text-emerald-400" />,
    className: "md:col-span-2",
    header: (
      <div className="flex h-full min-h-[8rem] w-full flex-col items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20">
        <span className="text-5xl font-bold text-emerald-400">5,000+</span>
        <span className="text-sm text-emerald-300/70 mt-1">Clinics & Growing</span>
      </div>
    ),
  },
  {
    title: "Get Verified",
    description:
      "Claim your listing and receive a verified badge that shows patients your clinic is legitimate and actively managed.",
    icon: <BadgeCheck className="h-6 w-6 text-emerald-400" />,
    className: "md:col-span-1",
    header: (
      <div className="flex h-full min-h-[8rem] w-full items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20">
        <BadgeCheck className="h-16 w-16 text-emerald-400" />
      </div>
    ),
  },
  {
    title: "Take Control",
    description:
      "Update your hours, services, photos, and contact info. Make sure patients see accurate, up-to-date information.",
    icon: <Pencil className="h-6 w-6 text-emerald-400" />,
    className: "md:col-span-1",
    header: (
      <div className="flex h-full min-h-[8rem] w-full items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20">
        <Pencil className="h-16 w-16 text-emerald-400" />
      </div>
    ),
  },
  {
    title: "Premium Visibility",
    description:
      "Upgrade to get featured placement at the top of search results, homepage features, and priority support. Your listing page goes ad-free and distraction-free, meaning you'll get leads at a much higher rate than traditional listings!",
    icon: <TrendingUp className="h-6 w-6 text-emerald-400" />,
    className: "md:col-span-2",
    header: (
      <div className="flex h-full min-h-[8rem] w-full items-center justify-center gap-3 flex-wrap rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 px-4">
        <span className="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-sm font-medium border border-emerald-500/30">
          Featured
        </span>
        <span className="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-sm font-medium border border-emerald-500/30">
          Top Placement
        </span>
        <span className="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-sm font-medium border border-emerald-500/30">
          Ad-Free Page
        </span>
        <span className="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-sm font-medium border border-emerald-500/30">
          Priority Support
        </span>
      </div>
    ),
  },
];

export function SolutionGrid() {
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
            The Solution: Claim Your Listing
          </h2>
          <p className="mt-4 text-neutral-400 max-w-2xl mx-auto">
            We&apos;ve built the directory. Now it&apos;s your turn to take
            control.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <BentoGrid>
            {solutions.map((solution) => (
              <BentoGridItem
                key={solution.title}
                title={solution.title}
                description={solution.description}
                header={solution.header}
                icon={solution.icon}
                className={solution.className}
              />
            ))}
          </BentoGrid>
        </motion.div>
      </div>
    </section>
  );
}
