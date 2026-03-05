"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ToolCtaSectionProps {
  text: string;
  href: string;
  description: string;
}

export function ToolCtaSection({ text, href, description }: ToolCtaSectionProps) {
  return (
    <section className="bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/20 dark:to-slate-950 py-16">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-4 py-2">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              Free AI Tool
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            {text}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {description}
          </p>
          <Button
            asChild
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            <Link href={href}>
              Try It Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
