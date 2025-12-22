import { AlertTriangle } from 'lucide-react';
import { Metadata } from 'next';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { generateFAQStructuredData } from '@/lib/structured-data';
import { PainReliefComparison } from './pain-relief-comparison';

export const metadata: Metadata = {
  title: 'Pain Relief Comparison Tool | Ice vs Heat, OTC Medications',
  description:
    'Compare pain relief methods including ice vs heat therapy, Advil vs Tylenol, stretching, massage, and more. Find the best treatment for your specific pain type and location.',
  keywords: [
    'ice vs heat for pain',
    'ice vs heat for back pain',
    'advil vs tylenol',
    'ibuprofen vs acetaminophen',
    'pain relief comparison',
    'best pain relief method',
    'home remedies for pain',
    'otc pain reliever comparison',
  ],
};

const faqData = [
  {
    question: 'Should I use ice or heat for back pain?',
    answer:
      'Use ice for acute injuries (first 48-72 hours) to reduce inflammation. Use heat for chronic stiffness and muscle tension. For ongoing back pain, alternating between both (contrast therapy) can be effective.',
  },
  {
    question: 'Which is better: Advil (ibuprofen) or Tylenol (acetaminophen)?',
    answer:
      'Ibuprofen (Advil) is better for inflammation and swelling. Acetaminophen (Tylenol) is gentler on the stomach and better for those with kidney concerns. Ibuprofen typically provides stronger relief for muscle and joint pain.',
  },
  {
    question: 'How long should I apply ice to an injury?',
    answer:
      'Apply ice for 15-20 minutes at a time. Wait at least 1 hour between applications. Always use a barrier (towel) between ice and skin. Check skin every 5 minutes for signs of irritation.',
  },
  {
    question: 'When should I see a doctor for pain instead of using home remedies?',
    answer:
      'Seek medical attention for severe pain (8-10 on scale), pain lasting more than 2 weeks, pain with numbness or weakness, pain after injury, or pain accompanied by fever, unexplained weight loss, or night sweats.',
  },
  {
    question: 'Can I combine different pain relief methods?',
    answer:
      'Yes, many pain relief methods work well together. For example, you can use ice therapy alongside gentle stretching, or take OTC medication while using a heating pad. Avoid combining multiple NSAIDs (like ibuprofen and naproxen) together.',
  },
];

export default function PainReliefToolPage() {
  const faqSchema = generateFAQStructuredData(faqData);

  return (
    <>
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <main id="main-content" className="container mx-auto py-8 md:py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Pain Relief Comparison Tool
          </h1>
          <p className="text-lg text-muted-foreground mb-6 max-w-3xl">
            Compare different pain relief methods side-by-side to find what works best for your
            specific situation. Filter by pain location, type, and available resources.
          </p>

          <Alert className="mb-8 border-yellow-500 bg-yellow-500/10">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-200">
              This tool is for educational purposes only. Always consult a healthcare provider for
              persistent or severe pain. Do not exceed recommended dosages for medications.
            </AlertDescription>
          </Alert>

          <PainReliefComparison />

          {/* FAQ Section for SEO */}
          <section className="mt-16 max-w-3xl">
            <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {faqData.map((faq, index) => (
                <div key={index} className="border-b pb-4 last:border-0">
                  <h3 className="font-semibold mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
