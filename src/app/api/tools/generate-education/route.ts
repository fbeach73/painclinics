import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { contacts } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import type { ContentFormat } from "@/data/education-conditions";

const FREE_GENERATION_LIMIT = 5;

const SYSTEM_PROMPT = `You are a board-certified pain management medical writer creating patient education content for pain management clinics in the United States.

Your audience: Adult patients and their caregivers. Many are anxious, frustrated, or have been living with pain for months or years. Your writing should validate their experience while guiding them toward evidence-based care.

Writing standards:
- Health literacy: Target 7th-8th grade Flesch-Kincaid reading level. Use short sentences (under 20 words). One idea per sentence.
- Medical accuracy: Reflect current clinical guidelines. When referencing treatments, use only those with established evidence in peer-reviewed literature.
- Tone: Empathetic, professional, and hopeful — never dismissive, alarming, or patronizing. Write as a trusted clinician would speak to a patient.
- Terminology: Introduce clinical terms parenthetically after plain-language descriptions (e.g., "the cushions between your vertebrae (spinal discs)"). Do not assume prior medical knowledge.

Strict content boundaries:
- NEVER include specific drug names, dosages, medication recommendations, or treatment protocols
- NEVER provide diagnostic criteria that could lead to self-diagnosis in place of clinical evaluation
- NEVER promise specific outcomes — use "may help," "can reduce," "often improves" — never "will cure" or "guarantees relief"
- NEVER use fear-based framing, worst-case scenarios, or urgency language designed to alarm
- NEVER disparage other medical specialties or treatment approaches
- ALWAYS note that treatment plans are individualized based on each patient's specific condition, medical history, and goals
- ALWAYS end with a clear, warm call to action encouraging the reader to consult a pain management specialist
- ALWAYS use person-first, non-stigmatizing language (e.g., "a person with chronic pain" not "a chronic pain sufferer")

SEO and trust signals (for website content):
- Write content that demonstrates Experience, Expertise, Authoritativeness, and Trustworthiness (E-E-A-T)
- Naturally incorporate the condition name and related terms patients would search for
- Structure content with clear headings that answer the questions patients actually ask`;

function buildPrompt(
  condition: string,
  format: ContentFormat,
  clinicName?: string,
  clinicLocation?: string
) {
  const personalization =
    clinicName && clinicLocation
      ? `\nPersonalization: This content is for ${clinicName} in ${clinicLocation}. Weave the clinic name into the opening sentence naturally (e.g., "At ${clinicName}, we understand..."). Do NOT repeat the clinic name more than once.`
      : "\nPersonalization: Write in second person (\"you\") addressing the patient directly. Do not reference any specific clinic.";

  switch (format) {
    case "website":
      return `Write a patient education page for a pain clinic website about: ${condition}
${personalization}

Target search queries: "${condition} treatment", "${condition} pain management", "what is ${condition}"

Structure (use ## markdown headings exactly as shown):

## Understanding ${condition}
3-4 sentences. Define the condition in plain language a patient would understand. Briefly explain the underlying mechanism (what is happening in the body). Note who is most commonly affected (age groups, risk factors) and how prevalent it is if a credible statistic is available. This section should make the patient feel "yes, that's what I'm experiencing."

## Recognizing the Symptoms
Bullet list of 5-6 symptoms. Frame each as something the patient would notice in daily life (e.g., "A burning or tingling sensation in your feet that may be worse at night" rather than "distal paresthesia"). Include both common and less-obvious symptoms patients might not connect to this condition.

## Treatment Options at a Pain Management Clinic
4-5 evidence-based treatments that a board-certified pain management specialist may recommend. For each treatment, include:
- The treatment name in plain language (with clinical term in parentheses if helpful)
- One sentence explaining what happens during the treatment
- One sentence on what the patient can expect (e.g., "Many patients notice improvement within 2-4 weeks")
End this section by emphasizing that your pain specialist will develop a personalized treatment plan based on your specific situation.

## When to See a Pain Specialist
4 specific, concrete indicators that it's time to seek specialized care. Use real-world framing (e.g., "Your pain has lasted longer than 3 months," "Over-the-counter medications no longer provide adequate relief," "Pain is affecting your ability to work, sleep, or enjoy daily activities"). End with a warm, encouraging sentence — not a hard sell.

Close with a single italicized disclaimer line:
*This content is for educational purposes only and does not replace professional medical advice. Please consult a qualified pain management specialist for diagnosis and treatment.*

Length: 400-500 words. Do NOT pad with filler. Every sentence should provide value to the patient.`;

    case "handout":
      return `Write a patient education handout about: ${condition}
${personalization}

Context: This will be printed on paper and handed to patients in a clinical setting — either in the waiting room before a consultation or after a visit as a take-home reference. It must look professional enough for a physician to hand to their patient.

Structure (use **bold** for section labels — NO markdown headings, NO # symbols):

**What Is ${condition}?**
2-3 sentences. Assume the patient knows nothing about this condition. Use an analogy or comparison if it helps explain the mechanism (e.g., "Think of your nerves like electrical wires — when the protective coating is damaged..."). Keep it simple and reassuring.

**Common Signs and Symptoms**
Bullet list, 5 items. Use "You may notice..." or "You may experience..." framing. Include both the primary symptom and how it might feel in everyday life.

**How It's Treated**
Bullet list of 4 treatments. For each, one sentence explaining what it is and one sentence on what the patient should expect (duration, what it feels like, recovery). Focus on treatments available at a pain management clinic specifically.

**What You Can Do at Home**
3 practical, evidence-supported self-care strategies that complement clinical treatment. Be specific (e.g., "Apply ice for 15-20 minutes at a time" rather than "use ice"). Include one tip about when to call the clinic.

**Questions to Bring to Your Next Appointment**
4 specific, thoughtful questions that demonstrate clinical awareness and help patients advocate for themselves. Examples: "Are there any newer treatment options I should consider?", "What are the expected benefits and risks of [treatment]?"

End with: "This handout is for informational purposes. Your pain management team will tailor your treatment plan to your individual needs."

Length: 280-350 words. Reading level: 6th-7th grade. Sentences under 15 words where possible. No medical abbreviations without explanation. No jargon.`;

    case "social":
      return `Write a social media content series (4 posts) about: ${condition}
${personalization}

Platform: Instagram and Facebook for a pain management clinic. The audience is patients and potential patients scrolling their feed — they need to stop, read, and feel informed, not sold to. Each post must work completely on its own.

Format each post exactly as:
**Post [number]: [theme]**
[content]

Post requirements:
- **Post 1: Did You Know?** — Lead with a compelling, verifiable fact or statistic about ${condition} that would surprise the average person. Explain the condition in 2 sentences. Close with a normalizing statement like "If this sounds familiar, you're not alone — and there are real treatment options."
- **Post 2: Signs to Watch For** — Open with "How do you know if you might have ${condition}?" List 3-4 symptoms using patient-friendly language. Close by normalizing the step of talking to a specialist: "Recognizing these signs is the first step toward feeling better."
- **Post 3: Modern Treatment Works** — Highlight 2-3 specific treatment approaches (name them). Focus on innovation, compassion, and real outcomes. Avoid sounding like an advertisement — educate instead. Example framing: "Today's pain management goes far beyond medication alone."
- **Post 4: Your Next Step** — Empowering, warm CTA. Validate their pain ("Living with ${condition} is exhausting — and you don't have to do it alone"). Encourage them to book a consultation or learn more. End on hope, not pressure.

Each post: 50-80 words. Tone: Warm, conversational, knowledgeable — like a doctor you'd trust posting on their personal professional account. Include 1-2 contextually appropriate emoji per post. Do NOT include hashtags (the clinic will add their own). Do NOT include disclaimers in social posts — those belong on the website.`;
  }
}

