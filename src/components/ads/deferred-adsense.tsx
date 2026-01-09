'use client';

import { useEffect, useRef } from 'react';

interface DeferredAdSenseProps {
  /** AdSense client ID (e.g., "ca-pub-5028121986513144") */
  clientId: string;
  /** Delay in ms after page load before loading AdSense (default: 3000) */
  delayMs?: number;
}

/**
 * Deferred AdSense loader that waits until after the page is interactive
 * before loading the AdSense script.
 *
 * This improves PageSpeed scores by:
 * - Reducing main thread blocking during initial load
 * - Preventing forced reflow from AdSense during LCP measurement
 * - Allowing Core Web Vitals to complete before ad loading begins
 *
 * Note: AdSense will still function normally, just loaded after a delay.
 */
export function DeferredAdSense({
  clientId,
  delayMs = 3000,
}: DeferredAdSenseProps) {
  const loadedRef = useRef(false);

  useEffect(() => {
    // Don't load in development
    if (process.env.NODE_ENV === 'development') return;

    // Check if already loaded (from another component or page navigation)
    const existingScript = document.querySelector(
      `script[src*="adsbygoogle.js?client=${clientId}"]`
    );
    if (existingScript || loadedRef.current) {
      return;
    }

    // Wait for page to be fully loaded, then add delay
    const loadAds = () => {
      const timer = setTimeout(() => {
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
      }, delayMs);

      return () => clearTimeout(timer);
    };

    if (document.readyState === 'complete') {
      const cleanup = loadAds();
      return cleanup;
    } else {
      const handleLoad = () => {
        const cleanup = loadAds();
        window.removeEventListener('load', handleLoad);
        return cleanup;
      };
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, [clientId, delayMs]);

  return null;
}

export default DeferredAdSense;
