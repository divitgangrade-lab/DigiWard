import { describe, expect, it } from 'vitest';
import { coverageSummary, findGaps } from './gaps';
import { CATEGORIES, OCCASIONS, WEATHER, type WardrobeItem } from './schema';

const makeItem = (overrides: Partial<WardrobeItem> = {}): WardrobeItem => ({
  id: 'item-1',
  name: 'Oxford shirt',
  category: 'tops',
  color: 'ecru',
  material: 'cotton oxford',
  formality: 'smart-casual',
  ...overrides,
});

const completeWardrobe = (): WardrobeItem[] => {
  const items: WardrobeItem[] = [];
  CATEGORIES.forEach((category, index) => {
    for (let copy = 0; copy < 2; copy += 1) {
      items.push(
        makeItem({
          id: `${category}-${copy}-${index}`,
          name: `${category} ${copy}`,
          category,
          formality: 'casual',
          occasions: [...OCCASIONS],
          weather: [...WEATHER],
          seasons: ['spring', 'summer', 'autumn', 'winter'],
        }),
      );
    }
  });
  // Two extra pieces per remaining formality so none of them is thin.
  items.push(
    makeItem({ id: 'smart-1', name: 'Knit polo', category: 'tops', formality: 'smart-casual' }),
    makeItem({ id: 'smart-2', name: 'Chinos', category: 'bottoms', formality: 'smart-casual' }),
    makeItem({ id: 'business-1', name: 'Suit jacket', category: 'outerwear', formality: 'business' }),
    makeItem({ id: 'business-2', name: 'Trousers', category: 'bottoms', formality: 'business' }),
    makeItem({ id: 'formal-1', name: 'Dress shoes', category: 'shoes', formality: 'formal' }),
    makeItem({ id: 'formal-2', name: 'Overcoat', category: 'outerwear', formality: 'formal' }),
  );
  return items;
};

describe('findGaps', () => {
  it('reports every uncovered category, occasion and formality for an empty collection', () => {
    const gaps = findGaps([]);
    for (const category of CATEGORIES) {
      expect(gaps).toContainEqual(
        expect.objectContaining({
          id: `category-${category}`,
          severity: 'critical',
          count: 0,
          filter: { categories: [category] },
        }),
      );
    }
    for (const occasion of OCCASIONS) {
      expect(gaps).toContainEqual(expect.objectContaining({ id: `occasion-${occasion}`, severity: 'critical' }));
    }
    for (const weather of WEATHER) {
      expect(gaps).toContainEqual(
        expect.objectContaining({ id: `weather-${weather}`, severity: 'notice' }),
      );
    }
    expect(gaps.every((gap) => gap.detail.length > 0)).toBe(true);
    expect(gaps[0]?.severity).toBe('critical');
  });

  it('does not treat missing optional arrays as coverage', () => {
    const item = makeItem();
    const gaps = findGaps([item]);
    expect(gaps.find((gap) => gap.id === 'occasion-work')?.severity).toBe('critical');
    expect(gaps.find((gap) => gap.id === 'weather-cold')?.count).toBe(0);
    expect(gaps).toContainEqual(
      expect.objectContaining({ id: 'category-tops', severity: 'notice', count: 1 }),
    );
  });

  it('flags a category with a single piece as thin, not missing', () => {
    const gaps = findGaps([makeItem({ category: 'shoes', name: 'Trainers' })]);
    const shoes = gaps.find((gap) => gap.id === 'category-shoes');
    expect(shoes?.severity).toBe('notice');
    expect(shoes?.detail).toContain('Only one pair of shoes');
    expect(gaps.find((gap) => gap.id === 'category-tops')?.severity).toBe('critical');
  });

  it('respects a custom minimum for thin categories', () => {
    const gaps = findGaps([makeItem(), makeItem({ id: 'second', name: 'Second top' })], {
      minimumPerCategory: 3,
    });
    expect(gaps.find((gap) => gap.id === 'category-tops')?.severity).toBe('notice');
    expect(findGaps([makeItem(), makeItem({ id: 'second' })], { minimumPerCategory: 2 }).some(
      (gap) => gap.id === 'category-tops',
    )).toBe(false);
  });

  it('reports no critical gaps for a wardrobe that covers every category, occasion and formality', () => {
    const gaps = findGaps(completeWardrobe());
    expect(gaps.filter((gap) => gap.severity === 'critical')).toEqual([]);
    expect(gaps.some((gap) => gap.kind === 'weather')).toBe(false);
    expect(gaps.some((gap) => gap.kind === 'season')).toBe(false);
  });

  it('sorts critical gaps ahead of notices and counts upward within a severity', () => {
    const gaps = findGaps([makeItem({ occasions: ['work'] })]);
    const severities = gaps.map((gap) => gap.severity);
    const firstNotice = severities.indexOf('notice');
    expect(severities.slice(firstNotice).every((severity) => severity === 'notice')).toBe(true);
  });
});

describe('coverageSummary', () => {
  it('lists every catalogue value, including zero counts', () => {
    const summary = coverageSummary([makeItem({ category: 'shoes' })]);
    expect(summary.byCategory).toHaveLength(CATEGORIES.length);
    expect(summary.byCategory.find((row) => row.label === 'shoes')?.count).toBe(1);
    expect(summary.byCategory.find((row) => row.label === 'dresses')?.count).toBe(0);
    expect(summary.byWeather).toHaveLength(WEATHER.length);
    expect(coverageSummary([]).byOccasion.every((row) => row.count === 0)).toBe(true);
  });
});
