/**
 * Generate Consult Blog Posts
 *
 * Generates 24 blog posts for the PainConsult AI content push.
 * Uses OpenRouter (Claude Sonnet) for content generation, then inserts
 * into the blog_posts table as drafts with proper category/tag links.
 *
 * Usage:
 *   npx tsx scripts/generate-consult-blog-posts.ts
 *   npx tsx scripts/generate-consult-blog-posts.ts --dry-run
 *   npx tsx scripts/generate-consult-blog-posts.ts --priority 1
 *   npx tsx scripts/generate-consult-blog-posts.ts --cluster understanding-pain
 */

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { db } from "@/lib/db";
import {
  blogPosts,
  blogCategories,
  blogTags,
  blogPostCategories,
  blogPostTags,
} from "@/lib/schema";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ClusterKey =
  | "understanding-pain"
  | "need-doctor"
  | "appointment-prep"
  | "treatment-comparison";

interface PostDef {
  title: string;
  slug: string;
  cluster: ClusterKey;
  ctaTemplate: string;
  keywords: string[];
  h2Structure: string[];
  priority: 1 | 2 | 3;
}

// ---------------------------------------------------------------------------
// CTAs per cluster
// ---------------------------------------------------------------------------

const CLUSTER_CTAS: Record<ClusterKey, string> = {
  "understanding-pain":
    'Still not sure what\'s causing your pain? <a href="/consult">Try PainConsult AI</a> for a free assessment.',
  "need-doctor":
    'Get an evidence-based assessment in minutes — no appointment needed. <a href="/consult">Try PainConsult AI</a>',
  "appointment-prep":
    'Get a personalized appointment prep document with questions for your doctor. <a href="/consult">Start with PainConsult AI</a>',
  "treatment-comparison":
    'Not sure which treatment is right for you? <a href="/consult">PainConsult AI</a> can help narrow it down.',
};

// ---------------------------------------------------------------------------
// Category + tag mappings
// ---------------------------------------------------------------------------

const CLUSTER_CATEGORY: Record<ClusterKey, string> = {
  "understanding-pain": "Pain Education",
  "need-doctor": "Patient Resources",
  "appointment-prep": "Patient Resources",
  "treatment-comparison": "Treatment Options",
};

const CLUSTER_TAGS: Record<ClusterKey, string[]> = {
  "understanding-pain": ["pain-symptoms", "painconsult-ai"],
  "need-doctor": ["when-to-see-doctor", "painconsult-ai"],
  "appointment-prep": ["appointment-prep", "painconsult-ai"],
  "treatment-comparison": ["treatment-comparison", "painconsult-ai"],
};

// Friendly display names for tags (slug → name)
const TAG_NAMES: Record<string, string> = {
  "pain-symptoms": "Pain Symptoms",
  "when-to-see-doctor": "When to See a Doctor",
  "appointment-prep": "Appointment Prep",
  "treatment-comparison": "Treatment Comparison",
  "painconsult-ai": "PainConsult AI",
};

// ---------------------------------------------------------------------------
// Post definitions
// ---------------------------------------------------------------------------

