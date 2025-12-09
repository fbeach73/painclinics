// Rate Limiter for OpenRouter API calls
// Implements sliding window rate limiting with exponential backoff

export interface RateLimiterConfig {
  maxRequests: number; // Maximum requests allowed in window
  windowMs: number; // Time window in milliseconds
  retryDelayMs: number; // Base delay for retries
  maxRetries: number; // Maximum retry attempts
}

const DEFAULT_CONFIG: RateLimiterConfig = {
  maxRequests: 100, // 100 requests per minute for OpenRouter
  windowMs: 60000, // 1 minute window
  retryDelayMs: 1000, // Start with 1 second retry delay
  maxRetries: 3, // Retry up to 3 times
};

export class RateLimiter {
  private requestTimes: number[] = [];
  private config: RateLimiterConfig;

  constructor(config?: Partial<RateLimiterConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Wait if rate limit would be exceeded
   * @returns The time waited in milliseconds (0 if no wait needed)
   */
  async waitIfNeeded(): Promise<number> {
    const now = Date.now();

    // Clean up old requests outside the window
    this.requestTimes = this.requestTimes.filter(
      (t) => now - t < this.config.windowMs
    );

    // If at capacity, wait until oldest request expires
    if (this.requestTimes.length >= this.config.maxRequests) {
      const oldestRequest = this.requestTimes[0]!;
      const waitTime = this.config.windowMs - (now - oldestRequest) + 100; // +100ms buffer

      if (waitTime > 0) {
        await this.sleep(waitTime);
        return waitTime;
      }
    }

    // Record this request
    this.requestTimes.push(Date.now());
    return 0;
  }

  /**
   * Execute a function with rate limiting and retry logic
   */
  async execute<T>(
    fn: () => Promise<T>,
    onRetry?: (attempt: number, error: Error, waitTime: number) => void
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        // Wait if rate limited
        await this.waitIfNeeded();

        // Execute the function
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if it's a rate limit error (429)
        const isRateLimitError =
          lastError.message.includes("429") ||
          lastError.message.toLowerCase().includes("rate limit");

        // Check if it's a retryable server error (5xx)
        const isServerError =
          lastError.message.includes("500") ||
          lastError.message.includes("502") ||
          lastError.message.includes("503") ||
          lastError.message.includes("504");

        // Only retry on rate limit or server errors
        if (!isRateLimitError && !isServerError) {
          throw lastError;
        }

        // Don't retry on last attempt
        if (attempt === this.config.maxRetries) {
          throw lastError;
        }

        // Calculate wait time with exponential backoff
        const waitTime = this.config.retryDelayMs * Math.pow(2, attempt);

        // For rate limit errors, wait longer
        const actualWaitTime = isRateLimitError ? waitTime * 2 : waitTime;

        // Notify caller of retry
        if (onRetry) {
          onRetry(attempt + 1, lastError, actualWaitTime);
        }

        await this.sleep(actualWaitTime);
      }
    }

    // This shouldn't be reached, but just in case
    throw lastError || new Error("Rate limiter: max retries exceeded");
  }

  /**
   * Get current rate limit status
   */
  getStatus(): {
    requestsInWindow: number;
    maxRequests: number;
    remainingRequests: number;
    windowResetMs: number;
  } {
    const now = Date.now();
    this.requestTimes = this.requestTimes.filter(
      (t) => now - t < this.config.windowMs
    );

    const oldestRequest = this.requestTimes[0];
    const windowResetMs = oldestRequest
      ? this.config.windowMs - (now - oldestRequest)
      : 0;

    return {
      requestsInWindow: this.requestTimes.length,
      maxRequests: this.config.maxRequests,
      remainingRequests: Math.max(
        0,
        this.config.maxRequests - this.requestTimes.length
      ),
      windowResetMs: Math.max(0, windowResetMs),
    };
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.requestTimes = [];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance for shared rate limiting across requests
let globalRateLimiter: RateLimiter | null = null;

export function getGlobalRateLimiter(): RateLimiter {
  if (!globalRateLimiter) {
    globalRateLimiter = new RateLimiter();
  }
  return globalRateLimiter;
}

// Cost calculation utilities
export const PRICING = {
  "anthropic/claude-sonnet-4": {
    inputPer1M: 3.0, // $3 per 1M input tokens
    outputPer1M: 15.0, // $15 per 1M output tokens
  },
  "anthropic/claude-haiku": {
    inputPer1M: 0.25, // $0.25 per 1M input tokens
    outputPer1M: 1.25, // $1.25 per 1M output tokens
  },
  "openai/gpt-4o-mini": {
    inputPer1M: 0.15, // $0.15 per 1M input tokens
    outputPer1M: 0.6, // $0.60 per 1M output tokens
  },
};

export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  model: string = "anthropic/claude-sonnet-4"
): number {
  const pricing = PRICING[model as keyof typeof PRICING] || PRICING["anthropic/claude-sonnet-4"];
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPer1M;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPer1M;
  return inputCost + outputCost;
}

export function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token for English
  return Math.ceil(text.length / 4);
}

export function estimateCostForClinic(
  contentLength: number,
  targetWords: number = 400,
  model: string = "anthropic/claude-sonnet-4"
): number {
  // Estimate input tokens: system prompt (~500) + user prompt (~200) + content
  const inputTokens = 700 + estimateTokens(contentLength.toString());
  // Estimate output tokens: optimized content + FAQs + JSON structure
  const outputTokens = Math.ceil(targetWords * 1.3) + 400; // 1.3 tokens per word + overhead
  return calculateCost(inputTokens, outputTokens, model);
}
