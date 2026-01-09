'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

interface DeferredGTMProps {
  /** GTM container ID (e.g., "GTM-ZGCKNRS") */
  gtmId: string;
  /** Delay in ms after page load before loading GTM (default: 2000) */
  delayMs?: number;
}

/**
 * Deferred Google Tag Manager loader that waits until after the page
 * is interactive before loading GTM.
 *
 * This improves PageSpeed scores by:
 * - Eliminating render-blocking JavaScript during initial load
 * - Reducing main thread work during LCP measurement
 * - Allowing Core Web Vitals to complete before analytics loading
 *
 * Note: GTM will still function normally, events that occur during
 * the delay will be queued in dataLayer and processed once GTM loads.
 */
export function DeferredGTM({ gtmId, delayMs = 2000 }: DeferredGTMProps) {
  const loadedRef = useRef(false);

  useEffect(() => {
    // Check if already loaded
    const existingScript = document.querySelector(
      `script[src*="googletagmanager.com/gtm.js?id=${gtmId}"]`
    );
    if (existingScript || loadedRef.current) {
      return;
    }

    const loadGTM = () => {
      const timer = setTimeout(() => {
        if (loadedRef.current) return;
        loadedRef.current = true;

        // Initialize dataLayer
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          'gtm.start': new Date().getTime(),
          event: 'gtm.js',
        });

        // Load GTM script
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;

        script.onerror = () => {
          console.warn('GTM script failed to load (possibly blocked)');
        };

        document.head.appendChild(script);
      }, delayMs);

      return () => clearTimeout(timer);
    };

    if (document.readyState === 'complete') {
      const cleanup = loadGTM();
      return cleanup;
    } else {
      const handleLoad = () => {
        const cleanup = loadGTM();
        window.removeEventListener('load', handleLoad);
        return cleanup;
      };
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, [gtmId, delayMs]);

  return null;
}

export default DeferredGTM;
