/**
 * Weighted random selection from a list of items with weights.
 * Returns null if items is empty.
 */
export function weightedRandomSelect<T extends { weight: number }>(
  items: T[]
): T | null {
  if (items.length === 0) return null;

  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return null;

  let random = Math.random() * totalWeight;
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item;
  }

  // Fallback (shouldn't happen)
  return items[items.length - 1]!;
}

/**
 * Weighted random selection of multiple unique items.
 * Picks up to `count` items without replacement using weighted sampling.
 */
export function weightedRandomSelectMultiple<T extends { weight: number }>(
  items: T[],
  count: number
): T[] {
  if (items.length === 0 || count <= 0) return [];
  if (items.length <= count) return [...items];

  const result: T[] = [];
  const remaining = [...items];

  for (let i = 0; i < count && remaining.length > 0; i++) {
    const totalWeight = remaining.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight <= 0) break;

    let random = Math.random() * totalWeight;
    let selectedIdx = remaining.length - 1;
    for (let j = 0; j < remaining.length; j++) {
      random -= remaining[j]!.weight;
      if (random <= 0) {
        selectedIdx = j;
        break;
      }
    }

    result.push(remaining[selectedIdx]!);
    remaining.splice(selectedIdx, 1);
  }

  return result;
}

/**
 * Build the click-tracking redirect URL for an ad.
 */
export function buildClickUrl(clickId: string, destinationUrl: string): string {
  return `/api/ads/click?click_id=${clickId}&dest=${encodeURIComponent(destinationUrl)}`;
}
