import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";
import { FloatingToc } from "@/components/blog/floating-toc";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  generateMedicalWebPageSchema,
  generateResourceBreadcrumbSchema,
} from "@/lib/structured-data";
import { ConsultCTA } from "@/components/consult/consult-cta";
import { DownloadTemplates } from "./download-templates";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://painclinics.com";

export const metadata: Metadata = {
  title: "Free Pain Diary Template | Printable Pain Log & Tracker PDF",
  description:
    "Download free printable pain tracking templates. Daily, weekly, and monthly pain diaries and logs to track symptoms, triggers, and treatments for your doctor.",
  keywords: [
    "pain tracking template",
    "pain diary template",
    "pain log template",
    "pain journal pdf",
    "free printable pain tracker",
    "daily pain journal template",
    "pain log for doctors",
    "pain management documentation templates",
  ],
  alternates: {
    canonical: "/pain-tracking",
  },
  openGraph: {
    title: "Free Pain Diary Template | Printable Pain Log & Tracker PDF",
    description:
      "Download free daily, weekly, and monthly pain tracking templates. Log symptoms, triggers, and treatments to share with your doctor.",
    url: "/pain-tracking",
    type: "article",
  },
  twitter: {
    card: "summary",
    title: "Free Pain Diary Template | Printable Pain Log & Tracker PDF",
    description:
      "Download free daily, weekly, and monthly pain tracking templates. Log symptoms, triggers, and treatments to share with your doctor.",
  },
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
  {
    question: "What is a pain tracking template?",
    answer:
      "A pain tracking template is a structured document — either printable or digital — that helps you record your pain levels, symptoms, triggers, and treatments over time. Templates typically include fields for date, pain intensity on a 0-10 scale, pain location, type of pain, medications taken, and notes about activities or relief measures.",
  },
  {
    question: "What pain log format do doctors recommend?",
    answer:
      "Most doctors recommend a structured pain log that includes a numeric pain scale (0-10), pain location, duration, triggers, and treatments used. Spreadsheet formats like Excel are preferred because they allow easy sorting by date, identification of trends, and clean printouts for appointments. The key is consistency — any format you will actually use daily is the best format.",
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
  const medicalWebPageSchema = generateMedicalWebPageSchema({
    name: "Free Pain Diary Template - Printable Pain Log & Tracker",
    description:
      "Download free printable pain tracking templates. Daily, weekly, and monthly pain diaries and logs to track symptoms, triggers, and treatments for your doctor.",
    url: `${BASE_URL}/pain-tracking`,
    datePublished: "2026-01-15",
    dateModified: "2026-03-05",
    about: [
      { "@type": "MedicalCondition", name: "Chronic Pain" },
      { "@type": "MedicalTherapy", name: "Pain Management" },
      { "@type": "MedicalProcedure", name: "Pain Assessment" },
    ],
    specialty: { "@type": "MedicalSpecialty", name: "Pain Medicine" },
    lastReviewed: "2026-03-05",
  });

  const breadcrumbSchema = generateResourceBreadcrumbSchema({
    pageName: "Pain Tracking Templates",
    pageUrl: `${BASE_URL}/pain-tracking`,
  });

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Free Pain Tracking Templates",
    description: "Downloadable pain diary and tracker templates in daily, weekly, and monthly formats.",
    numberOfItems: 3,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        item: {
          "@type": "DigitalDocument",
          name: "Daily Pain Log",
          description: "Track pain hour-by-hour. Best for flare-ups and acute pain episodes.",
          encodingFormat: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          url: `${BASE_URL}/templates/Daily-Pain-Log.xlsx`,
        },
      },
      {
        "@type": "ListItem",
        position: 2,
        item: {
          "@type": "DigitalDocument",
          name: "Weekly Pain Tracker",
          description: "Daily summary view. See patterns across the week at a glance.",
          encodingFormat: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          url: `${BASE_URL}/templates/Weekly-Pain-Tracker.xlsx`,
        },
      },
      {
        "@type": "ListItem",
        position: 3,
        item: {
          "@type": "DigitalDocument",
          name: "Monthly Pain Overview",
          description: "Long-term tracking. Ideal for chronic conditions and doctor visits.",
          encodingFormat: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          url: `${BASE_URL}/templates/Monthly-Pain-Overview.xlsx`,
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(medicalWebPageSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListSchema),
        }}
      />

      <main id="main-content" className="container mx-auto py-8 md:py-12 px-4">
        <div className="max-w-6xl mx-auto prose prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-a:text-primary prose-ol:text-foreground">
          <h1>Free Pain Tracking Templates &amp; Printable Pain Diary</h1>
          <p className="lead text-foreground/70">
            Download printable pain diaries and pain log templates to help you
            monitor symptoms, identify triggers, and communicate effectively with
            your healthcare provider.
          </p>

          <Alert variant="warning" className="not-prose my-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              These templates are for informational and personal tracking purposes
              only. They do not constitute medical advice. Always consult with a
              qualified healthcare professional for diagnosis and treatment of
              pain conditions.
            </AlertDescription>
          </Alert>

          <h2>Pain Diary vs. Pain Tracker vs. Pain Journal</h2>
          <p>
            You may hear these terms used interchangeably, and for good reason — a
            pain diary, pain tracker, and pain journal all serve the same core
            purpose: documenting your pain experience over time. A{" "}
            <strong>pain diary</strong> typically refers to a daily written record
            of symptoms, while a <strong>pain tracker</strong> emphasizes
            structured formats with scales and categories for easier pattern
            recognition. A <strong>pain journal</strong> is often more open-ended,
            giving you space to describe how pain affects your mood, sleep, and
            daily activities in your own words.
          </p>
          <p>
            The best approach combines elements of all three. Our free pain diary
            templates below use a structured tracker format with space for
            personal notes — giving you the consistency of a pain log with the
            flexibility of a journal. Whether you search for a{" "}
            <em>pain diary template</em>, <em>pain journal template</em>, or{" "}
            <em>pain log template</em>, you&apos;ll find what you need here.
          </p>

          {/* CTA: Download Templates - Primary action at top */}
          <DownloadTemplates />

          <h2>Daily vs. Weekly vs. Monthly: Which Template Should You Choose?</h2>
          <p>
            Not sure which pain tracking format is right for you? Use this
            comparison to pick the template that matches your situation:
          </p>
          <div className="not-prose my-6 overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-border">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border border-border p-3 text-left text-foreground font-semibold">Format</th>
                  <th className="border border-border p-3 text-left text-foreground font-semibold">Best For</th>
                  <th className="border border-border p-3 text-left text-foreground font-semibold">Tracking Detail</th>
                  <th className="border border-border p-3 text-left text-foreground font-semibold">Ideal Duration</th>
                </tr>
              </thead>
              <tbody className="text-foreground">
                <tr>
                  <td className="border border-border p-3 font-medium">Daily</td>
                  <td className="border border-border p-3">Flare-ups, new medications, acute pain episodes</td>
                  <td className="border border-border p-3">Hourly entries with detailed notes</td>
                  <td className="border border-border p-3">1&ndash;2 weeks</td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="border border-border p-3 font-medium">Weekly</td>
                  <td className="border border-border p-3">Chronic conditions, treatment monitoring</td>
                  <td className="border border-border p-3">One entry per day with weekly summary</td>
                  <td className="border border-border p-3">4&ndash;8 weeks</td>
                </tr>
                <tr>
                  <td className="border border-border p-3 font-medium">Monthly</td>
                  <td className="border border-border p-3">Long-term trends, doctor visit prep</td>
                  <td className="border border-border p-3">Daily scores with monthly overview</td>
                  <td className="border border-border p-3">3&ndash;6 months</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Many people start with a daily tracker during flare-ups, then switch
            to a weekly or monthly format for ongoing maintenance. You can always
            download multiple templates and use them as needed.
          </p>

          {/* Pain Scale Visual - Eye-catching, close to CTA */}
          <h2>Understanding the Pain Scale</h2>
          <p>
            Our pain trackers use the Numeric Rating Scale (NRS), the standard
            0-10 pain assessment tool used by healthcare providers worldwide. The
            NRS is recommended by the Initiative on Methods, Measurement, and
            Pain Assessment in Clinical Trials (IMMPACT) as a core outcome
            measure for chronic pain studies. Here&apos;s what each level means:
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
            Research published in the <em>European Journal of Pain</em> found that
            patients who used structured pain diaries reported improved communication
            with providers and greater satisfaction with their treatment plans.
          </p>
          <p>
            Approximately 51.6 million U.S. adults — roughly 20.9% of the
            population — live with chronic pain, according to the{" "}
            <a
              href="https://www.cdc.gov/mmwr/volumes/72/wr/mm7215a1.htm"
              target="_blank"
              rel="noopener noreferrer"
            >
              CDC&apos;s Morbidity and Mortality Weekly Report (MMWR)
            </a>
            . Among those patients, consistent pain tracking is associated with
            earlier identification of triggers and more effective treatment
            adjustments. A separate study in <em>Pain Medicine</em> found that
            patients who brought structured pain logs to appointments received
            more targeted treatment plans and reported higher satisfaction with
            their care.
          </p>
          <p>
            Whether you use a simple paper diary or a dedicated pain management
            tracker, the act of recording your experience creates accountability
            and gives your{" "}
            <Link href="/pain-management-guide">pain management team</Link> the data
            they need to help you effectively. Benefits of consistent pain
            tracking include:
          </p>
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

          <h2>Using a Pain Tracking Spreadsheet</h2>
          <p>
            While paper diaries work well, a pain tracking spreadsheet offers
            distinct advantages. Our Excel templates let you sort entries by date,
            filter by pain level, and spot trends using built-in charts and
            conditional formatting. The spreadsheet columns mirror what
            doctors look for: date, time, pain intensity (1&ndash;10), location,
            type (sharp, dull, burning), triggers, medications taken, and relief
            measures.
          </p>
          <p>
            If you prefer digital tracking, download the pain diary Excel template
            above and save it to your computer or cloud storage. You can update it
            daily on your phone or laptop, then print a summary before your next
            appointment. The spreadsheet format also makes it easy to email your
            pain log directly to your doctor&apos;s office ahead of a visit.
          </p>

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

          <h2>How to Share Your Pain Diary or Tracker with Your Doctor</h2>
          <p>
            Your pain tracker becomes most valuable when shared with your
            healthcare provider. Here are the most effective ways to get your
            pain log into your doctor&apos;s hands:
          </p>
          <ul>
            <li>
              <strong>Print the Excel file:</strong> Open your completed
              spreadsheet, select the date range, and print it. Most templates
              are formatted to fit on standard letter-size paper.
            </li>
            <li>
              <strong>Export to PDF:</strong> Use &quot;Save As PDF&quot; in
              Excel or Google Sheets to create a clean, shareable document.
            </li>
            <li>
              <strong>Email ahead of your appointment:</strong> Send your pain
              log to the clinic 1&ndash;2 days before your visit so your doctor
              can review it in advance and prepare targeted questions.
            </li>
            <li>
              <strong>Upload to your patient portal:</strong> Many clinics accept
              documents through their online portal. Upload your pain diary as
              an attachment to a message.
            </li>
            <li>
              <strong>Highlight key entries verbally:</strong> During your
              appointment, point out the worst days, any new triggers you
              discovered, and whether treatments seem to be working.
            </li>
          </ul>

          <h3>When to Bring Your Pain Log</h3>
          <p>
            Make it a habit to bring your completed pain tracker to these types
            of appointments:
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
            Doctors appreciate patients who come prepared with pain logs. The
            data helps them make more informed treatment decisions and shows
            you&apos;re actively engaged in your care.
          </p>

          <h2>Pain Management Documentation Templates</h2>
          <p>
            Our pain tracking templates double as pain management documentation
            — the kind of structured records that healthcare providers rely on
            to evaluate your treatment plan. Whether you&apos;re preparing for a
            specialist referral, documenting symptoms for a disability claim, or
            simply want a clear record of your pain history, these templates
            provide a format that clinicians recognize and trust.
          </p>
          <p>
            If you&apos;re looking for professional pain management support beyond
            self-tracking,{" "}
            <Link href="/clinics">find a pain specialist near you</Link> through our
            directory of verified clinics across the United States.
          </p>

          <h2 className="not-prose text-2xl font-bold mt-10 mb-4 text-foreground">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="not-prose">
            {faqData.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-left text-foreground font-semibold">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="not-prose my-8">
            <ConsultCTA variant="section" />
          </div>

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
            <li>
              <Link href="/tools/patient-education">Patient Education Content Generator</Link>{" "}
              &ndash; Create customized patient education materials about pain
              conditions.
            </li>
          </ul>
        </div>
      </main>

      {/* Floating Table of Contents */}
      <FloatingToc />
    </>
  );
}
