import { describe, expect, it } from 'vitest';
import { activeFilterCount, filterItems, itemSearchText, tagIndex, toggleValue } from './filter';
import type { WardrobeItem } from './schema';

const makeItem = (overrides: Partial<WardrobeItem> = {}): WardrobeItem => ({
  id: 'item-1',
  name: 'Oxford shirt',
  category: 'tops',
  color: 'ecru',
  material: 'cotton oxford',
  formality: 'smart-casual',
  ...overrides,
});

const shirt = makeItem({
  id: 'shirt',
  name: 'Oxford shirt',
  color: 'ecru',
  material: 'cotton oxford',
  fitNotes: 'Boxy, sleeves run long',
  occasions: ['work', 'weekend'],
  weather: ['mild', 'cool'],
  seasons: ['spring'],
  moods: ['classic'],
  tags: ['desk-uniform'],
});

const jeans = makeItem({
  id: 'jeans',
  name: 'Straight-leg jeans',
  category: 'bottoms',
  color: 'indigo wash',
  material: 'cotton denim',
  formality: 'casual',
  occasions: ['weekend'],
  weather: ['mild'],
  tags: ['everyday'],
});

const coat = makeItem({
  id: 'coat',
  name: 'Wool overcoat',
  category: 'outerwear',
  color: 'camel',
  material: 'wool',
  formality: 'formal',
  occasions: ['formal'],
  weather: ['cold'],
  moods: ['sharp'],
});

const bare = makeItem({ id: 'bare', name: 'Unlogged scarf', category: 'accessories', color: 'oxblood', material: 'silk' });

describe('filterItems', () => {
  it('returns an empty list for an empty collection', () => {
    expect(filterItems([], {})).toEqual([]);
    expect(filterItems([], { query: 'anything', categories: ['tops'] })).toEqual([]);
  });

  it('returns everything when the query is blank', () => {
    expect(filterItems([shirt, jeans], {})).toEqual([shirt, jeans]);
    expect(filterItems([shirt, jeans], { query: '   ' })).toEqual([shirt, jeans]);
  });

  it('matches search across name, colour, material, fit notes, tags and facets', () => {
    const items = [shirt, jeans, coat];
    expect(filterItems(items, { query: 'jeans' }).map((item) => item.id)).toEqual(['jeans']);
    expect(filterItems(items, { query: 'indigo' }).map((item) => item.id)).toEqual(['jeans']);
    expect(filterItems(items, { query: 'oxford cotton' }).map((item) => item.id)).toEqual(['shirt']);
    expect(filterItems(items, { query: 'sleeves run long' }).map((item) => item.id)).toEqual(['shirt']);
    expect(filterItems(items, { query: 'desk-uniform' }).map((item) => item.id)).toEqual(['shirt']);
    expect(filterItems(items, { query: 'outerwear' }).map((item) => item.id)).toEqual(['coat']);
    expect(filterItems(items, { query: 'formal' }).map((item) => item.id)).toEqual(['coat']);
    expect(filterItems(items, { query: 'sharp' }).map((item) => item.id)).toEqual(['coat']);
  });

  it('ignores case and accents', () => {
    const item = makeItem({ name: 'Café shirt', color: 'Bleu de travail' });
    expect(filterItems([item], { query: 'cafe' })).toHaveLength(1);
    expect(filterItems([item], { query: 'BLEU' })).toHaveLength(1);
  });

  it('requires every search token to match', () => {
    expect(filterItems([shirt], { query: 'oxford camel' })).toEqual([]);
    expect(filterItems([shirt], { query: 'oxford ecru' })).toHaveLength(1);
  });

  it('treats missing optional fields as empty instead of throwing', () => {
    expect(() => filterItems([bare], { query: 'silk' })).not.toThrow();
    expect(itemSearchText(bare)).toContain('silk');
    expect(filterItems([bare], { occasions: ['work'] })).toEqual([]);
    expect(filterItems([bare], { weather: ['cold'] })).toEqual([]);
    expect(filterItems([bare], { moods: ['cozy'] })).toEqual([]);
    expect(filterItems([bare], { tags: ['everyday'] })).toEqual([]);
    expect(filterItems([bare], { seasons: ['winter'] })).toEqual([]);
  });

  it('ORs options inside a facet and ANDs across facets', () => {
    const items = [shirt, jeans, coat];
    expect(filterItems(items, { categories: ['bottoms', 'outerwear'] }).map((item) => item.id)).toEqual([
      'jeans',
      'coat',
    ]);
    expect(
      filterItems(items, { categories: ['tops', 'bottoms'], occasions: ['weekend'] }).map((item) => item.id),
    ).toEqual(['shirt', 'jeans']);
    expect(filterItems(items, { categories: ['outerwear'], occasions: ['weekend'] })).toEqual([]);
    expect(filterItems(items, { weather: ['cold'], formality: ['formal'] })).toEqual([coat]);
  });

  it('supports the unworn-only rotation filter', () => {
    const worn = makeItem({ id: 'worn', wearLog: ['2026-01-02'] });
    const never = makeItem({ id: 'never' });
    const malformed = makeItem({ id: 'malformed', wearLog: ['not-a-date'] });
    expect(filterItems([worn, never, malformed], { unwornOnly: true }).map((item) => item.id)).toEqual([
      'never',
      'malformed',
    ]);
  });

  it('counts active narrowing choices', () => {
    expect(activeFilterCount({})).toBe(0);
    expect(activeFilterCount({ query: '  ' })).toBe(0);
    expect(activeFilterCount({ query: 'shirt', categories: ['tops'], weather: ['cold', 'wet'], unwornOnly: true })).toBe(5);
  });

  it('toggleValue adds and removes without mutating the input', () => {
    const selected = ['tops'] as const;
    const added = toggleValue(selected, 'shoes');
    expect(added).toEqual(['tops', 'shoes']);
    expect(toggleValue(added, 'tops')).toEqual(['shoes']);
    expect(selected).toEqual(['tops']);
    expect(toggleValue(undefined, 'tops')).toEqual(['tops']);
  });
});

describe('tagIndex', () => {
  it('counts outfit tags and sorts by use then alphabetically', () => {
    const tagged = [
      makeItem({ id: 'a', tags: ['winter-evening', 'desk'] }),
      makeItem({ id: 'b', tags: ['winter-evening', 'weekend'] }),
      makeItem({ id: 'c', tags: ['desk'] }),
      makeItem({ id: 'd' }),
    ];
    expect(tagIndex(tagged)).toEqual([
      { tag: 'desk', count: 2 },
      { tag: 'winter-evening', count: 2 },
      { tag: 'weekend', count: 1 },
    ]);
    expect(tagIndex([])).toEqual([]);
  });
});
