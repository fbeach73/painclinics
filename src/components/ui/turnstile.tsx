"use client";

import { forwardRef } from "react";
import { Turnstile as TurnstileWidget } from "@marsidev/react-turnstile";
import type { TurnstileInstance } from "@marsidev/react-turnstile";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

interface TurnstileProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  className?: string;
}

/**
 * Cloudflare Turnstile component for form protection.
 *
 * Usage:
 * 1. Add to your form before the submit button
 * 2. Store the token in state via onSuccess callback
 * 3. Send the token with your form submission
 * 4. Verify on the server with verifyTurnstile() from @/lib/turnstile
 *
 * Example:
 * ```tsx
 * const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
 *
 * <Turnstile onSuccess={setTurnstileToken} />
 * <Button disabled={!turnstileToken}>Submit</Button>
 * ```
 */
export const Turnstile = forwardRef<TurnstileInstance, TurnstileProps>(
  function Turnstile({ onSuccess, onError, onExpire, className }, ref) {
    if (!SITE_KEY) {
      // In development without keys, render nothing but allow form to work
      if (process.env.NODE_ENV === "development") {
        return (
          <div className="text-xs text-muted-foreground p-2 border rounded bg-muted">
            Turnstile disabled (no NEXT_PUBLIC_TURNSTILE_SITE_KEY)
          </div>
        );
      }
      return null;
    }

    return (
      <TurnstileWidget
        ref={ref}
        siteKey={SITE_KEY}
        onSuccess={onSuccess}
        onError={onError}
        onExpire={onExpire}
        options={{
          theme: "auto",
          size: "flexible",
        }}
        className={className}
      />
    );
  }
);
