'use client';

import { useEffect, useRef } from 'react';

interface DeferredAdSenseProps {
  /** AdSense client ID (e.g., "ca-pub-5028121986513144") */
  clientId: string;
  /**
   * Loading strategy:
   * - 'scroll': Load when user scrolls (best for PageSpeed, recommended)
   * - 'timer': Load after delayMs milliseconds
   * - 'interaction': Load on any user interaction (click, scroll, keypress)
   */
  strategy?: 'scroll' | 'timer' | 'interaction';
  /** Delay in ms for timer strategy (default: 3000) */
  delayMs?: number;
}

/**
 * Deferred AdSense loader that waits for user interaction
 * before loading the AdSense script.
 *
 * This improves PageSpeed scores by:
 * - Not loading AdSense until user engagement signals interest
 * - Reducing main thread blocking during initial load
 * - Preventing forced reflow from AdSense during LCP measurement
 * - Allowing Core Web Vitals to complete before ad loading begins
 *
 * Default strategy is 'scroll' which loads ads when user scrolls,
 * indicating they're engaged with the content.
 */
export function DeferredAdSense({
  clientId,
  strategy = 'scroll',
  delayMs = 3000,
}: DeferredAdSenseProps) {
  const loadedRef = useRef(false);

  useEffect(() => {
    // Don't load in development
    if (process.env.NODE_ENV === 'development') return undefined;

    // Check if already loaded (from another component or page navigation)
    const existingScript = document.querySelector(
      `script[src*="adsbygoogle.js?client=${clientId}"]`
    );
    if (existingScript || loadedRef.current) {
      return undefined;
    }

    const loadAdSenseScript = () => {
      if (loadedRef.current) return;
      loadedRef.current = true;

      const script = document.createElement('script');
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
      script.async = true;
      script.crossOrigin = 'anonymous';

      script.onerror = () => {
        // AdSense might be blocked by ad blockers - that's OK
        console.warn('AdSense script failed to load (possibly blocked)');
      };

      document.head.appendChild(script);
    };

    // Timer-based loading
    if (strategy === 'timer') {
      const timer = setTimeout(loadAdSenseScript, delayMs);
      return () => clearTimeout(timer);
    }

    // Scroll-based loading (default) - loads when user scrolls
    if (strategy === 'scroll') {
      const handleScroll = () => {
        loadAdSenseScript();
        window.removeEventListener('scroll', handleScroll, { capture: true });
      };

      // Use passive listener for better scroll performance
      window.addEventListener('scroll', handleScroll, { passive: true, capture: true });

      // Also load after 7 seconds as fallback (user might not scroll on desktop)
      // Kept well past LCP window (~4s) to avoid impacting Core Web Vitals
      const fallbackTimer = setTimeout(loadAdSenseScript, 7000);

      return () => {
        window.removeEventListener('scroll', handleScroll, { capture: true });
        clearTimeout(fallbackTimer);
      };
    }

    // Interaction-based loading - loads on any user interaction
    const events = ['scroll', 'click', 'touchstart', 'keydown'];

    const handleInteraction = () => {
      loadAdSenseScript();
      events.forEach(event => {
        window.removeEventListener(event, handleInteraction, { capture: true });
      });
    };

    events.forEach(event => {
      window.addEventListener(event, handleInteraction, { passive: true, capture: true });
    });

    // Fallback after 10 seconds
    const fallbackTimer = setTimeout(loadAdSenseScript, 10000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleInteraction, { capture: true });
      });
      clearTimeout(fallbackTimer);
    };
  }, [clientId, strategy, delayMs]);

  return null;
}

export default DeferredAdSense;
