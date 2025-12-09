// Content Optimization Service
// Core service for AI-powered clinic content optimization

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import {
  getPromptConfig,
  buildUserPrompt,
  buildSystemPrompt,
  CURRENT_PROMPT_VERSION,
} from "./prompts";
import {
  getGlobalRateLimiter,
  calculateCost,
  estimateTokens,
} from "./rate-limiter";
import {
  validateOptimizedContent,
  parseOptimizationResponse,
  formatKeywordsForPrompt,
  countWords,
  type ValidationResult,
  type OptimizationResponse,
  type ClinicValidationContext,
} from "./validators";

export interface ClinicData {
  id: string;
  title: string;
  city: string;
  state: string;
  streetAddress?: string | null;
  phone?: string | null;
  phones?: string[] | null;
  rating?: number | null;
  reviewCount?: number | null;
  reviewKeywords?: Array<{ keyword: string; count: number }> | null;
  content?: string | null;
}

export interface OptimizationConfig {
  targetWordCount: number;
  faqCount: number;
  includeKeywords: boolean;
  promptVersion?: string;
  model?: string;
}

export interface OptimizationResult {
  success: boolean;
  clinicId: string;

  // Content
  originalContent: string;
  optimizedContent?: string;
  faqs?: Array<{ question: string; answer: string }>;
  keywordsIntegrated?: string[];
  changesSummary?: string;

  // Word counts
  wordCountBefore: number;
  wordCountAfter?: number;

  // Validation
  validation?: ValidationResult;

  // Token usage
  inputTokens?: number;
  outputTokens?: number;
  cost?: number;

  // Metadata
  aiModel: string;
  promptVersion: string;

  // Errors
  error?: string;
  errorType?: "rate_limited" | "api_error" | "parse_error" | "validation_error";
}

const DEFAULT_CONFIG: OptimizationConfig = {
  targetWordCount: 400,
  faqCount: 4,
  includeKeywords: true,
  promptVersion: CURRENT_PROMPT_VERSION,
  model: "anthropic/claude-sonnet-4",
};

/**
 * Optimize content for a single clinic
 */