export async function POST(request: Request) {
  try {
    // Require authentication
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Sign in to use AI tools" },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;
    const userId = session.user.id;

    const body = await request.json();
    const { condition, format, clinicName, clinicLocation } = body as {
      condition: string;
      format: ContentFormat;
      clinicName?: string;
      clinicLocation?: string;
    };

    if (!condition || !format) {
      return NextResponse.json(
        { error: "Condition and format are required" },
        { status: 400 }
      );
    }

    const validFormats: ContentFormat[] = ["website", "handout", "social"];
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { error: "Invalid format" },
        { status: 400 }
      );
    }

    // Upsert contact with ai-tools tag and track usage count
    const tags = ["ai-tools", "tool-user", "patient-education"];
    let currentRunCount = 0;

    try {
      // Check existing contact for run count
      const existing = await db
        .select({ metadata: contacts.metadata })
        .from(contacts)
        .where(eq(contacts.email, userEmail))
        .limit(1);

      if (existing.length > 0 && existing[0]!.metadata) {
        const meta = existing[0]!.metadata as Record<string, unknown>;
        currentRunCount = typeof meta.aiToolRunCount === "number" ? meta.aiToolRunCount : 0;
      }

      // Check free limit
      if (currentRunCount >= FREE_GENERATION_LIMIT) {
        return NextResponse.json(
          { error: `You've used all ${FREE_GENERATION_LIMIT} free AI generations. Upgrade for unlimited access.`, remaining: 0 },
          { status: 403 }
        );
      }

      // Upsert contact with tags and increment run count
      await db
        .insert(contacts)
        .values({
          email: userEmail,
          name: session.user.name || null,
          userId,
          tags,
          metadata: { source: "ai-tools", firstCondition: condition, aiToolRunCount: currentRunCount + 1 },
        })
        .onConflictDoUpdate({
          target: contacts.email,
          set: {
            name: session.user.name || sql`${contacts.name}`,
            userId,
            tags: sql`array(SELECT DISTINCT unnest(${contacts.tags} || ${sql.raw(`'{${tags.join(",")}}'::text[]`)}))`,
            metadata: sql`jsonb_set(
              COALESCE(${contacts.metadata}, '{}'::jsonb),
              '{aiToolRunCount}',
              to_jsonb(COALESCE((${contacts.metadata}->>'aiToolRunCount')::int, 0) + 1)
            )`,
            updatedAt: new Date(),
          },
        });
    } catch (err) {
      // Don't fail the generation if contact tracking fails
      console.error("Failed to track AI tool usage:", err);
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    const openrouter = createOpenRouter({ apiKey });
    const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

    const prompt = buildPrompt(condition, format, clinicName, clinicLocation);

    const result = await generateText({
      model: openrouter(model),
      system: SYSTEM_PROMPT,
      prompt,
    });

    const remaining = FREE_GENERATION_LIMIT - (currentRunCount + 1);

    return NextResponse.json({
      content: result.text,
      condition,
      format,
      remaining,
    });
  } catch (error) {
    console.error("Education generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate content. Please try again." },
      { status: 500 }
    );
  }
}
