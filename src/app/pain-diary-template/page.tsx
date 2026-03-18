import Link from "next/link";
import type { Metadata } from "next";
import { PrintButton } from "./print-button";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://painclinics.com";

export const metadata: Metadata = {
  title: "Free Printable Pain Diary Template | PainClinics.com",
  description:
    "Download and print a free daily pain diary template. Track pain levels, medications, triggers, sleep, and mood to share with your pain management doctor.",
  alternates: {
    canonical: `${BASE_URL}/pain-diary-template`,
  },
  openGraph: {
    title: "Free Printable Pain Diary Template | PainClinics.com",
    description:
      "Download and print a free daily pain diary template. Track pain levels, medications, triggers, sleep, and mood to share with your pain management doctor.",
    url: `${BASE_URL}/pain-diary-template`,
    type: "website",
  },
};

export default function PainDiaryTemplatePage() {
  return (
    <>
      {/* Print styles — scoped so only this page adds them */}
      <style>{`
        @media print {
          /* Hide site chrome — nav, footer, intro text */
          header, footer, nav, .no-print { display: none !important; }

          /* Hide everything that isn't the template */
          body * { visibility: hidden; }
          #pain-diary-print-root,
          #pain-diary-print-root * { visibility: visible; }

          /* Position template at top of page */
          #pain-diary-print-root {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10pt;
            color: #000 !important;
            background: #fff !important;
            padding: 0;
            margin: 0;
          }

          /* Reset page */
          @page {
            size: letter portrait;
            margin: 0.55in 0.55in 0.45in 0.55in;
          }

          /* Force white backgrounds and black text inside template */
          #pain-diary-print-root * {
            color: #000 !important;
            background: transparent !important;
            border-color: #333 !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          /* Keep section borders visible */
          #pain-diary-print-root .print-section {
            border: 1px solid #555 !important;
          }

          /* Prevent page breaks inside sections */
          #pain-diary-print-root .print-section {
            break-inside: avoid;
          }
        }
      `}</style>

      {/* Screen-only intro */}
      <div className="no-print mx-auto max-w-2xl px-4 py-10 text-gray-800 dark:text-gray-200">
        <h1 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">
          Free Printable Pain Diary Template
        </h1>
        <p className="mb-4 leading-relaxed text-gray-600 dark:text-neutral-400">
          A pain diary helps you track your daily pain levels, medications,
          triggers, and how pain affects your sleep and mood. Bringing a
          completed diary to your pain management appointments gives your doctor
          a clearer picture of your condition and helps guide your treatment
          plan.
        </p>
        <p className="mb-6 text-sm text-gray-500 dark:text-neutral-500">
          Want the full guide on how to use a pain diary?{" "}
          <Link
            href="/blog/pain-diary-template"
            className="text-blue-600 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Read: How to Keep a Pain Diary
          </Link>
          . Prefer to track digitally?{" "}
          <Link
            href="/pain-tracking"
            className="text-blue-600 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Try the online pain tracker
          </Link>
          .
        </p>
        <PrintButton />
        <p className="mt-3 text-xs text-gray-400 dark:text-neutral-600">
          The template below is what will be printed — preview it first.
        </p>
      </div>

      {/* The printable template */}
      <div
        id="pain-diary-print-root"
        className="mx-auto max-w-2xl px-4 pb-16 pt-0 font-sans text-gray-900 dark:text-gray-100"
      >
        {/* Header */}
        <div className="mb-4 border-b-2 border-gray-800 pb-3 dark:border-gray-300">
          <h2 className="text-2xl font-bold tracking-wide text-gray-900 dark:text-white">
            Daily Pain Diary
          </h2>
          <div className="mt-1 flex items-center gap-4 text-sm text-gray-700 dark:text-gray-300">
            <span>
              Date:{" "}
              <span className="inline-block w-40 border-b border-gray-600 dark:border-gray-400" />
            </span>
          </div>
        </div>

        {/* Section 1 — Pain Ratings */}
        <div className="print-section mb-3 rounded border border-gray-300 p-3 dark:border-gray-600">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            1. Pain Ratings (0 = no pain, 10 = worst possible)
          </h3>
          <div className="grid grid-cols-3 gap-3 text-sm">
            {["Morning", "Afternoon", "Evening"].map((time) => (
              <div key={time} className="flex items-center gap-2">
                <span className="font-medium">{time}:</span>
                <span className="inline-block w-8 border-b border-gray-600 dark:border-gray-400" />
                <span className="text-gray-500 dark:text-gray-400">/10</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2 — Pain Location */}
        <div className="print-section mb-3 rounded border border-gray-300 p-3 dark:border-gray-600">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            2. Pain Location (check all that apply)
          </h3>
          <div className="grid grid-cols-4 gap-x-3 gap-y-1 text-sm sm:grid-cols-5">
            {[
              "Head",
              "Neck",
              "Upper Back",
              "Lower Back",
              "Left Shoulder",
              "Right Shoulder",
              "Left Arm",
              "Right Arm",
              "Left Hip",
              "Right Hip",
              "Left Leg",
              "Right Leg",
              "Left Knee",
              "Right Knee",
            ].map((loc) => (
              <label key={loc} className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 flex-shrink-0 rounded-sm border border-gray-500 dark:border-gray-400" />
                <span className="leading-tight">{loc}</span>
              </label>
            ))}
            <div className="col-span-2 flex items-center gap-1 sm:col-span-2">
              <span className="inline-block h-3 w-3 flex-shrink-0 rounded-sm border border-gray-500 dark:border-gray-400" />
              <span>Other:</span>
              <span className="flex-1 border-b border-gray-600 dark:border-gray-400" />
            </div>
          </div>
        </div>

        {/* Section 3 — Pain Quality */}
        <div className="print-section mb-3 rounded border border-gray-300 p-3 dark:border-gray-600">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            3. Pain Quality (check all that apply)
          </h3>
          <div className="grid grid-cols-4 gap-x-3 gap-y-1 text-sm">
            {[
              "Sharp",
              "Dull",
              "Burning",
              "Aching",
              "Throbbing",
              "Shooting",
              "Tingling",
              "Stabbing",
            ].map((q) => (
              <label key={q} className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 flex-shrink-0 rounded-sm border border-gray-500 dark:border-gray-400" />
                <span>{q}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Section 4 — Medications */}
        <div className="print-section mb-3 rounded border border-gray-300 p-3 dark:border-gray-600">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            4. Medications Taken
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-400 dark:border-gray-500">
                <th className="pb-1 text-left font-semibold">Medication</th>
                <th className="pb-1 text-left font-semibold">Dose</th>
                <th className="pb-1 text-left font-semibold">Time</th>
                <th className="pb-1 text-left font-semibold">Helped? (Y/N)</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((i) => (
                <tr
                  key={i}
                  className="border-b border-gray-300 dark:border-gray-600"
                >
                  <td className="py-2 pr-2">
                    <span className="block border-b border-gray-400 dark:border-gray-500" />
                  </td>
                  <td className="py-2 pr-2">
                    <span className="block border-b border-gray-400 dark:border-gray-500" />
                  </td>
                  <td className="py-2 pr-2">
                    <span className="block border-b border-gray-400 dark:border-gray-500" />
                  </td>
                  <td className="py-2">
                    <span className="block border-b border-gray-400 dark:border-gray-500" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 5 — Triggers */}
        <div className="print-section mb-3 rounded border border-gray-300 p-3 dark:border-gray-600">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            5. Triggers / What Made It Worse
          </h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="border-b border-gray-400 py-1 dark:border-gray-500"
              />
            ))}
          </div>
        </div>

        {/* Section 6 — What Helped */}
        <div className="print-section mb-3 rounded border border-gray-300 p-3 dark:border-gray-600">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            6. What Helped
          </h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="border-b border-gray-400 py-1 dark:border-gray-500"
              />
            ))}
          </div>
        </div>

        {/* Section 7 — Daily Function */}
        <div className="print-section mb-3 rounded border border-gray-300 p-3 dark:border-gray-600">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            7. Daily Function
          </h3>
          <div className="grid grid-cols-1 gap-y-2 text-sm sm:grid-cols-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">Sleep quality:</span>
              <span className="text-gray-600 dark:text-gray-400">
                Poor &nbsp;/&nbsp; Fair &nbsp;/&nbsp; Good &nbsp;/&nbsp;
                Excellent{" "}
                <span className="italic text-gray-400 dark:text-gray-500">
                  (circle one)
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Hours slept:</span>
              <span className="inline-block w-10 border-b border-gray-600 dark:border-gray-400" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">Mood (1–10):</span>
              <span className="text-gray-700 dark:text-gray-300">
                1 &nbsp;2 &nbsp;3 &nbsp;4 &nbsp;5 &nbsp;6 &nbsp;7 &nbsp;8
                &nbsp;9 &nbsp;10{" "}
                <span className="italic text-gray-400 dark:text-gray-500">
                  (circle one)
                </span>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">Activity level:</span>
              <span className="text-gray-600 dark:text-gray-400">
                Bed-bound &nbsp;/&nbsp; Limited &nbsp;/&nbsp; Moderate
                &nbsp;/&nbsp; Normal{" "}
                <span className="italic text-gray-400 dark:text-gray-500">
                  (circle one)
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Section 8 — Notes */}
        <div className="print-section mb-4 rounded border border-gray-300 p-3 dark:border-gray-600">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            8. Notes
          </h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="border-b border-gray-400 py-1 dark:border-gray-500"
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-400 pt-2 text-center dark:border-gray-500">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            PainClinics.com — Track your pain, improve your care
          </p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-500">
            Bring this diary to your next pain management appointment
          </p>
        </div>
      </div>
    </>
  );
}