const POSTS: PostDef[] = [
  // ── Cluster A: Understanding Your Pain ─────────────────────────────────
  {
    title: "What Causes Lower Back Pain? 7 Common Reasons",
    slug: "what-causes-lower-back-pain-7-common-reasons",
    cluster: "understanding-pain",
    ctaTemplate: CLUSTER_CTAS["understanding-pain"],
    keywords: ["lower back pain causes", "why does my back hurt", "back pain reasons"],
    h2Structure: [
      "Why Lower Back Pain Is So Common",
      "Muscle Strain and Overuse",
      "Herniated or Bulging Discs",
      "Spinal Stenosis",
      "Sacroiliac Joint Dysfunction",
      "Poor Posture and Sedentary Habits",
      "Sciatica as a Back Pain Driver",
      "Structural Conditions: Scoliosis and Spondylolisthesis",
      "When to See a Specialist",
    ],
    priority: 1,
  },
  {
    title: "Piriformis Syndrome vs Sciatica: How to Tell the Difference",
    slug: "piriformis-syndrome-vs-sciatica-how-to-tell-the-difference",
    cluster: "understanding-pain",
    ctaTemplate: CLUSTER_CTAS["understanding-pain"],
    keywords: ["piriformis syndrome vs sciatica", "sciatica vs piriformis syndrome", "piriformis syndrome symptoms", "sciatic nerve pain"],
    h2Structure: [
      "What Is Sciatica?",
      "What Is Piriformis Syndrome?",
      "How the Symptoms Overlap",
      "Key Differences: Location, Triggers, and Sensation",
      "How Each Condition Is Diagnosed",
      "Treatment Approaches for Each",
      "When to Get a Professional Evaluation",
    ],
    priority: 1,
  },
  {
    title: "What Causes Knee Pain Without Injury? A Guide by Age Group",
    slug: "what-causes-knee-pain-without-injury-guide-by-age",
    cluster: "understanding-pain",
    ctaTemplate: CLUSTER_CTAS["understanding-pain"],
    keywords: ["what causes knee pain without injury", "what causes sudden knee pain without injury", "knee pain causes", "knee pain by age", "can sciatica cause knee pain"],
    h2Structure: [
      "Why Age Matters for Knee Pain",
      "Teens and Young Adults: Growth, Sports, and Overuse",
      "Adults 30–50: Meniscus Tears, IT Band, and Ligament Issues",
      "Adults 50+: Osteoarthritis and Cartilage Wear",
      "Pain Location as a Clue (Front, Back, Inside, Outside)",
      "When Knee Pain Is an Emergency",
      "Next Steps for Diagnosis and Relief",
    ],
    priority: 2,
  },
  {
    title: "Neuropathy Symptoms in Feet and Hands: Types, Causes & When to Seek Help",
    slug: "neuropathy-symptoms-feet-hands-types-causes",
    cluster: "understanding-pain",
    ctaTemplate: CLUSTER_CTAS["understanding-pain"],
    keywords: ["neuropathy symptoms in feet", "neuropathy in the foot symptoms", "small fiber neuropathy symptoms", "what are the symptoms of neuropathy", "peripheral neuropathy causes", "beginning symptoms of neuropathy"],
    h2Structure: [
      "What Is Neuropathy?",
      "Peripheral vs. Central Neuropathy",
      "Common Causes: Diabetes, Infections, Vitamin Deficiencies, and More",
      "Symptoms Beyond Tingling: What Neuropathy Feels Like",
      "How Neuropathy Is Diagnosed",
      "Treatment Options That Can Help",
      "When to See a Specialist",
    ],
    priority: 2,
  },
  {
    title: "Chronic Neck Pain: Causes Beyond 'Bad Posture'",
    slug: "chronic-neck-pain-causes-beyond-bad-posture",
    cluster: "understanding-pain",
    ctaTemplate: CLUSTER_CTAS["understanding-pain"],
    keywords: ["chronic neck pain causes", "neck pain not posture", "why does my neck hurt"],
    h2Structure: [
      "Why We Default to Blaming Posture",
      "Cervical Disc Disease and Herniation",
      "Facet Joint Degeneration",
      "Myofascial Trigger Points in the Neck",
      "Thoracic Outlet Syndrome",
      "Stress, Anxiety, and the Neck-Pain Connection",
      "When Neck Pain Points to Something More Serious",
      "Getting the Right Diagnosis",
    ],
    priority: 2,
  },
  {
    title: "Hip Pain That Wakes You Up at Night: What It Could Mean",
    slug: "hip-pain-that-wakes-you-up-at-night-what-it-could-mean",
    cluster: "understanding-pain",
    ctaTemplate: CLUSTER_CTAS["understanding-pain"],
    keywords: ["hip pain at night", "why does my hip hurt at night", "nighttime hip pain causes"],
    h2Structure: [
      "Why Nighttime Hip Pain Is Different",
      "Bursitis: The Most Common Culprit",
      "Hip Labral Tears",
      "Osteoarthritis of the Hip",
      "Referred Pain From the Lower Back",
      "Sleep Position and Its Role",
      "When to Stop Waiting and See a Doctor",
    ],
    priority: 2,
  },
  {
    title: "Nerve Pain vs Muscle Pain: What the Type of Pain Tells You",
    slug: "nerve-pain-vs-muscle-pain-what-the-type-tells-you",
    cluster: "understanding-pain",
    ctaTemplate: CLUSTER_CTAS["understanding-pain"],
    keywords: ["nerve pain vs muscle pain", "pinched nerve vs pulled muscle", "burning pain meaning", "aching pain vs burning pain", "types of pain sensations"],
    h2Structure: [
      "Why Pain Quality Matters",
      "Burning Pain: What It Usually Signals",
      "Aching Pain: Muscles, Joints, and Inflammation",
      "Sharp or Stabbing Pain",
      "Throbbing Pain",
      "Pressure or Squeezing Sensations",
      "Using Pain Type to Guide Your Next Steps",
    ],
    priority: 2,
  },
  {
    title: "Shoulder Pain Without Injury: 5 Surprising Causes",
    slug: "shoulder-pain-without-injury-5-surprising-causes",
    cluster: "understanding-pain",
    ctaTemplate: CLUSTER_CTAS["understanding-pain"],
    keywords: ["shoulder pain no injury", "why does my shoulder hurt", "shoulder pain causes"],
    h2Structure: [
      "When There's No Obvious Reason for Shoulder Pain",
      "Rotator Cuff Tendinitis from Repetitive Motion",
      "Frozen Shoulder (Adhesive Capsulitis)",
      "Referred Pain From the Neck or Chest",
      "Acromioclavicular (AC) Joint Degeneration",
      "Calcific Tendinitis",
      "Getting a Proper Diagnosis",
    ],
    priority: 3,
  },
  {
    title: "Fibromyalgia vs. Myofascial Pain Syndrome: Key Differences",
    slug: "fibromyalgia-vs-myofascial-pain-syndrome-key-differences",
    cluster: "understanding-pain",
    ctaTemplate: CLUSTER_CTAS["understanding-pain"],
    keywords: ["fibromyalgia vs myofascial pain", "fibromyalgia differences", "myofascial pain syndrome"],
    h2Structure: [
      "Why These Two Are So Often Confused",
      "What Is Fibromyalgia?",
      "What Is Myofascial Pain Syndrome?",
      "How the Pain Differs: Widespread vs. Regional",
      "Other Symptoms That Set Them Apart",
      "Diagnosis: What to Expect",
      "Treatment Approaches for Each Condition",
      "Can You Have Both?",
    ],
    priority: 3,
  },
  {
    title: "Why Does Pain Move Around My Body?",
    slug: "why-does-pain-move-around-my-body",
    cluster: "understanding-pain",
    ctaTemplate: CLUSTER_CTAS["understanding-pain"],
    keywords: ["why does pain move around body", "moving pain", "pain that shifts location"],
    h2Structure: [
      "Is Moving Pain Normal?",
      "Referred Pain: When the Source Is Elsewhere",
      "Inflammation and How It Spreads",
      "Central Sensitization and Widespread Pain",
      "Nerve Pain and Its Traveling Nature",
      "When Migratory Pain Signals a Systemic Condition",
      "What to Tell Your Doctor",
    ],
    priority: 3,
  },

  // ── Cluster B: Do I Need a Doctor? ─────────────────────────────────────
  {
    title: "5 Signs Your Back Pain Needs Professional Help",
    slug: "5-signs-your-back-pain-needs-professional-help",
    cluster: "need-doctor",
    ctaTemplate: CLUSTER_CTAS["need-doctor"],
    keywords: ["when to see doctor for back pain", "back pain red flags", "serious back pain signs"],
    h2Structure: [
      "When Back Pain Is More Than a Muscle Strain",
      "Sign 1: Pain That Doesn't Improve After 4–6 Weeks",
      "Sign 2: Pain That Radiates Down the Leg",
      "Sign 3: Numbness, Tingling, or Weakness",
      "Sign 4: Pain After a Fall or Trauma",
      "Sign 5: Pain With Bladder or Bowel Changes",
      "What a Pain Specialist Can Do That Rest Cannot",
    ],
    priority: 1,
  },
  {
    title: "Numbness and Tingling: When It's Normal vs. When to Worry",
    slug: "numbness-and-tingling-when-its-normal-vs-when-to-worry",
    cluster: "need-doctor",
    ctaTemplate: CLUSTER_CTAS["need-doctor"],
    keywords: ["numbness and tingling when to worry", "is tingling serious", "numbness causes"],
    h2Structure: [
      "What Causes Numbness and Tingling?",
      "Temporary Causes: Pressure, Position, and Circulation",
      "When Tingling Points to Nerve Compression",
      "Diabetic Neuropathy and Numbness",
      "Warning Signs That Require Immediate Attention",
      "How Doctors Evaluate Numbness and Tingling",
      "When to See a Pain Specialist",
    ],
    priority: 1,
  },
  {
    title: "When Headaches Are More Than Just Headaches",
    slug: "when-headaches-are-more-than-just-headaches",
    cluster: "need-doctor",
    ctaTemplate: CLUSTER_CTAS["need-doctor"],
    keywords: ["serious headache signs", "when to worry about headaches", "headache red flags"],
    h2Structure: [
      "Most Headaches Are Not Dangerous — But Some Are",
      "Tension vs. Migraine vs. Cluster Headaches",
      "Headache Red Flags That Need Immediate Care",
      "Chronic Daily Headaches: A Different Problem",
      "Cervicogenic Headaches: When the Source Is Your Neck",
      "How a Pain Specialist Can Help With Chronic Headaches",
      "When to Go to the ER vs. Schedule an Appointment",
    ],
    priority: 2,
  },
  {
    title: "Is My Joint Pain Arthritis? How to Know Before Your Appointment",
    slug: "is-my-joint-pain-arthritis-how-to-know-before-your-appointment",
    cluster: "need-doctor",
    ctaTemplate: CLUSTER_CTAS["need-doctor"],
    keywords: ["is my pain arthritis", "arthritis symptoms", "joint pain vs arthritis"],
    h2Structure: [
      "The Many Causes of Joint Pain",
      "Osteoarthritis: Wear and Tear Over Time",
      "Rheumatoid Arthritis: An Immune System Condition",
      "Gout and Crystal-Induced Arthritis",
      "How Arthritis Is Diagnosed",
      "What to Track Before Your Appointment",
      "Next Steps if You Suspect Arthritis",
    ],
    priority: 2,
  },
  {
    title: "Post-Surgery Pain That Won't Go Away: What to Do Next",
    slug: "post-surgery-pain-that-wont-go-away-what-to-do-next",
    cluster: "need-doctor",
    ctaTemplate: CLUSTER_CTAS["need-doctor"],
    keywords: ["post surgery chronic pain", "pain after surgery won't go away", "chronic post-surgical pain"],
    h2Structure: [
      "Why Some Pain Persists After Surgery",
      "Chronic Post-Surgical Pain: How Common Is It?",
      "Nerve Damage as a Contributing Factor",
      "Scar Tissue and Adhesions",
      "When Persistent Pain Signals a Complication",
      "Pain Management Options for Post-Surgical Pain",
      "How to Talk to Your Surgeon and a Pain Specialist",
    ],
    priority: 3,
  },

  // ── Cluster C: Appointment Preparation ──────────────────────────────────
  {
    title: "How to Describe Your Pain to a Doctor (So They Actually Understand)",
    slug: "how-to-describe-your-pain-to-a-doctor-so-they-actually-understand",
    cluster: "appointment-prep",
    ctaTemplate: CLUSTER_CTAS["appointment-prep"],
    keywords: ["how to describe pain to doctor", "pain description tips", "explaining pain to doctor"],
    h2Structure: [
      "Why Describing Pain Is Harder Than It Sounds",
      "Location: Be as Specific as Possible",
      "Quality: Find the Right Words for What It Feels Like",
      "Intensity: Using Pain Scales Effectively",
      "Timing: When It Starts, Peaks, and Fades",
      "What Makes It Better or Worse",
      "How Pain Affects Your Daily Life",
      "A Simple Framework to Use at Your Appointment",
    ],
    priority: 1,
  },
  {
    title: "10 Questions to Ask Your Pain Management Doctor at Your First Visit",
    slug: "10-questions-to-ask-your-pain-management-doctor-at-your-first-visit",
    cluster: "appointment-prep",
    ctaTemplate: CLUSTER_CTAS["appointment-prep"],
    keywords: ["questions to ask pain doctor", "pain management first visit questions", "pain clinic appointment prep"],
    h2Structure: [
      "Why the Right Questions Change Everything",
      "Questions About Your Diagnosis",
      "Questions About Treatment Options",
      "Questions About Risks and Side Effects",
      "Questions About Goals and Timelines",
      "Questions About Lifestyle and Self-Care",
      "Questions About Follow-Up and Referrals",
      "Bonus: Questions to Ask if You're Unsure About a Recommendation",
    ],
    priority: 2,
  },
  {
    title: "What to Expect at a Pain Clinic: A Complete First Visit Guide",
    slug: "what-to-expect-at-a-pain-clinic-a-complete-first-visit-guide",
    cluster: "appointment-prep",
    ctaTemplate: CLUSTER_CTAS["appointment-prep"],
    keywords: ["what to expect pain clinic", "pain management first visit", "pain clinic appointment guide"],
    h2Structure: [
      "What Makes a Pain Clinic Different From a Regular Doctor",
      "Before You Go: What to Bring",
      "Check-In and Intake Paperwork",
      "The Physical Examination and Pain Assessment",
      "Diagnostic Tests That Might Be Ordered",
      "Discussing Your Treatment Plan",
      "What Happens After the First Visit",
      "Tips to Get the Most From Your Appointment",
    ],
    priority: 2,
  },
  {
    title: "Pain Diary 101: What to Track Before Your Appointment",
    slug: "pain-diary-101-what-to-track-before-your-appointment",
    cluster: "appointment-prep",
    ctaTemplate: CLUSTER_CTAS["appointment-prep"],
    keywords: ["pain diary what to track", "pain journal for doctor", "how to keep a pain diary"],
    h2Structure: [
      "Why Doctors Ask Patients to Keep a Pain Diary",
      "The Core Elements to Record Every Day",
      "Tracking Pain Levels: Beyond a Number",
      "Activity, Sleep, and Mood Connections",
      "Medication and Treatment Tracking",
      "Digital vs. Paper: Choosing What Works for You",
      "How to Present Your Diary to Your Doctor",
    ],
    priority: 3,
  },

  // ── Cluster D: Treatment Comparison ────────────────────────────────────
  {
    title: "Non-Opioid Pain Management: A Complete Guide to Alternatives",
    slug: "non-opioid-pain-management-a-complete-guide-to-alternatives",
    cluster: "treatment-comparison",
    ctaTemplate: CLUSTER_CTAS["treatment-comparison"],
    keywords: ["non opioid pain management", "non opioid pain management options", "alternatives to opioids for pain", "innovations in non-opioid pain management 2025", "opioid-free pain treatment"],
    h2Structure: [
      "Why Non-Opioid Options Are the First Line of Defense",
      "Physical Therapy and Movement-Based Care",
      "Interventional Procedures: Injections, Nerve Blocks, and More",
      "Medications That Are Not Opioids",
      "Neuromodulation: Spinal Cord Stimulation and TENS",
      "Integrative Approaches: Acupuncture, Massage, and Mindfulness",
      "Regenerative Medicine Options",
      "Building a Multimodal Pain Plan",
    ],
    priority: 2,
  },
  {
    title: "Physical Therapy vs. Injections for Back Pain: Which Is Right?",
    slug: "physical-therapy-vs-injections-for-back-pain-which-is-right",
    cluster: "treatment-comparison",
    ctaTemplate: CLUSTER_CTAS["treatment-comparison"],
    keywords: ["physical therapy vs injections back pain", "back pain treatment comparison", "PT vs epidural injection"],
    h2Structure: [
      "Two of the Most Recommended Back Pain Treatments",
      "How Physical Therapy Works for Back Pain",
      "How Injections Work: Types and Goals",
      "When Physical Therapy Is the Better Choice",
      "When Injections Are More Appropriate",
      "Combining Both: A Common and Effective Approach",
      "Questions to Ask Your Doctor",
    ],
    priority: 2,
  },
  {
    title: "PRP vs. Cortisone Injections: What the Research Shows",
    slug: "prp-vs-cortisone-injections-what-the-research-shows",
    cluster: "treatment-comparison",
    ctaTemplate: CLUSTER_CTAS["treatment-comparison"],
    keywords: ["PRP vs cortisone injection", "platelet rich plasma vs steroid injection", "PRP injection research"],
    h2Structure: [
      "Two Different Approaches to Injection Therapy",
      "How Cortisone Injections Work",
      "How PRP Injections Work",
      "What Studies Say About Effectiveness",
      "How Long Results Last: A Key Difference",
      "Cost, Availability, and Insurance Coverage",
      "Which Might Be Right for You",
    ],
    priority: 3,
  },
  {
    title: "Nerve Blocks vs. Medication for Chronic Pain: Pros and Cons",
    slug: "nerve-blocks-vs-medication-for-chronic-pain-pros-and-cons",
    cluster: "treatment-comparison",
    ctaTemplate: CLUSTER_CTAS["treatment-comparison"],
    keywords: ["nerve block vs medication chronic pain", "nerve block pros cons", "pain medication alternatives"],
    h2Structure: [
      "Managing Chronic Pain: Why Treatment Choice Matters",
      "How Nerve Blocks Work",
      "Types of Nerve Blocks Used for Chronic Pain",
      "Medication for Chronic Pain: Benefits and Limitations",
      "Side Effects and Risks Compared",
      "Duration and Frequency Considerations",
      "Who Is a Good Candidate for Each",
      "Making the Decision With Your Doctor",
    ],
    priority: 3,
  },
  {
    title: "When to Consider Spinal Cord Stimulation",
    slug: "when-to-consider-spinal-cord-stimulation",
    cluster: "treatment-comparison",
    ctaTemplate: CLUSTER_CTAS["treatment-comparison"],
    keywords: ["spinal cord stimulation when to consider", "SCS for chronic pain", "is spinal cord stimulation right for me"],
    h2Structure: [
      "What Is Spinal Cord Stimulation?",
      "How the Procedure Works",
      "Conditions It's Approved to Treat",
      "Who Is a Candidate?",
      "The Trial Period: How It Works",
      "What to Expect After Implantation",
      "Risks, Limitations, and Realistic Expectations",
      "How to Talk to Your Doctor About SCS",
    ],
    priority: 3,
  },
];

