import { AlertTriangle } from "lucide-react";
import { Metadata } from "next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FloatingToc } from "@/components/blog/floating-toc";
import { generateFAQStructuredData } from "@/lib/structured-data";
import { DownloadTemplates } from "./download-templates";

export const metadata: Metadata = {
  title: "Free Pain Tracking Template | Printable Pain Diary PDF",
  description:
    "Download free printable pain tracking templates. Daily, weekly, and monthly pain journals to log symptoms, triggers, and treatments for your doctor.",
  keywords: [
    "pain tracking template",
    "pain diary printable",
    "pain journal pdf",
    "free printable pain tracker",
    "daily pain journal template",
    "pain log for doctors",
  ],
};

const faqData = [
  {
    question: "How do I use a pain tracking template?",
    answer:
      "Record your pain level (1-10), location, duration, triggers, and any treatments used. Fill it out at the same time daily for consistency.",
  },
  {
    question: "What should I track in a pain diary?",
    answer:
      "Track pain intensity, location, time of day, triggers (food, activity, weather), medications taken, and what provides relief.",
  },
  {
    question: "Why should I track my pain?",
    answer:
      "Pain tracking helps identify patterns, triggers, and effective treatments. It provides valuable data for your doctor to optimize your care.",
  },
  {
    question: "Can I share my pain log with my doctor?",
    answer:
      "Yes! Bring your completed pain tracker to appointments. Doctors use this information to diagnose conditions, adjust treatments, and monitor progress.",
  },
  {
    question: "How often should I fill out a pain tracker?",
    answer:
      "For best results, complete your pain diary at least once daily, ideally at the same time. Track more frequently during flare-ups.",
  },
];

