/**
 * Rate limiter for Google Places API calls
 * Implements queue-based rate limiting to respect API quotas
 */

export interface RateLimiterOptions {
  /**
   * Maximum requests per second
   * @default 10
   */
  requestsPerSecond?: number;

  /**
   * Maximum concurrent requests
   * @default 5
   */
  maxConcurrent?: number;

  /**
   * Minimum interval between requests in milliseconds
   * Calculated from requestsPerSecond if not provided
   */
  minInterval?: number;
}

interface QueuedTask<T> {
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

export class PlacesRateLimiter {
  private queue: QueuedTask<unknown>[] = [];
  private activeCount = 0;
  private lastRequestTime = 0;
  private requestsPerSecond: number;
  private maxConcurrent: number;
  private minInterval: number;
  private isProcessing = false;

  constructor(options: RateLimiterOptions = {}) {
    this.requestsPerSecond = options.requestsPerSecond ?? 10;
    this.maxConcurrent = options.maxConcurrent ?? 5;
    this.minInterval = options.minInterval ?? Math.ceil(1000 / this.requestsPerSecond);
  }

  /**
   * Execute a function with rate limiting
   * @param fn - Async function to execute
   * @returns Promise resolving to the function's return value
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        fn: fn as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      this.processQueue();
    });
  }

  /**
   * Process the queue of pending tasks
   */
  private async processQueue(): Promise<void> {
    // Prevent multiple simultaneous processing loops
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        // Wait if we're at max concurrent requests
        if (this.activeCount >= this.maxConcurrent) {
          await this.sleep(10);
          continue;
        }

        // Enforce minimum interval between requests
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.minInterval) {
          await this.sleep(this.minInterval - timeSinceLastRequest);
        }

        const task = this.queue.shift();
        if (!task) continue;

        this.activeCount++;
        this.lastRequestTime = Date.now();

        // Execute task without blocking the queue processing
        this.executeTask(task);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Execute a single task
   */
  private async executeTask(task: QueuedTask<unknown>): Promise<void> {
    try {
      const result = await task.fn();
      task.resolve(result);
    } catch (error) {
      task.reject(error instanceof Error ? error : new Error(String(error)));
    } finally {
      this.activeCount--;
      // Resume queue processing if there are pending tasks
      if (this.queue.length > 0 && !this.isProcessing) {
        this.processQueue();
      }
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get the current queue length
   */
  get queueLength(): number {
    return this.queue.length;
  }

  /**
   * Get the number of active requests
   */
  get activeRequests(): number {
    return this.activeCount;
  }

  /**
   * Check if the rate limiter is busy (has pending or active requests)
   */
  get isBusy(): boolean {
    return this.queue.length > 0 || this.activeCount > 0;
  }

  /**
   * Clear all pending tasks from the queue
   * @param error - Optional error to reject pending tasks with
   */
  clear(error?: Error): void {
    const rejectError = error || new Error("Rate limiter queue cleared");
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        task.reject(rejectError);
      }
    }
  }

  /**
   * Wait for all pending and active tasks to complete
   */
  async drain(): Promise<void> {
    while (this.isBusy) {
      await this.sleep(50);
    }
  }
}

// ============================================
// Singleton Instance for Shared Use
// ============================================

let sharedRateLimiter: PlacesRateLimiter | null = null;

/**
 * Get or create a shared rate limiter instance
 * Useful for ensuring all Places API calls share the same rate limit
 */
export function getSharedRateLimiter(options?: RateLimiterOptions): PlacesRateLimiter {
  if (!sharedRateLimiter) {
    sharedRateLimiter = new PlacesRateLimiter(options);
  }
  return sharedRateLimiter;
}

/**
 * Reset the shared rate limiter instance
 * Useful for testing or when reconfiguration is needed
 */
export function resetSharedRateLimiter(): void {
  if (sharedRateLimiter) {
    sharedRateLimiter.clear();
    sharedRateLimiter = null;
  }
}

// ============================================
// Rate Limit Decorator Helper
// ============================================

/**
 * Create a rate-limited version of an async function
 * @param fn - Async function to wrap
 * @param rateLimiter - Rate limiter instance to use
 * @returns Rate-limited version of the function
 */
export function withRateLimit<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  rateLimiter: PlacesRateLimiter
): (...args: TArgs) => Promise<TResult> {
  return (...args: TArgs) => rateLimiter.execute(() => fn(...args));
}