// ---------------------------------------------------------------------------
// Content generation
// ---------------------------------------------------------------------------

function buildPrompt(post: PostDef): string {
  const h2List = post.h2Structure.map((h, i) => `  ${i + 1}. ${h}`).join("\n");
  const ctaBlock = `<div class="cta-block"><p>${post.ctaTemplate}</p></div>`;

  return `You are a board-certified pain management medical writer creating patient-facing content for PainClinics.com — a directory of 5,000+ pain management clinics across the United States.

Write a blog post titled: "${post.title}"

TARGET KEYWORDS: ${post.keywords.join(", ")}

REQUIRED H2 STRUCTURE (use these headings in order):
${h2List}

REQUIREMENTS:

1. FORMAT: Return only HTML content — no JSON, no markdown. Use <h2>, <h3>, <p>, <ul>, <li> tags only. No <html>, <head>, <body>, or <article> wrappers.

2. LENGTH: 800–1,200 words of body copy.

3. CTA PLACEMENT:
   - After the first H2 section, insert this exact HTML block:
     ${ctaBlock}
   - Repeat the same CTA block at the very end of the article, before the "Find a Specialist" section.

4. INTERNAL LINKS: Naturally link to relevant pages using <a href="..."> tags. Use these where relevant:
   - /consult — PainConsult AI free assessment
   - /treatment-options — overview of treatment types
   - /treatment-options/physical-therapy — physical therapy
   - /treatment-options/interventional-pain-management — injections and procedures
   - /treatment-options/regenerative-orthopedic-medicine — PRP, stem cell, regenerative care
   - /pain-management-guide — general pain management guide
   - /clinics — find a pain clinic
   - /is-my-pain-serious — is my pain serious
   - /what-type-of-pain-doctor — which type of pain doctor to see
   - /prepare-for-pain-appointment — how to prepare for your appointment

5. CLOSE WITH a "Find a Specialist" section:
   <h2>Find a Pain Specialist Near You</h2>
   <p>If your [relevant pain type] is affecting your daily life, a pain management specialist can help. <a href="/clinics">Browse our directory of pain clinics</a> to find a provider near you and start your path to relief.</p>

6. E-E-A-T COMPLIANCE:
   - Write in an authoritative, trustworthy voice consistent with a medical publication
   - Reference research generically ("studies show", "research suggests", "clinical evidence indicates") — never cite specific paper titles or fake statistics
   - Use person-first language ("people living with chronic pain" not "chronic pain sufferers")
   - Avoid outcome promises ("may help" not "will cure")
   - No self-diagnosis criteria that could replace medical evaluation

7. MEDICAL GUARDRAILS:
   - No specific drug names or dosages
   - No self-diagnosis criteria
   - No guaranteed outcome language
   - Always recommend consulting a healthcare provider for personal medical decisions

8. READING LEVEL: 7th–8th grade. Short sentences, plain language, no jargon without explanation.

Return ONLY the HTML content. No preamble, no explanation, no markdown.`;
}

