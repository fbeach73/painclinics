"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/moving-border";

export function FinalCTA() {
  return (
    <section className="bg-slate-950 py-20">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <div className="mb-6 inline-block rounded-full bg-primary/10 border border-primary/20 px-4 py-2">
            <span className="text-sm font-semibold text-primary">
              50% OFF
            </span>
            <span className="text-sm text-neutral-300">
              {" "}
              — January Early Adopter Special
            </span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Ready to Get Found?
          </h2>
          <p className="mt-4 text-neutral-300 max-w-2xl mx-auto">
            Join thousands of pain management clinics already benefiting from
            increased visibility. Claim your listing today.
          </p>

          <div className="mt-8 flex justify-center">
            <Button
              as={Link}
              href="/pain-management"
              containerClassName="h-16 w-56"
            >
              Claim Your Clinic
            </Button>
          </div>

          <p className="mt-6 text-sm text-neutral-400">
            January early adopter pricing • Cancel anytime • No contracts
          </p>
        </motion.div>
      </div>
    </section>
  );
}
