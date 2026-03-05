import type { LucideIcon } from "lucide-react";
import { Search, Shield, TrendingDown, Users } from "lucide-react";

export interface SubNicheProblem {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface SubNicheConfig {
  slug: string;
  name: string;
  shortName: string;
  heroTitle: string;
  heroTitleGradient: string;
  heroSubtitle: string;
  heroBadge: string;
  problems: SubNicheProblem[];
  problemHeading: string;
  problemSubheading: string;
  toolCta: {
    text: string;
    href: string;
    description: string;
  };
  stats: {
    clinicCount: string;
    searchVolume: string;
  };
  finalCtaHeading: string;
  finalCtaSubtext: string;
  additionalFaqs: { question: string; answer: string }[];
  metaTitle: string;
  metaDescription: string;
}

export const subNicheConfigs: SubNicheConfig[] = [
  {
    slug: "neuropathy",
    name: "Neuropathy Treatment Centers",
    shortName: "Neuropathy Centers",
    heroTitle: "Neuropathy Patients Are",
    heroTitleGradient: "Searching For Help",
    heroSubtitle:
      "Millions of Americans suffer from neuropathy and actively search online for treatment. Claim your listing and connect with patients looking for nerve pain relief in your area.",
    heroBadge: "Built for Neuropathy Clinics",
    problems: [
      {
        icon: Search,
        title: "Patients Search, You Don't Show Up",
        description:
          "Neuropathy patients search for 'neuropathy treatment near me' hundreds of times daily. Without a presence, they find your competitors instead.",
      },
      {
        icon: Users,
        title: "Growing Patient Population",
        description:
          "With an aging population and rising diabetes rates, neuropathy is one of the fastest-growing pain conditions. More patients are searching than ever before.",
      },
      {
        icon: Shield,
        title: "Patients Need Education",
        description:
          "Many neuropathy patients don't know what treatments are available. They need educational content to understand their options before booking.",
      },
      {
        icon: TrendingDown,
        title: "Losing Patients to General Practices",
        description:
          "Without visibility, specialized neuropathy patients end up at general practitioners who may not offer the targeted treatments you provide.",
      },
    ],
    problemHeading: "Neuropathy Clinics Face Unique Challenges",
    problemSubheading:
      "Patients with nerve pain are actively searching, but most specialized clinics remain invisible online.",
    toolCta: {
      text: "Try Our Free Neuropathy Content Generator",
      href: "/tools/patient-education/neuropathy",
      description:
        "Generate patient education content about peripheral neuropathy, diabetic neuropathy, CRPS, and more — optimized for your clinic's website.",
    },
    stats: {
      clinicCount: "800+",
      searchVolume: "15,000+",
    },
    finalCtaHeading: "Ready to Reach Neuropathy Patients?",
    finalCtaSubtext:
      "Join hundreds of neuropathy treatment centers already connecting with patients through PainClinics.com.",
    additionalFaqs: [
      {
        question: "Do you list neuropathy-specific treatments?",
        answer:
          "Yes! Your listing can highlight specialized treatments like nerve decompression, scrambler therapy, spinal cord stimulation for neuropathy, and other nerve-specific procedures.",
      },
      {
        question: "Can I target diabetic neuropathy patients specifically?",
        answer:
          "Your listing showcases the specific neuropathy conditions you treat. Patients searching for diabetic neuropathy, peripheral neuropathy, or CRPS will find clinics that specialize in their condition.",
      },
    ],
    metaTitle: "List Your Neuropathy Clinic | PainClinics.com",
    metaDescription:
      "Get your neuropathy treatment center found by patients searching for nerve pain relief. Free listing with premium visibility options. 800+ neuropathy clinics listed.",
  },
  {
    slug: "back-pain",
    name: "Back Pain & Spine Clinics",
    shortName: "Back Pain Clinics",
    heroTitle: "Back Pain Patients Need",
    heroTitleGradient: "Your Expertise",
    heroSubtitle:
      "Back pain is the #1 reason patients search for pain management. Claim your listing and be the first clinic they find when searching for spine and back pain treatment.",
    heroBadge: "Built for Spine & Back Pain Clinics",
    problems: [
      {
        icon: Search,
        title: "Most Searched Pain Condition",
        description:
          "Back pain generates more patient searches than any other pain condition. If you're not visible, you're missing the largest patient pool in pain management.",
      },
      {
        icon: Users,
        title: "High Competition, Low Differentiation",
        description:
          "Patients see dozens of clinics for back pain. Without a strong profile highlighting your approach and specialties, you blend in with everyone else.",
      },
      {
        icon: Shield,
        title: "Patients Research Before Booking",
        description:
          "Back pain patients compare reviews, treatment options, and credentials extensively. A complete, professional listing converts browsers into patients.",
      },
      {
        icon: TrendingDown,
        title: "Losing Surgical Candidates",
        description:
          "Patients who need interventional procedures often don't know conservative options exist. Educating patients online brings them to you first.",
      },
    ],
    problemHeading: "The Back Pain Market Is Competitive",
    problemSubheading:
      "With thousands of patients searching daily, the clinics that show up first win the most patients.",
    toolCta: {
      text: "Try Our Free Back Pain Content Generator",
      href: "/tools/patient-education/back-pain",
      description:
        "Generate patient education content about sciatica, herniated discs, spinal stenosis, and more — ready for your website or patient handouts.",
    },
    stats: {
      clinicCount: "2,500+",
      searchVolume: "40,000+",
    },
    finalCtaHeading: "Ready to Attract More Back Pain Patients?",
    finalCtaSubtext:
      "Join thousands of spine and back pain clinics already growing their practice through PainClinics.com.",
    additionalFaqs: [
      {
        question: "Can I list specific spinal procedures I offer?",
        answer:
          "Absolutely. Your listing can showcase specific procedures like epidural injections, facet joint blocks, spinal cord stimulation, radiofrequency ablation, and other interventional treatments.",
      },
      {
        question: "How do patients search for back pain treatment?",
        answer:
          "Patients typically search by condition (sciatica, herniated disc) or by treatment type (epidural injection, back pain doctor near me). Our directory is optimized for all these search patterns.",
      },
    ],
    metaTitle: "List Your Back Pain Clinic | PainClinics.com",
    metaDescription:
      "Get your spine and back pain clinic found by patients. Free listing with premium visibility. 2,500+ back pain clinics listed across all 50 states.",
  },
];

export function getSubNicheConfig(slug: string): SubNicheConfig | null {
  return subNicheConfigs.find((c) => c.slug === slug) ?? null;
}

export function getAllSubNicheSlugs(): string[] {
  return subNicheConfigs.map((c) => c.slug);
}
