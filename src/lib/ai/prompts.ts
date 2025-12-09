// AI Prompt Templates for Content Optimization
// Version-controlled prompts for reproducible optimization

export interface PromptConfig {
  systemPrompt: string;
  userPromptTemplate: string;
  model: string;
  maxTokens: number;
}

export const OPTIMIZATION_PROMPTS: Record<string, PromptConfig> = {
  "v1.0": {
    model: "anthropic/claude-sonnet-4",
    maxTokens: 2000,
    systemPrompt: `You are a medical content optimization specialist for a pain clinic directory. Your task is to optimize clinic descriptions while preserving critical SEO elements and medical accuracy.

## CRITICAL PRESERVATION RULES (NEVER MODIFY):
1. All doctor/practitioner names exactly as written
2. Geographic locations (city, state, street addresses, neighborhoods)
3. Phone numbers and contact information
4. Specific treatment names and procedures
5. H3 tags and their content structure
6. Medical certifications and credentials
7. Years of experience or establishment dates
8. Website URLs and links

## OPTIMIZATION GOALS:
1. Target word count: Reduce to approximately {targetWordCount} words
2. Integrate patient review keywords naturally into the content
3. Add FAQ questions relevant to pain management
4. Improve semantic structure for better search optimization
5. Maintain professional medical tone throughout
6. Remove verbose filler and redundant phrases
7. Make content more actionable and patient-focused

## CONTENT STRUCTURE:
Organize the optimized content with:
- Opening paragraph: Clinic introduction + location emphasis
- Services section: Key treatments with benefits
- Expertise section: Provider credentials and approach
- FAQ section: Common patient questions
- Contact section: How to schedule

## OUTPUT FORMAT:
Return ONLY a valid JSON object with these exact fields:
{
  "optimizedContent": "The optimized HTML content with H3 tags preserved",
  "faqs": [
    {"question": "Patient question?", "answer": "Professional answer."},
    ...
  ],
  "keywordsIntegrated": ["keyword1", "keyword2"],
  "changesSummary": "Brief 1-2 sentence description of changes made"
}

Do not include any text before or after the JSON object.`,

    userPromptTemplate: `## CLINIC INFORMATION
Name: {clinicName}
Location: {city}, {state}
Full Address: {address}
Rating: {rating} stars ({reviewCount} reviews)

## PATIENT REVIEW KEYWORDS TO INTEGRATE:
These are actual words patients use in reviews - integrate 3-5 naturally:
{keywords}

## CURRENT CONTENT TO OPTIMIZE:
Word Count: {currentWordCount} words
Target: {targetWordCount} words

{content}

---
Please optimize this content following the system guidelines. Generate {faqCount} relevant FAQ questions.
Remember: Preserve ALL doctor names, addresses, phone numbers, and medical terms exactly as written.`,
  },
};

export const CURRENT_PROMPT_VERSION = "v1.0";

export function getPromptConfig(version?: string): PromptConfig {
  const v = version || CURRENT_PROMPT_VERSION;
  const config = OPTIMIZATION_PROMPTS[v];
  if (!config) {
    throw new Error(`Unknown prompt version: ${v}`);
  }
  return config;
}

export function buildUserPrompt(
  template: string,
  data: {
    clinicName: string;
    city: string;
    state: string;
    address?: string;
    rating?: number | null;
    reviewCount?: number;
    keywords: string;
    currentWordCount: number;
    targetWordCount: number;
    content: string;
    faqCount: number;
  }
): string {
  let prompt = template;
  prompt = prompt.replace("{clinicName}", data.clinicName);
  prompt = prompt.replace("{city}", data.city);
  prompt = prompt.replace("{state}", data.state);
  prompt = prompt.replace("{address}", data.address || "Not provided");
  prompt = prompt.replace("{rating}", data.rating?.toString() || "N/A");
  prompt = prompt.replace("{reviewCount}", data.reviewCount?.toString() || "0");
  prompt = prompt.replace("{keywords}", data.keywords);
  prompt = prompt.replace(
    "{currentWordCount}",
    data.currentWordCount.toString()
  );
  prompt = prompt.replace("{targetWordCount}", data.targetWordCount.toString());
  prompt = prompt.replace("{content}", data.content);
  prompt = prompt.replace("{faqCount}", data.faqCount.toString());
  return prompt;
}

export function buildSystemPrompt(
  template: string,
  targetWordCount: number
): string {
  return template.replace("{targetWordCount}", targetWordCount.toString());
}
