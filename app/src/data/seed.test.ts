import { describe, expect, it } from 'vitest';
import { EXAMPLE_ITEMS } from './seed';
import { validateWardrobeFile } from '../domain/validate';
import { filterItems } from '../domain/filter';
import { rotationQueue } from '../domain/wear';

describe('example catalogue', () => {
  it('matches the schema and uses unique ids', () => {
    const result = validateWardrobeFile({ items: EXAMPLE_ITEMS });
    expect(result.issues).toEqual([]);
    expect(result.skipped).toBe(0);
    expect(result.items).toHaveLength(EXAMPLE_ITEMS.length);
    expect(new Set(EXAMPLE_ITEMS.map((item) => item.id)).size).toBe(EXAMPLE_ITEMS.length);
  });

  it('covers every category so the shelf never starts blank', () => {
    const categories = new Set(EXAMPLE_ITEMS.map((item) => item.category));
    expect([...categories].sort()).toEqual([
      'accessories',
      'bottoms',
      'dresses',
      'outerwear',
      'shoes',
      'tops',
    ]);
  });

  it("is labelled as samples, never as the owner's clothes", () => {
    expect(EXAMPLE_ITEMS.every((item) => item.example === true)).toBe(true);
  });

  it('produces usable filter and rotation results', () => {
    expect(filterItems(EXAMPLE_ITEMS, { occasions: ['formal'] }).length).toBeGreaterThan(0);
    expect(filterItems(EXAMPLE_ITEMS, { weather: ['wet'] }).length).toBeGreaterThan(0);
    expect(filterItems(EXAMPLE_ITEMS, { query: 'linen' })).toHaveLength(1);
    expect(rotationQueue(EXAMPLE_ITEMS, { limit: 3 })).toHaveLength(3);
  });
});
