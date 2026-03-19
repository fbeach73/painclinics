import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConsultCTAProps {
  variant?: "inline" | "section";
  heading?: string;
  description?: string;
  buttonText?: string;
  className?: string;
}

export function ConsultCTA({
  variant = "inline",
  heading = "Not sure what's causing your pain?",
  description = "Get a free, evidence-based assessment from PainConsult AI in minutes.",
  buttonText = "Start Free Assessment",
  className,
}: ConsultCTAProps) {
  if (variant === "section") {
    return (
      <section
        className={cn(
          "w-full py-12 px-4 bg-blue-50 dark:bg-blue-950/30 border-y border-blue-100 dark:border-blue-900",
          className
        )}
      >
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/50">
              <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {heading}
          </h2>
          <p className="text-gray-600 dark:text-neutral-400 text-base">
            {description}
          </p>
          <Button
            asChild
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white mt-2"
          >
            <Link href="/consult">{buttonText}</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <Card
      className={cn(
        "border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900",
        className
      )}
    >
      <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4 px-5">
        <div className="flex-shrink-0 p-2 rounded-full bg-blue-100 dark:bg-blue-900/50">
          <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 dark:text-white leading-snug">
            {heading}
          </p>
          <p className="text-xs text-gray-600 dark:text-neutral-400 mt-0.5">
            {description}
          </p>
        </div>
        <Button
          asChild
          size="sm"
          className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
        >
          <Link href="/consult">{buttonText}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
