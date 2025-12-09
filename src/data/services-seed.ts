import type { ServiceCategory, CreateServiceInput } from "@/types/service";

// Seed data for 30 pain management services
// Organized by category with appropriate icons from Lucide React

export const servicesSeedData: CreateServiceInput[] = [
  // ============================================
  // Injection Therapies (6 services)
  // ============================================
  {
    name: "Injection Therapy",
    slug: "injection-therapy",
    iconName: "Syringe",
    description:
      "Corticosteroid and other therapeutic injections for pain relief",
    category: "injection" as ServiceCategory,
    displayOrder: 1,
  },
  {
    name: "Epidural Steroid Injections",
    slug: "epidural-steroid-injections",
    iconName: "Syringe",
    description:
      "Targeted epidural injections to reduce spinal inflammation and pain",
    category: "injection" as ServiceCategory,
    displayOrder: 2,
  },
  {
    name: "Facet Joint Injections",
    slug: "facet-joint-injections",
    iconName: "Syringe",
    description:
      "Injections targeting spinal facet joints for back and neck pain",
    category: "injection" as ServiceCategory,
    displayOrder: 3,
  },
  {
    name: "Trigger Point Injections",
    slug: "trigger-point-injections",
    iconName: "Target",
    description:
      "Targeted injections to release muscle knots and reduce myofascial pain",
    category: "injection" as ServiceCategory,
    displayOrder: 4,
  },
  {
    name: "Joint Injections",
    slug: "joint-injections",
    iconName: "Syringe",
    description:
      "Therapeutic injections for knee, hip, shoulder, and other joint pain",
    category: "injection" as ServiceCategory,
    displayOrder: 5,
  },
  {
    name: "Botox for Pain",
    slug: "botox-for-pain",
    iconName: "Syringe",
    description:
      "Botulinum toxin injections for chronic migraines and muscle spasms",
    category: "injection" as ServiceCategory,
    displayOrder: 6,
  },

  // ============================================
  // Procedures (6 services)
  // ============================================
  {
    name: "Nerve Blocks",
    slug: "nerve-blocks",
    iconName: "Zap",
    description: "Targeted nerve blocks to interrupt pain signals",
    category: "procedure" as ServiceCategory,
    displayOrder: 7,
  },
  {
    name: "Spinal Cord Stimulation",
    slug: "spinal-cord-stimulation",
    iconName: "Cpu",
    description: "Implantable devices to manage chronic pain through electrical stimulation",
    category: "procedure" as ServiceCategory,
    displayOrder: 8,
  },
  {
    name: "Radiofrequency Ablation",
    slug: "radiofrequency-ablation",
    iconName: "Radio",
    description:
      "Heat-based nerve ablation for long-lasting pain relief",
    category: "procedure" as ServiceCategory,
    displayOrder: 9,
  },
  {
    name: "Intrathecal Pump",
    slug: "intrathecal-pump",
    iconName: "Droplet",
    description:
      "Implanted pumps delivering medication directly to the spinal fluid",
    category: "procedure" as ServiceCategory,
    displayOrder: 10,
  },
  {
    name: "Kyphoplasty",
    slug: "kyphoplasty",
    iconName: "Bone",
    description:
      "Minimally invasive procedure for vertebral compression fractures",
    category: "procedure" as ServiceCategory,
    displayOrder: 11,
  },
  {
    name: "Discography",
    slug: "discography",
    iconName: "Circle",
    description:
      "Diagnostic procedure to identify painful spinal discs",
    category: "procedure" as ServiceCategory,
    displayOrder: 12,
  },

  // ============================================
  // Physical Therapies (5 services)
  // ============================================
  {
    name: "Physical Therapy",
    slug: "physical-therapy",
    iconName: "Activity",
    description:
      "Exercises and treatments to improve mobility and reduce pain",
    category: "physical" as ServiceCategory,
    displayOrder: 13,
  },
  {
    name: "Massage Therapy",
    slug: "massage-therapy",
    iconName: "Hand",
    description: "Therapeutic massage for pain and tension relief",
    category: "physical" as ServiceCategory,
    displayOrder: 14,
  },
  {
    name: "Chiropractic Care",
    slug: "chiropractic-care",
    iconName: "Spline",
    description: "Spinal adjustments and musculoskeletal treatments",
    category: "physical" as ServiceCategory,
    displayOrder: 15,
  },
  {
    name: "Acupuncture",
    slug: "acupuncture",
    iconName: "Target",
    description: "Traditional Chinese medicine techniques for pain relief",
    category: "physical" as ServiceCategory,
    displayOrder: 16,
  },
  {
    name: "Aquatic Therapy",
    slug: "aquatic-therapy",
    iconName: "Waves",
    description:
      "Water-based exercises for low-impact pain rehabilitation",
    category: "physical" as ServiceCategory,
    displayOrder: 17,
  },

  // ============================================
  // Diagnostic Services (4 services)
  // ============================================
  {
    name: "EMG/Nerve Studies",
    slug: "emg-nerve-studies",
    iconName: "Activity",
    description:
      "Electromyography and nerve conduction studies for pain diagnosis",
    category: "diagnostic" as ServiceCategory,
    displayOrder: 18,
  },
  {
    name: "Diagnostic Imaging",
    slug: "diagnostic-imaging",
    iconName: "Scan",
    description:
      "X-ray, MRI, and CT imaging for comprehensive pain evaluation",
    category: "diagnostic" as ServiceCategory,
    displayOrder: 19,
  },
  {
    name: "Pain Assessment",
    slug: "pain-assessment",
    iconName: "ClipboardList",
    description:
      "Comprehensive evaluation to identify pain sources and create treatment plans",
    category: "diagnostic" as ServiceCategory,
    displayOrder: 20,
  },
  {
    name: "Functional Capacity Evaluation",
    slug: "functional-capacity-evaluation",
    iconName: "Gauge",
    description:
      "Assessment of physical abilities and limitations for treatment planning",
    category: "diagnostic" as ServiceCategory,
    displayOrder: 21,
  },

  // ============================================
  // Pain Management (5 services)
  // ============================================
  {
    name: "Medication Management",
    slug: "medication-management",
    iconName: "Pill",
    description: "Prescription management and medication optimization",
    category: "management" as ServiceCategory,
    displayOrder: 22,
  },
  {
    name: "Psychological Services",
    slug: "psychological-services",
    iconName: "Brain",
    description:
      "Pain psychology and cognitive behavioral therapy for chronic pain",
    category: "management" as ServiceCategory,
    displayOrder: 23,
  },
  {
    name: "Pain Counseling",
    slug: "pain-counseling",
    iconName: "MessageCircle",
    description:
      "Supportive counseling to help cope with chronic pain challenges",
    category: "management" as ServiceCategory,
    displayOrder: 24,
  },
  {
    name: "Biofeedback",
    slug: "biofeedback",
    iconName: "Monitor",
    description:
      "Mind-body technique using electronic monitoring to control pain",
    category: "management" as ServiceCategory,
    displayOrder: 25,
  },
  {
    name: "Sleep Medicine",
    slug: "sleep-medicine",
    iconName: "Moon",
    description:
      "Treatment for sleep disorders related to chronic pain conditions",
    category: "management" as ServiceCategory,
    displayOrder: 26,
  },

  // ============================================
  // Specialized Treatments (4 services)
  // ============================================
  {
    name: "Regenerative Medicine",
    slug: "regenerative-medicine",
    iconName: "Leaf",
    description: "PRP therapy, stem cell treatments, and tissue regeneration",
    category: "specialized" as ServiceCategory,
    displayOrder: 27,
  },
  {
    name: "TENS Therapy",
    slug: "tens-therapy",
    iconName: "Zap",
    description:
      "Transcutaneous electrical nerve stimulation for pain relief",
    category: "specialized" as ServiceCategory,
    displayOrder: 28,
  },
  {
    name: "Ketamine Infusion",
    slug: "ketamine-infusion",
    iconName: "Droplet",
    description:
      "IV ketamine therapy for treatment-resistant chronic pain",
    category: "specialized" as ServiceCategory,
    displayOrder: 29,
  },
  {
    name: "Workers Comp Evaluation",
    slug: "workers-comp-evaluation",
    iconName: "Briefcase",
    description:
      "Specialized evaluations and treatment for workplace injuries",
    category: "specialized" as ServiceCategory,
    displayOrder: 30,
  },
];

// Export category information for reference
export const categoryOrder: ServiceCategory[] = [
  "injection",
  "procedure",
  "physical",
  "diagnostic",
  "management",
  "specialized",
];

// Validate that we have exactly 30 services
if (servicesSeedData.length !== 30) {
  console.warn(
    `Warning: Expected 30 services but found ${servicesSeedData.length}`
  );
}
