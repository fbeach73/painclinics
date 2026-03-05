export interface EducationCondition {
  slug: string;
  name: string;
  shortDescription: string;
}

export interface EducationCategory {
  slug: string;
  name: string;
  description: string;
  conditions: EducationCondition[];
}

export type ContentFormat = "website" | "handout" | "social";

export const contentFormats: { value: ContentFormat; label: string; description: string }[] = [
  {
    value: "website",
    label: "Website Page",
    description: "SEO-friendly, ~400 words with H2 headings",
  },
  {
    value: "handout",
    label: "Patient Handout",
    description: "Plain language, printable, ~300 words",
  },
  {
    value: "social",
    label: "Social Media Series",
    description: "4 short posts with engaging hooks",
  },
];

export const educationCategories: EducationCategory[] = [
  {
    slug: "back-pain",
    name: "Back Pain",
    description: "Common back pain conditions and spinal disorders",
    conditions: [
      {
        slug: "lower-back-pain",
        name: "Lower Back Pain (Lumbar Strain)",
        shortDescription: "Pain in the lumbar region caused by muscle or ligament strain",
      },
      {
        slug: "herniated-disc",
        name: "Herniated Disc / Bulging Disc",
        shortDescription: "Spinal disc pushes out and presses on nearby nerves",
      },
      {
        slug: "sciatica",
        name: "Sciatica / Sciatic Nerve Pain",
        shortDescription: "Pain radiating along the sciatic nerve from lower back to legs",
      },
      {
        slug: "spinal-stenosis",
        name: "Spinal Stenosis",
        shortDescription: "Narrowing of the spinal canal causing nerve compression",
      },
      {
        slug: "degenerative-disc-disease",
        name: "Degenerative Disc Disease",
        shortDescription: "Wear and tear of spinal discs causing chronic pain",
      },
      {
        slug: "sacroiliac-joint-dysfunction",
        name: "Sacroiliac Joint Dysfunction",
        shortDescription: "Pain from the SI joint connecting spine to pelvis",
      },
      {
        slug: "spondylolisthesis",
        name: "Spondylolisthesis",
        shortDescription: "A vertebra slips forward over the one below it",
      },
      {
        slug: "facet-joint-syndrome",
        name: "Facet Joint Syndrome",
        shortDescription: "Inflammation of the small joints between vertebrae",
      },
      {
        slug: "muscle-spasms",
        name: "Muscle Spasms",
        shortDescription: "Involuntary muscle contractions causing sudden back pain",
      },
      {
        slug: "compression-fractures",
        name: "Compression Fractures",
        shortDescription: "Small breaks in the vertebrae often from osteoporosis",
      },
    ],
  },
  {
    slug: "neuropathy",
    name: "Neuropathy",
    description: "Nerve damage conditions causing pain, numbness, and weakness",
    conditions: [
      {
        slug: "peripheral-neuropathy",
        name: "Peripheral Neuropathy",
        shortDescription: "Damage to peripheral nerves causing weakness and numbness",
      },
      {
        slug: "diabetic-neuropathy",
        name: "Diabetic Neuropathy",
        shortDescription: "Nerve damage caused by high blood sugar from diabetes",
      },
      {
        slug: "small-fiber-neuropathy",
        name: "Small Fiber Neuropathy",
        shortDescription: "Damage to small nerve fibers causing burning pain",
      },
      {
        slug: "chemotherapy-induced-neuropathy",
        name: "Chemotherapy-Induced Neuropathy",
        shortDescription: "Nerve damage as a side effect of cancer treatment",
      },
      {
        slug: "carpal-tunnel-syndrome",
        name: "Carpal Tunnel Syndrome",
        shortDescription: "Compressed median nerve in the wrist causing hand pain",
      },
      {
        slug: "tarsal-tunnel-syndrome",
        name: "Tarsal Tunnel Syndrome",
        shortDescription: "Compressed tibial nerve in the ankle causing foot pain",
      },
      {
        slug: "crps",
        name: "Complex Regional Pain Syndrome (CRPS)",
        shortDescription: "Chronic pain condition usually affecting an arm or leg",
      },
      {
        slug: "postherpetic-neuralgia",
        name: "Postherpetic Neuralgia (Shingles Pain)",
        shortDescription: "Nerve pain persisting after a shingles outbreak",
      },
    ],
  },
];

export function findConditionBySlug(slug: string): {
  condition: EducationCondition;
  category: EducationCategory;
} | null {
  for (const category of educationCategories) {
    const condition = category.conditions.find((c) => c.slug === slug);
    if (condition) {
      return { condition, category };
    }
  }
  return null;
}

export function findCategoryBySlug(slug: string): EducationCategory | null {
  return educationCategories.find((c) => c.slug === slug) ?? null;
}