function PainScaleVisual() {
  return (
    <div className="not-prose my-6 overflow-x-auto">
      <div className="min-w-[600px]">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => {
            let bgColor: string;
            let label: string;
            if (level <= 2) {
              bgColor = "#22c55e";
              label = level === 1 ? "Mild" : "";
            } else if (level <= 4) {
              bgColor = "#eab308";
              label = level === 3 ? "Moderate" : "";
            } else if (level <= 6) {
              bgColor = "#f97316";
              label = level === 5 ? "Significant" : "";
            } else if (level <= 8) {
              bgColor = "#ef4444";
              label = level === 7 ? "Severe" : "";
            } else {
              bgColor = "#991b1b";
              label = level === 9 ? "Extreme" : "";
            }
            return (
              <div key={level} className="flex-1 text-center">
                <div
                  className="h-12 rounded-md flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: bgColor }}
                >
                  {level}
                </div>
                {label && (
                  <p className="text-xs mt-1 text-muted-foreground">{label}</p>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          <span>No Pain</span>
          <span>Worst Pain Imaginable</span>
        </div>
      </div>
    </div>
  );
}

export default function PainTrackingPage() {
  const faqSchema = generateFAQStructuredData(faqData);

  return (
    <>
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqSchema),
          }}
        />
      )}

      <main id="main-content" className="container mx-auto py-8 md:py-12 px-4">
        <div className="max-w-6xl mx-auto prose prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-a:text-primary prose-ol:text-foreground">
          <h1>Free Pain Tracking Templates</h1>
          <p className="lead text-foreground/70">
            Download printable pain diaries to help you monitor symptoms, identify
            triggers, and communicate effectively with your healthcare provider.
          </p>

          <Alert className="not-prose my-6 border-yellow-500 bg-yellow-500/10">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-200">
              These templates are for informational and personal tracking purposes
              only. They do not constitute medical advice. Always consult with a
              qualified healthcare professional for diagnosis and treatment of
              pain conditions.
            </AlertDescription>
          </Alert>

          {/* CTA: Download Templates - Primary action at top */}
          <DownloadTemplates />

          {/* Pain Scale Visual - Eye-catching, close to CTA */}
          <h2>Understanding the Pain Scale</h2>
          <p>
            Our pain trackers use the standard 0-10 numeric pain scale used by
            healthcare providers worldwide. Here&apos;s what each level means:
          </p>

          <PainScaleVisual />

          <ul>
            <li>
              <strong>0:</strong> No pain at all
            </li>
            <li>
              <strong>1-2 (Mild):</strong> Barely noticeable, doesn&apos;t interfere
              with activities
            </li>
            <li>
              <strong>3-4 (Moderate):</strong> Noticeable and distracting, but
              manageable
            </li>
            <li>
              <strong>5-6 (Significant):</strong> Moderately strong pain that
              interferes with tasks
            </li>
            <li>
              <strong>7-8 (Severe):</strong> Severely limits activities, hard to
              concentrate
            </li>
            <li>
              <strong>9-10 (Extreme):</strong> Worst pain imaginable, may require
              emergency care
            </li>
          </ul>

          <h2>Why Track Your Pain?</h2>
          <p>
            Tracking your pain is one of the most effective ways to take control of
            your health. A pain diary helps you and your doctor understand your
            condition better by revealing patterns that might otherwise go unnoticed.
          </p>
          <p>Benefits of consistent pain tracking include:</p>
          <ul>
            <li>
              <strong>Identifying Triggers:</strong> Discover what activities, foods,
              or situations make your pain worse.
            </li>
            <li>
              <strong>Measuring Treatment Effectiveness:</strong> See which
              medications, therapies, or lifestyle changes actually help.
            </li>
            <li>
              <strong>Better Doctor Visits:</strong> Provide your healthcare provider
              with objective data instead of relying on memory.
            </li>
            <li>
              <strong>Recognizing Patterns:</strong> Notice trends like pain that
              worsens at certain times or correlates with weather changes.
            </li>
            <li>
              <strong>Empowerment:</strong> Take an active role in managing your
              health and treatment decisions.
            </li>
          </ul>

          <h2>What Should You Track?</h2>
          <p>
            A comprehensive pain diary captures several key pieces of information.
            Our templates are designed to make tracking easy while capturing the
            data that matters most:
          </p>
          <ul>
            <li>
              <strong>Pain Intensity (1-10):</strong> Rate your pain on a standard
              scale so you can compare over time.
            </li>
            <li>
              <strong>Pain Location:</strong> Where exactly do you feel the pain?
              Does it move or radiate?
            </li>
            <li>
              <strong>Pain Type:</strong> Is it sharp, dull, burning, throbbing, or
              aching?
            </li>
            <li>
              <strong>Duration:</strong> How long does the pain last? Is it constant
              or intermittent?
            </li>
            <li>
              <strong>Triggers:</strong> What were you doing when the pain started or
              worsened?
            </li>
            <li>
              <strong>Treatments Used:</strong> What medications did you take? Did
              you try heat, ice, or other therapies?
            </li>
            <li>
              <strong>Relief Measures:</strong> What helped reduce your pain? How
              much did it help?
            </li>
            <li>
              <strong>Impact on Daily Life:</strong> How did pain affect your sleep,
              work, or activities?
            </li>
          </ul>

          <h2>How to Use Your Pain Tracker</h2>
          <p>
            Getting the most from your pain diary requires consistency and attention
            to detail. Here&apos;s how to use your tracker effectively:
          </p>
          <ol>
            <li>
              <strong>Choose the right format:</strong> Daily trackers work best for
              acute pain or flare-ups. Weekly and monthly formats are ideal for
              chronic conditions.
            </li>
            <li>
              <strong>Set a reminder:</strong> Track at the same time each day for
              consistency. Many people find evening reviews work best.
            </li>
            <li>
              <strong>Be specific:</strong> Instead of &quot;back pain,&quot; note
              &quot;lower right back pain that radiates down leg.&quot;
            </li>
            <li>
              <strong>Note everything:</strong> Include activities, meals, sleep
              quality, stress levels, and weather conditions.
            </li>
            <li>
              <strong>Track treatments:</strong> Record all medications (including
              dose and time) and other therapies used.
            </li>
            <li>
              <strong>Review regularly:</strong> Look back weekly to identify
              patterns and prepare for doctor visits.
            </li>
          </ol>

          <h2>Tips for Successful Pain Tracking</h2>
          <p>
            Make pain tracking a sustainable habit with these proven strategies:
          </p>
          <ul>
            <li>
              <strong>Keep it accessible:</strong> Store your tracker where you&apos;ll
              see it daily&mdash;on a nightstand, in a planner, or on the fridge.
            </li>
            <li>
              <strong>Don&apos;t wait too long:</strong> Record pain levels in the
              moment when possible. Memory of pain intensity fades quickly.
            </li>
            <li>
              <strong>Be honest:</strong> Avoid minimizing or exaggerating. Your
              tracker is a tool for improvement, not judgment.
            </li>
            <li>
              <strong>Note the positives:</strong> Track good days and what made them
              different. This information is just as valuable.
            </li>
            <li>
              <strong>Include context:</strong> Stress, sleep quality, menstrual
              cycle, and weather can all influence pain levels.
            </li>
            <li>
              <strong>Stay consistent:</strong> Even brief entries on busy days help
              maintain patterns. Something is better than nothing.
            </li>
          </ul>

          <h2>When to Share Your Pain Log with a Doctor</h2>
          <p>
            Your pain tracker becomes most valuable when shared with your healthcare
            provider. Bring your completed logs to appointments in these situations:
          </p>
          <ul>
            <li>
              <strong>Initial consultations:</strong> Help your doctor understand
              your pain history from the start.
            </li>
            <li>
              <strong>Medication changes:</strong> Show how new treatments are
              affecting your pain levels.
            </li>
            <li>
              <strong>When pain worsens:</strong> Provide documentation of
              increasing severity or frequency.
            </li>
            <li>
              <strong>Before procedures:</strong> Establish a baseline to measure
              treatment effectiveness.
            </li>
            <li>
              <strong>Follow-up visits:</strong> Demonstrate progress or ongoing
              challenges with objective data.
            </li>
            <li>
              <strong>Seeking referrals:</strong> Support requests for specialist
              consultations with documented evidence.
            </li>
          </ul>
          <p>
            Doctors appreciate patients who come prepared with pain logs. The data
            helps them make more informed treatment decisions and shows you&apos;re
            actively engaged in your care.
          </p>

          <h2 className="not-prose text-2xl font-bold mt-10 mb-4 text-foreground">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="not-prose">
            {faqData.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-left text-white font-semibold">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <h2>Related Resources</h2>
          <p>
            Continue learning about pain management with these helpful resources:
          </p>
          <ul>
            <li>
              <a href="/clinics">Find a Pain Clinic Near You</a> &ndash; Search our
              directory of pain management specialists in your area.
            </li>
            <li>
              <a href="/pain-management-guide">Pain Management Guide</a> &ndash;
              Comprehensive information about treatment options and approaches.
            </li>
            <li>
              <a href="/treatment-options">Treatment Options</a> &ndash; Learn about
              different therapies available for chronic pain conditions.
            </li>
          </ul>
        </div>
      </main>

      {/* Floating Table of Contents */}
      <FloatingToc />
    </>
  );
}
