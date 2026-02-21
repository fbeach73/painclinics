// New data-optimized components
export { InPageAd, AdPlacement, AD_SLOTS } from "./adsense";

// Ad server components
export { AdSlot } from "./AdSlot";
export { AdSlotClient } from "./AdSlotClient";
export { NativeAdPanelSlot } from "./NativeAdPanelSlot";

// Legacy components (kept for backwards compatibility)
// InArticleAd and MultiplexAd are NOT exported — they have empty data-ad-slot="" values.
// Add real AdSense slot IDs before re-exporting.
export { AdUnit } from "./adsense";
