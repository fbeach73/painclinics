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

Generate a detailed plan with these sections:

# 1. UNDERSTANDING YOUR CONDITION
- What is likely causing your pain
- How this condition typically progresses
- What the medical evidence says

# 2. IMMEDIATE ACTION PLAN (Next 72 Hours)
- Specific OTC medications with exact dosages and timing
- Ice/heat protocols with durations
- Activity modifications
- Sleep position recommendations

# 3. WEEK-BY-WEEK RECOVERY PROTOCOL (4 Weeks)
- **Week 1:** Focus areas, daily routine, what to expect
- **Week 2:** Progression steps, new additions
- **Week 3:** Building on progress
- **Week 4:** Assessment and next steps

# 4. QUESTIONS FOR YOUR SPECIALIST
- 10+ specific questions to ask at your first appointment
- What tests to request
- What information to bring

# 5. RED FLAGS — When to Seek Emergency Care
- Specific symptoms that require immediate attention
- When to call 911 vs urgent care vs wait for appointment

# 6. SPECIALIST GUIDE
- What type of doctor to see first
- What to expect at the first visit
- How to prepare
- Questions about insurance coverage

# 7. SELF-CARE & LIFESTYLE
- Evidence-based exercises (with descriptions)
- Dietary considerations
- Stress management techniques
- Sleep optimization

Write in a warm, knowledgeable tone. Be specific with dosages, timings, and protocols. Use markdown formatting with headers, bold text, and bullet points. Include citations to NIH/Mayo Clinic where relevant.

IMPORTANT: Include a disclaimer at the end: "This plan is for informational purposes only and does not constitute medical advice. Always consult with a healthcare provider before starting any new treatment protocol."`;
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
      maxOutputTokens: 4000,
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