export async function optimizeClinicContent(
  clinic: ClinicData,
  config?: Partial<OptimizationConfig>,
  onProgress?: (status: string) => void
): Promise<OptimizationResult> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const promptConfig = getPromptConfig(cfg.promptVersion);
  const rateLimiter = getGlobalRateLimiter();

  // Check if clinic has content to optimize
  if (!clinic.content || clinic.content.trim().length === 0) {
    return {
      success: false,
      clinicId: clinic.id,
      originalContent: "",
      wordCountBefore: 0,
      aiModel: cfg.model || promptConfig.model,
      promptVersion: cfg.promptVersion || CURRENT_PROMPT_VERSION,
      error: "Clinic has no content to optimize",
      errorType: "validation_error",
    };
  }

  const originalContent = clinic.content;
  const wordCountBefore = countWords(originalContent);

  // Prepare keywords
  const keywordsForPrompt = cfg.includeKeywords
    ? formatKeywordsForPrompt(clinic.reviewKeywords, 10)
    : "Keywords integration disabled for this optimization.";

  // Build prompts
  const systemPrompt = buildSystemPrompt(
    promptConfig.systemPrompt,
    cfg.targetWordCount
  );

  const userPromptData: Parameters<typeof buildUserPrompt>[1] = {
    clinicName: clinic.title,
    city: clinic.city,
    state: clinic.state,
    reviewCount: clinic.reviewCount || 0,
    keywords: keywordsForPrompt,
    currentWordCount: wordCountBefore,
    targetWordCount: cfg.targetWordCount,
    content: originalContent,
    faqCount: cfg.faqCount,
  };
  // Only add optional properties if they exist (exactOptionalPropertyTypes compatibility)
  if (clinic.streetAddress) {
    userPromptData.address = clinic.streetAddress;
  }
  if (clinic.rating !== undefined) {
    userPromptData.rating = clinic.rating;
  }
  const userPrompt = buildUserPrompt(promptConfig.userPromptTemplate, userPromptData);

  // Initialize OpenRouter
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      clinicId: clinic.id,
      originalContent,
      wordCountBefore,
      aiModel: cfg.model || promptConfig.model,
      promptVersion: cfg.promptVersion || CURRENT_PROMPT_VERSION,
      error: "OpenRouter API key not configured",
      errorType: "api_error",
    };
  }

  const openrouter = createOpenRouter({ apiKey });
  const modelToUse = cfg.model || promptConfig.model;

  try {
    onProgress?.("Waiting for rate limit...");

    // Execute with rate limiting and retry
    const result = await rateLimiter.execute(
      async () => {
        onProgress?.("Calling AI model...");
        return generateText({
          model: openrouter(modelToUse),
          system: systemPrompt,
          prompt: userPrompt,
        });
      },
      (attempt, error, waitTime) => {
        onProgress?.(
          `Retry ${attempt} after ${Math.round(waitTime / 1000)}s: ${error.message}`
        );
      }
    );

    onProgress?.("Parsing AI response...");

    // Parse the response
    const parsed = parseOptimizationResponse(result.text);

    if (!parsed) {
      const inputTokens = result.usage?.inputTokens ?? 0;
      const outputTokens = result.usage?.outputTokens ?? 0;
      return {
        success: false,
        clinicId: clinic.id,
        originalContent,
        wordCountBefore,
        inputTokens,
        outputTokens,
        cost: calculateCost(inputTokens, outputTokens, modelToUse),
        aiModel: modelToUse,
        promptVersion: cfg.promptVersion || CURRENT_PROMPT_VERSION,
        error: "Failed to parse AI response as valid JSON",
        errorType: "parse_error",
      };
    }

    onProgress?.("Validating optimized content...");

    // Validate the optimized content
    const validationContext: ClinicValidationContext = {
      title: clinic.title,
      city: clinic.city,
      state: clinic.state,
      streetAddress: clinic.streetAddress ?? null,
      phone: clinic.phone ?? null,
      phones: clinic.phones ?? null,
    };

    const validation = validateOptimizedContent(
      originalContent,
      parsed.optimizedContent,
      validationContext
    );

    const wordCountAfter = countWords(parsed.optimizedContent);
    const inputTokens = result.usage?.inputTokens || estimateTokens(systemPrompt + userPrompt);
    const outputTokens = result.usage?.outputTokens || estimateTokens(result.text);

    return {
      success: true,
      clinicId: clinic.id,
      originalContent,
      optimizedContent: parsed.optimizedContent,
      faqs: parsed.faqs,
      keywordsIntegrated: parsed.keywordsIntegrated,
      changesSummary: parsed.changesSummary,
      wordCountBefore,
      wordCountAfter,
      validation,
      inputTokens,
      outputTokens,
      cost: calculateCost(inputTokens, outputTokens, modelToUse),
      aiModel: modelToUse,
      promptVersion: cfg.promptVersion || CURRENT_PROMPT_VERSION,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    let errorType: OptimizationResult["errorType"] = "api_error";
    if (
      errorMessage.includes("429") ||
      errorMessage.toLowerCase().includes("rate limit")
    ) {
      errorType = "rate_limited";
    }

    return {
      success: false,
      clinicId: clinic.id,
      originalContent,
      wordCountBefore,
      aiModel: modelToUse,
      promptVersion: cfg.promptVersion || CURRENT_PROMPT_VERSION,
      error: errorMessage,
      errorType,
    };
  }
}

/**
 * Get estimated cost for optimizing clinics
 */
export function estimateOptimizationCost(
  clinicCount: number,
  averageContentLength: number = 600,
  config?: Partial<OptimizationConfig>
): {
  perClinic: number;
  total: number;
  model: string;
} {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // Estimate tokens per clinic
  // System prompt: ~500 tokens
  // User prompt template: ~200 tokens
  // Content: ~1.3 tokens per word (avg ~800 for 600 words)
  // Output: ~600 tokens (400 words * 1.3 + FAQs + JSON)
  const inputTokensPerClinic = 700 + Math.ceil(averageContentLength * 1.3);
  const outputTokensPerClinic = Math.ceil(cfg.targetWordCount * 1.3) + 400;

  const perClinic = calculateCost(
    inputTokensPerClinic,
    outputTokensPerClinic,
    cfg.model || "anthropic/claude-sonnet-4"
  );

  return {
    perClinic,
    total: perClinic * clinicCount,
    model: cfg.model || "anthropic/claude-sonnet-4",
  };
}

export type { ValidationResult, OptimizationResponse };
