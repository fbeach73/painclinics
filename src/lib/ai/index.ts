// AI Module Exports
// Central export point for all AI-related functionality

export {
  optimizeClinicContent,
  estimateOptimizationCost,
  type ClinicData,
  type OptimizationConfig,
  type OptimizationResult,
  type ValidationResult,
  type OptimizationResponse,
} from "./optimization-service";

export {
  getPromptConfig,
  buildUserPrompt,
  buildSystemPrompt,
  CURRENT_PROMPT_VERSION,
  OPTIMIZATION_PROMPTS,
  type PromptConfig,
} from "./prompts";

export {
  RateLimiter,
  getGlobalRateLimiter,
  calculateCost,
  estimateTokens,
  estimateCostForClinic,
  PRICING,
  type RateLimiterConfig,
} from "./rate-limiter";

export {
  validateOptimizedContent,
  parseOptimizationResponse,
  formatKeywordsForPrompt,
  extractDoctorNames,
  extractPhoneNumbers,
  extractH3Tags,
  countWords,
  type ClinicValidationContext,
} from "./validators";
