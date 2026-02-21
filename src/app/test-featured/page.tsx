import { Metadata } from 'next';
import { HolographicVariant } from '@/components/featured-variants/holographic-variant';
import { MarqueeVariant } from '@/components/featured-variants/marquee-variant';

export const metadata: Metadata = {
  title: 'Featured Clinics Design Test',
  description: 'Testing 2 different featured clinic slider designs',
};

export default function TestFeaturedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-12 space-y-24">
        {/* Page Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
            Featured Clinics Design Variants
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Two distinct approaches to displaying featured clinics. Both designs support dark mode and responsive layouts.
          </p>
          <div className="flex justify-center gap-4 text-sm">
            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
              Light Mode Compatible
            </span>
            <span className="px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400">
              Dark Mode Compatible
            </span>
            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
              Responsive
            </span>
          </div>
        </div>

        {/* Variant 1: Holographic Glass */}
        <section className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Variant 1: Holographic Glass
              </h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 pl-5">
              Animated gradient borders with 3D perspective hover effects. Glassmorphism with iridescent color shifts.
            </p>
          </div>
          <HolographicVariant />
        </section>

        {/* Variant 2: Infinite Marquee */}
        <section className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Variant 2: Infinite Marquee
              </h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 pl-5">
              Continuous horizontal infinite scroll. Pauses on hover for easy interaction.
            </p>
          </div>
          <MarqueeVariant />
        </section>

        {/* Footer */}
        <div className="pt-12 text-center text-slate-500 dark:text-slate-500 text-sm">
          <p>Toggle your system dark mode to test both themes</p>
        </div>
      </div>
    </div>
  );
}
