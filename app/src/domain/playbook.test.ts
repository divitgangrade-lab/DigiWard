import { describe, expect, it } from 'vitest';
import {
  CORE_TARGET,
  auditCounts,
  capsuleCoverage,
  coreRatio,
  formulaCounts,
  styleCounts,
  valueSummary,
} from './playbook';
import { summarizeWear } from './wear';
import type { WardrobeItem } from './schema';

const today = new Date(2026, 10, 10);

const makeItem = (overrides: Partial<WardrobeItem> = {}): WardrobeItem => ({
  id: 'item-1',
  name: 'Oxford shirt',
  category: 'tops',
  color: 'ecru',
  material: 'cotton oxford',
  formality: 'smart-casual',
  ...overrides,
});

const summaries = (items: readonly WardrobeItem[]) =>
  new Map(items.map((item) => [item.id, summarizeWear(item, { today })]));

describe('playbook metrics', () => {
  it('handles an empty wardrobe', () => {
    expect(CORE_TARGET).toBe(0.7);
    expect(coreRatio([])).toEqual({ core: 0, total: 0, ratio: 0 });
    expect(auditCounts([])).toEqual({
      counts: { keep: 0, alter: 0, donate: 0, sell: 0 },
      largest: 'keep',
    });
    expect(valueSummary([], summaries([]))).toEqual({
      priced: 0,
      totalPrice: 0,
      totalWears: 0,
      average: null,
    });
    expect(formulaCounts([])).toEqual({
      threeThreeThree: 0,
      moduleBase: 0,
      moduleWithShoes: 0,
      outerLayers: 0,
      tops: 0,
      bottoms: 0,
      shoes: 0,
    });
    expect(capsuleCoverage([]).every((entry) => !entry.met)).toBe(true);
  });

  it('counts core basics and treats an unset audit as keep', () => {
    const items = [
      makeItem({ id: 'a', core: true }),
      makeItem({ id: 'b', core: false }),
      makeItem({ id: 'c', core: true, audit: 'donate' }),
      makeItem({ id: 'd', audit: 'sell' }),
    ];
    const ratio = coreRatio(items);
    expect(ratio.core).toBe(2);
    expect(ratio.total).toBe(4);
    expect(ratio.ratio).toBe(0.5);
    const audit = auditCounts(items);
    expect(audit.counts).toEqual({ keep: 2, alter: 0, donate: 1, sell: 1 });
    expect(audit.largest).toBe('keep');
  });

  it('averages cost per wear only across priced pieces that have been worn', () => {
    const worn = makeItem({ id: 'worn', price: 100, wearLog: ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04'] });
    const lightlyWorn = makeItem({ id: 'light', price: 50, wearLog: ['2026-11-08'] });
    const neverWorn = makeItem({ id: 'never', price: 1000 });
    const noPrice = makeItem({ id: 'free', wearLog: ['2026-11-09'] });
    const items = [worn, lightlyWorn, neverWorn, noPrice];
    expect(valueSummary(items, summaries(items))).toEqual({
      priced: 2,
      totalPrice: 150,
      totalWears: 5,
      average: 30,
    });
  });

  it('caps formula factors at the formula quota', () => {
    const items = [
      ...Array.from({ length: 5 }, (_, index) => makeItem({ id: `top-${index}`, name: `Top ${index}`, category: 'tops' })),
      ...Array.from({ length: 6 }, (_, index) =>
        makeItem({ id: `bottom-${index}`, name: `Bottom ${index}`, category: 'bottoms' }),
      ),
      ...Array.from({ length: 4 }, (_, index) => makeItem({ id: `shoe-${index}`, name: `Shoe ${index}`, category: 'shoes' })),
      ...Array.from({ length: 3 }, (_, index) =>
        makeItem({ id: `layer-${index}`, name: `Layer ${index}`, category: 'outerwear' }),
      ),
    ];
    expect(formulaCounts(items)).toMatchObject({
      threeThreeThree: 27,
      moduleBase: 6,
      moduleWithShoes: 12,
      outerLayers: 3,
    });
  });

  it('reports capsule coverage against the 5-4-3-2-1 targets', () => {
    const items = [
      ...Array.from({ length: 5 }, (_, index) => makeItem({ id: `top-${index}`, category: 'tops' })),
      ...Array.from({ length: 4 }, (_, index) => makeItem({ id: `bottom-${index}`, category: 'bottoms' })),
      ...Array.from({ length: 3 }, (_, index) => makeItem({ id: `shoe-${index}`, category: 'shoes' })),
      ...Array.from({ length: 2 }, (_, index) => makeItem({ id: `layer-${index}`, category: 'outerwear' })),
      makeItem({ id: 'dress', category: 'dresses' }),
    ];
    const coverage = capsuleCoverage(items);
    expect(coverage.every((entry) => entry.met)).toBe(true);
    expect(coverage.map((entry) => `${entry.category}:${entry.have}/${entry.need}`)).toEqual([
      'tops:5/5',
      'bottoms:4/4',
      'shoes:3/3',
      'outerwear:2/2',
      'dresses:1/1',
    ]);
  });

  it('counts every taxonomy style even when the count is zero', () => {
    const counts = styleCounts([makeItem({ styles: ['minimalist-classic', 'casual'] })]);
    expect(counts).toHaveLength(21);
    expect(counts.find((entry) => entry.style === 'minimalist-classic')?.count).toBe(1);
    expect(counts.find((entry) => entry.style === 'black-tie')?.count).toBe(0);
  });
});
