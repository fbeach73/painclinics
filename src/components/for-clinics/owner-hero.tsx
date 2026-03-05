"use client";

import { ArrowRight, BadgeCheck, TrendingUp, Users } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

interface OwnerHeroProps {
  badge?: string;
  title?: string;
  titleGradient?: string;
  subtitle?: string;
}

export function OwnerHero({
  badge,
  title,
  titleGradient,
  subtitle,
}: OwnerHeroProps = {}) {
  return (
    <section className="relative bg-gray-50 dark:bg-slate-950 overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-100 via-gray-50 to-gray-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/40 via-transparent to-transparent dark:from-emerald-900/20 dark:via-transparent dark:to-transparent" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 pt-24 pb-20 sm:pt-32 sm:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Trust badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-4 py-2 mb-8"
          >
            <BadgeCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm text-emerald-700 dark:text-emerald-300">{badge || "Trusted by 500+ Pain Management Clinics"}</span>
          </motion.div>

          {/* Main heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            <span className="text-gray-900 dark:text-white">{title || "Your Patients Are Already"}</span>
            <br />
            <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent">
              {titleGradient || "Searching For You"}
            </span>
          </h1>

          {/* Subheading */}
          <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {subtitle ||
              "Thousands of patients search our directory every month looking for pain relief. Claim your free listing and start connecting with patients today."}
          </p>

          {/* CTA buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="h-14 px-8 text-base font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
            >
              <Link href="/pain-management">
                Find & Claim Your Clinic
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-14 px-8 text-base font-semibold border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
            >
              <Link href="#pricing">
                View Pricing
              </Link>
            </Button>
          </div>

          {/* Stats row */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-2 text-gray-400 dark:text-slate-400 mb-1">
                <Users className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">5,000+</div>
              <div className="text-sm text-gray-500 dark:text-slate-500">Clinics Listed</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-2 text-gray-400 dark:text-slate-400 mb-1">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">50</div>
              <div className="text-sm text-gray-500 dark:text-slate-500">States Covered</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-2 text-gray-400 dark:text-slate-400 mb-1">
                <BadgeCheck className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Free</div>
              <div className="text-sm text-gray-500 dark:text-slate-500">To Get Started</div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