async function generateContent(post: PostDef, attempt = 1): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const openrouter = createOpenRouter({ apiKey });
  const model = process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4-5";

  const { text } = await generateText({
    model: openrouter(model),
    prompt: buildPrompt(post),
    maxOutputTokens: 4096,
    temperature: 0.7,
  });

  // Strip any accidental markdown code fences
  const cleaned = text
    .replace(/^```html\n?/i, "")
    .replace(/^```\n?/, "")
    .replace(/\n?```$/, "")
    .trim();

  if (!cleaned.startsWith("<")) {
    if (attempt < 3) {
      console.warn(`    HTML parse failed (attempt ${attempt}), retrying...`);
      await new Promise((r) => setTimeout(r, 2000));
      return generateContent(post, attempt + 1);
    }
    throw new Error("Response did not return HTML after 3 attempts");
  }

  return cleaned;
}

// ---------------------------------------------------------------------------
// Meta description: strip HTML and take first 160 chars
// ---------------------------------------------------------------------------

function extractMetaDescription(html: string): string {
  const plain = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > 160 ? plain.slice(0, 157) + "..." : plain;
}

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

async function getOrCreateCategory(name: string): Promise<string> {
  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const existing = await db
    .select({ id: blogCategories.id })
    .from(blogCategories)
    .where(eq(blogCategories.slug, slug))
    .limit(1);

  if (existing.length > 0 && existing[0]) return existing[0].id;

  const id = createId();
  await db.insert(blogCategories).values({ id, name, slug });
  console.log(`    + Created category: ${name}`);
  return id;
}

async function getOrCreateTag(slug: string): Promise<string> {
  const existing = await db
    .select({ id: blogTags.id })
    .from(blogTags)
    .where(eq(blogTags.slug, slug))
    .limit(1);

  if (existing.length > 0 && existing[0]) return existing[0].id;

  const name = TAG_NAMES[slug] ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const id = createId();
  await db.insert(blogTags).values({ id, name, slug });
  console.log(`    + Created tag: ${name}`);
  return id;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  const priorityArg = args.find((a) => a.startsWith("--priority"));
  const maxPriority = priorityArg ? parseInt(priorityArg.split("=")[1] ?? priorityArg.split(" ")[1] ?? "3", 10) : 3;

  const clusterArg = args.find((a) => a.startsWith("--cluster"));
  const targetCluster = clusterArg
    ? ((clusterArg.split("=")[1] ?? args[args.indexOf(clusterArg) + 1]) as ClusterKey | undefined)
    : undefined;

  // Filter posts
  const postsToProcess = POSTS.filter((p) => {
    if (p.priority > maxPriority) return false;
    if (targetCluster && p.cluster !== targetCluster) return false;
    return true;
  });

  console.log(`\nPainConsult Blog Post Generator`);
  console.log(`================================`);
  console.log(`Posts to process: ${postsToProcess.length}`);
  if (maxPriority < 3) console.log(`Priority filter: <= ${maxPriority}`);
  if (targetCluster) console.log(`Cluster filter: ${targetCluster}`);

  if (dryRun) {
    console.log("\n[DRY RUN] Would generate:");
    for (const post of postsToProcess) {
      console.log(`  [P${post.priority}] [${post.cluster}] ${post.title}`);
      console.log(`         /blog/${post.slug}`);
    }
    process.exit(0);
  }

  // Check for existing slugs upfront
  const existingRows = await db
    .select({ slug: blogPosts.slug })
    .from(blogPosts);
  const existingSlugs = new Set(existingRows.map((r) => r.slug));

  const toGenerate = postsToProcess.filter((p) => {
    if (existingSlugs.has(p.slug)) {
      console.log(`  Skipping (already exists): ${p.slug}`);
      return false;
    }
    return true;
  });

  if (toGenerate.length === 0) {
    console.log("\nAll posts already exist. Nothing to do.");
    process.exit(0);
  }

  console.log(`\nGenerating ${toGenerate.length} posts...\n`);

  const errors: { title: string; error: string }[] = [];
  let created = 0;

  for (let i = 0; i < toGenerate.length; i++) {
    const post = toGenerate[i]!;
    console.log(`[${i + 1}/${toGenerate.length}] Generating: "${post.title}"...`);

    try {
      // 1. Generate content
      const content = await generateContent(post);
      const metaDescription = extractMetaDescription(content);

      // 2. Ensure category + tags exist
      const categoryId = await getOrCreateCategory(CLUSTER_CATEGORY[post.cluster]);
      const tagIds = await Promise.all(
        CLUSTER_TAGS[post.cluster].map((slug) => getOrCreateTag(slug))
      );

      // 3. Insert blog post
      const postId = createId();
      await db.insert(blogPosts).values({
        id: postId,
        title: post.title,
        slug: post.slug,
        content,
        excerpt: metaDescription,
        metaTitle: post.title,
        metaDescription,
        featuredImageUrl: null,
        featuredImageAlt: null,
        authorName: "PainClinics.com Editorial Team",
        authorSlug: "painclinics-editorial-team",
        status: "draft",
        publishedAt: null,
      });

      // 4. Link category
      await db.insert(blogPostCategories).values({
        postId,
        categoryId,
      });

      // 5. Link tags
      if (tagIds.length > 0) {
        await db.insert(blogPostTags).values(
          tagIds.map((tagId) => ({ postId, tagId }))
        );
      }

      console.log(`  ✓ Created draft: /blog/${post.slug} (${postId})`);
      created++;

      // Rate limit between posts
      if (i < toGenerate.length - 1) {
        await new Promise((r) => setTimeout(r, 3000));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ FAILED: ${message}`);
      errors.push({ title: post.title, error: message });
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`Created: ${created}`);
  console.log(`Failed: ${errors.length}`);

  if (errors.length > 0) {
    console.log(`\nFailed posts:`);
    for (const e of errors) {
      console.log(`  - ${e.title}`);
      console.log(`    ${e.error}`);
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
