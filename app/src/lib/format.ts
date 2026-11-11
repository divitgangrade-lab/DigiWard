import { describeDaysAgo } from './date';
import type { WearSummary } from '../domain/wear';

/** One sentence of wear history, used on cards and in the detail dialog. */
export const wearSentence = (summary: WearSummary): string => {
  if (summary.totalWears === 0) return 'Not logged yet';
  const times = summary.totalWears === 1 ? 'once' : `${summary.totalWears} times`;
  if (summary.daysSinceLastWorn === null) return `Worn ${times}`;
  return `Worn ${times}, last ${describeDaysAgo(summary.daysSinceLastWorn)}`;
};

export const shortWearLine = (summary: WearSummary): string => {
  if (summary.totalWears === 0) return 'Worn 0';
  return `Worn ${summary.totalWears}`;
};

/** Colour chips without a stored hex still need something visible. */
export const FALLBACK_SWATCH = '#bcb2a1';

export const swatchFor = (colorHex: string | undefined): string =>
  colorHex !== undefined && /^#[0-9a-f]{6}$/i.test(colorHex) ? colorHex : FALLBACK_SWATCH;

/** Resolves a stored local image path against the site base path. */
export const resolveImage = (image: string | undefined, base: string): string | null => {
  if (image === undefined || image.length === 0) return null;
  return `${base}${image.replace(/^\.?\//, '')}`;
};

/** Plain number formatting for prices. No currency symbol is assumed. */
export const formatAmount = (value: number): string =>
  new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(value);

export const costPerWear = (price: number | undefined, totalWears: number): number | null =>
  price === undefined || price <= 0 || totalWears <= 0 ? null : price / totalWears;
