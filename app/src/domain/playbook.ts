import type { AuditPile, WardrobeItem } from './schema';
import { AUDIT_LABELS } from './schema';
import type { WearSummary } from './wear';
import { STYLE_IDS, type StyleId } from './styles';

/** The 70/30 rule: aim for roughly 70% carry-over basics. */
export const CORE_TARGET = 0.7;

export const CAPSULE_54321 = {
  tops: 5,
  bottoms: 4,
  shoes: 3,
  outerwear: 2,
  dresses: 1,
} as const;

export type CapsuleCategory = keyof typeof CAPSULE_54321;

export interface CoreRatio {
  core: number;
  total: number;
  /** 0 to 1. Zero when the wardrobe is empty. */
  ratio: number;
}

export const coreRatio = (items: readonly WardrobeItem[]): CoreRatio => {
  const core = items.filter((item) => item.core === true).length;
  return { core, total: items.length, ratio: items.length === 0 ? 0 : core / items.length };
};

export interface AuditCounts {
  counts: Record<AuditPile, number>;
  /** The pile with the most pieces, used for a one-line summary. */
  largest: AuditPile;
}

export const auditCounts = (items: readonly WardrobeItem[]): AuditCounts => {
  const counts: Record<AuditPile, number> = { keep: 0, alter: 0, donate: 0, sell: 0 };
  for (const item of items) {
    counts[item.audit ?? 'keep'] += 1;
  }
  const largest = (Object.keys(counts) as AuditPile[]).reduce((best, pile) =>
    counts[pile] > counts[best] ? pile : best,
  'keep');
  return { counts, largest };
};

export interface ValueSummary {
  priced: number;
  totalPrice: number;
  totalWears: number;
  /** Average cost per wear across priced pieces, or null when nothing is priced. */
  average: number | null;
}

/**
 * Cost per wear across the pieces that actually have a price. Pieces with no
 * recorded wear are left out of the average rather than treated as free.
 */
export const valueSummary = (
  items: readonly WardrobeItem[],
  summaries: ReadonlyMap<string, WearSummary>,
): ValueSummary => {
  let priced = 0;
  let totalPrice = 0;
  let totalWears = 0;
  for (const item of items) {
    if (item.price === undefined || item.price <= 0) continue;
    const wears = summaries.get(item.id)?.totalWears ?? 0;
    if (wears === 0) continue;
    priced += 1;
    totalPrice += item.price;
    totalWears += wears;
  }
  return {
    priced,
    totalPrice: Math.round(totalPrice * 100) / 100,
    totalWears,
    average: totalWears === 0 ? null : Math.round((totalPrice / totalWears) * 100) / 100,
  };
};

export interface StyleCount {
  style: StyleId;
  count: number;
}

export const styleCounts = (items: readonly WardrobeItem[]): StyleCount[] =>
  STYLE_IDS.map((style) => ({
    style,
    count: items.filter((item) => item.styles?.includes(style) ?? false).length,
  }));

export interface CapsuleCoverage {
  category: CapsuleCategory;
  label: string;
  have: number;
  need: number;
  met: boolean;
}

const CAPSULE_LABELS: Record<CapsuleCategory, string> = {
  tops: 'tops',
  bottoms: 'bottoms',
  shoes: 'pairs of shoes',
  outerwear: 'outer layers',
  dresses: 'dress',
};

export const capsuleCoverage = (items: readonly WardrobeItem[]): CapsuleCoverage[] =>
  (Object.keys(CAPSULE_54321) as CapsuleCategory[]).map((category) => {
    const have = items.filter((item) => item.category === category).length;
    const need = CAPSULE_54321[category];
    return { category, label: CAPSULE_LABELS[category], have, need, met: have >= need };
  });

export interface FormulaCounts {
  /** 3 tops × 3 bottoms × 3 shoes, capped by what the wardrobe actually has. */
  threeThreeThree: number;
  /** 2 bottoms × 3 tops × 1 layer, capped by what the wardrobe actually has. */
  moduleBase: number;
  /** The module with two shoe options. */
  moduleWithShoes: number;
  outerLayers: number;
  tops: number;
  bottoms: number;
  shoes: number;
}

const countCategory = (items: readonly WardrobeItem[], category: WardrobeItem['category']): number =>
  items.filter((item) => item.category === category).length;

/**
 * Live counts for the playbook formulas. Each factor is capped at the formula's
 * quota, so a wardrobe with fourteen tops still contributes three to the 3-3-3.
 */
export const formulaCounts = (items: readonly WardrobeItem[]): FormulaCounts => {
  const tops = countCategory(items, 'tops');
  const bottoms = countCategory(items, 'bottoms');
  const shoes = countCategory(items, 'shoes');
  const outerLayers = countCategory(items, 'outerwear');
  const threeThreeThree = Math.min(tops, 3) * Math.min(bottoms, 3) * Math.min(shoes, 3);
  const moduleBase = Math.min(bottoms, 2) * Math.min(tops, 3) * Math.min(outerLayers, 1);
  return {
    threeThreeThree,
    moduleBase,
    moduleWithShoes: moduleBase * Math.min(shoes, 2),
    outerLayers,
    tops,
    bottoms,
    shoes,
  };
};

export const auditLabel = (pile: AuditPile): string => AUDIT_LABELS[pile];
