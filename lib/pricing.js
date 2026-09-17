export const FOUNDING_CAP = 1000;
export const EARLY_BIRD_CAP = 100;
export const EARLY_BIRD_PRICE = 50;
export const FOUNDING_PRICE = 100;
export const STANDARD_PRICE = 10;

// Given how many founding spots are already claimed, what does the NEXT one cost?
export function foundingPriceForCount(foundingCount) {
  return foundingCount < EARLY_BIRD_CAP ? EARLY_BIRD_PRICE : FOUNDING_PRICE;
}

export function priceForTier(tier, foundingCount) {
  if (tier === 'founding') return foundingPriceForCount(foundingCount);
  return STANDARD_PRICE;
}
