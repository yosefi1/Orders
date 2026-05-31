/** מאפים – מחיר לפי גודל (ב-DB price=0; המחיר האמיתי כאן) */
export const PASTRY_PRICE_SMALL = 4.6;
export const PASTRY_PRICE_LARGE = 8.4;

export function getPastryPrice(variation: string | null | undefined): number {
  return variation === 'קטן' ? PASTRY_PRICE_SMALL : PASTRY_PRICE_LARGE;
}

export function formatPrice(amount: number): string {
  return amount.toFixed(2);
}
