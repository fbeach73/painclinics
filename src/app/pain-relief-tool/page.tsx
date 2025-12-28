import { AlertTriangle } from 'lucide-react';
import { Metadata } from 'next';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  generateFAQStructuredData,
  generateItemListSchema,
  generateMedicalWebPageSchema,
  generateResourceBreadcrumbSchema,
} from '@/lib/structured-data';
import { PainReliefComparison } from './pain-relief-comparison';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://painclinics.com';

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

// Pain relief methods for ItemList schema
const painReliefMethodsForSchema = [
  { name: 'Ice Pack Therapy', description: 'Cold therapy to reduce inflammation and numb pain. Best for acute injuries in the first 48-72 hours.' },
  { name: 'Heating Pad', description: 'Heat therapy to relax muscles and increase blood flow. Ideal for chronic stiffness and muscle tension.' },
  { name: 'Contrast Therapy', description: 'Alternating hot and cold treatment to reduce swelling and improve circulation.' },
  { name: 'Ibuprofen (Advil/Motrin)', description: 'NSAID medication that reduces inflammation and pain. Effective for muscle and joint pain.' },
  { name: 'Acetaminophen (Tylenol)', description: 'Pain reliever that is gentler on the stomach. Good for headaches and general pain.' },
  { name: 'Naproxen (Aleve)', description: 'Long-lasting NSAID providing 8-12 hours of relief. Good for arthritis and back pain.' },
  { name: 'Stretching', description: 'Gentle exercises to improve flexibility and reduce muscle tension. Free and can be done at home.' },
  { name: 'Self-Massage', description: 'Manual therapy to release muscle knots and tension. Can be done with hands or massage tools.' },
  { name: 'Rest & Positioning', description: 'Proper rest and ergonomic positioning to allow healing and prevent further strain.' },
  { name: 'TENS Unit', description: 'Electrical nerve stimulation device that blocks pain signals. Good for chronic pain management.' },
  { name: 'Topical Pain Creams', description: 'Over-the-counter creams containing menthol, capsaicin, or lidocaine for localized relief.' },
  { name: 'Epsom Salt Bath', description: 'Warm bath with magnesium sulfate to relax muscles and reduce inflammation.' },
];

export default function PainReliefToolPage() {
  const faqSchema = generateFAQStructuredData(faqData);

  const itemListSchema = generateItemListSchema({
    name: 'Pain Relief Methods Comparison',
    description:
      'Compare 17 different pain relief methods including ice therapy, heat therapy, OTC medications, stretching, and alternative treatments.',
    items: painReliefMethodsForSchema,
  });

  const medicalWebPageSchema = generateMedicalWebPageSchema({
    name: 'Pain Relief Comparison Tool - Ice vs Heat, Advil vs Tylenol',
    description:
      'Compare pain relief methods including ice vs heat therapy, Advil vs Tylenol, stretching, massage, and more. Find the best treatment for your specific pain type and location.',
    url: `${BASE_URL}/pain-relief-tool`,
    datePublished: '2024-01-01',
    dateModified: new Date().toISOString().slice(0, 10),
    about: ['Pain Management', 'Pain Relief', 'Anti-Inflammatory Agents', 'Physical Therapy'],
  });

  const breadcrumbSchema = generateResourceBreadcrumbSchema({
    pageName: 'Pain Relief Comparison Tool',
    pageUrl: `${BASE_URL}/pain-relief-tool`,
  });

  return (
    <>
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(medicalWebPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
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
            <AlertDescription className="text-yellow-700 dark:text-yellow-200">
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
