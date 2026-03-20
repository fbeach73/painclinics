import { NextRequest, NextResponse } from "next/server";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { sendConsultPdfPlanEmail } from "@/lib/email";

interface GeneratePdfBody {
  email: string;
  firstName: string;
  condition: string;
  zipCode: string;
  age?: string;
  assessmentSummary?: string;
}

function buildPlanPrompt(body: GeneratePdfBody): string {
  return `You are a board-certified pain management medical writer creating a personalized pain management plan for a patient. Write a comprehensive, evidence-based document.

Patient Profile:
- Condition: ${body.condition}
- Age: ${body.age || "Not provided"}
- Location: ${body.zipCode}
- Assessment: ${body.assessmentSummary || "No prior assessment provided"}

Generate a plan with EXACTLY these 7 sections. Be thorough but concise — aim for 150-250 words per section. Do NOT over-expand any single section at the expense of others. ALL 7 sections must be complete.

# 1. UNDERSTANDING YOUR CONDITION
- 2-3 most likely causes given patient profile
- Typical progression with and without treatment
- One brief evidence citation (NIH or Mayo Clinic)

# 2. IMMEDIATE ACTION PLAN (Next 72 Hours)
- OTC medication protocol with dosages and timing
- Ice/heat protocol (when, how long, how often)
- 5 key activity modifications (do's and don'ts)
- Best sleep position for this condition

# 3. WEEK-BY-WEEK RECOVERY PROTOCOL
- **Week 1:** Pain control focus, 3-4 gentle exercises with brief descriptions
- **Week 2:** Progressive mobilization, add 2-3 strengthening exercises
- **Week 3:** Functional capacity building, return-to-activity guidelines
- **Week 4:** Self-assessment checklist, when to escalate to specialist

# 4. QUESTIONS FOR YOUR SPECIALIST
- 10 specific questions to ask at your first appointment
- 3 diagnostic tests to ask about
- What to bring to the appointment

# 5. RED FLAGS — When to Seek Emergency Care
- 5-7 specific symptoms requiring immediate attention
- ER vs urgent care vs scheduled appointment decision guide

# 6. SPECIALIST GUIDE
- Which type of doctor to see first and why
- What the first visit involves
- Insurance and cost considerations

# 7. SELF-CARE & LIFESTYLE
- 4 evidence-based exercises with brief descriptions
- Anti-inflammatory dietary tips
- Stress management techniques (2-3 specific practices)
- Sleep optimization tips

FORMATTING: Use markdown with ## headers, **bold** for key terms, and bullet points. Write in a warm, knowledgeable tone.

CRITICAL: You MUST complete ALL 7 sections including the disclaimer at the very end. Do not over-expand early sections. Budget your response evenly across all sections.

End with: "---\\n\\n*This plan is for informational purposes only and does not constitute medical advice. Always consult with a healthcare provider before starting any new treatment protocol.*"`;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI service not configured" }, { status: 500 });
  }

  let body: GeneratePdfBody;
  try {
    body = await request.json() as GeneratePdfBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, firstName, condition, zipCode } = body;
  if (!email || !firstName || !condition || !zipCode) {
    return NextResponse.json(
      { error: "email, firstName, condition, and zipCode are required" },
      { status: 400 }
    );
  }

  try {
    const openrouter = createOpenRouter({ apiKey });
    const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

    const { text: planContent } = await generateText({
      model: openrouter(model),
      prompt: buildPlanPrompt(body),
      maxOutputTokens: 8000,
    });

    await sendConsultPdfPlanEmail(email, {
      firstName,
      condition,
      planContent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Generate PDF] Error:", error);
    return NextResponse.json({ error: "Failed to generate plan" }, { status: 500 });
  }
}
