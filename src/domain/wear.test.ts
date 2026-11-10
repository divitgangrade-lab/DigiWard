import { describe, expect, it } from 'vitest';
import {
  collectionWearStats,
  compareForRotation,
  recentWears,
  rotationQueue,
  summarizeWear,
  wearDates,
  withWearLogged,
  withWearRemoved,
} from './wear';
import type { WardrobeItem } from './schema';

const today = new Date(2026, 10, 10); // 10 November 2026, local time.

const makeItem = (overrides: Partial<WardrobeItem> = {}): WardrobeItem => ({
  id: 'item-1',
  name: 'Oxford shirt',
  category: 'tops',
  color: 'ecru',
  material: 'cotton oxford',
  formality: 'smart-casual',
  ...overrides,
});

describe('rotationQueue', () => {
  it('returns an empty queue for an empty collection', () => {
    expect(rotationQueue([], { today })).toEqual([]);
    expect(recentWears([], { today })).toEqual([]);
    expect(collectionWearStats([], { today })).toEqual({
      itemCount: 0,
      totalWears: 0,
      wornInWindow: 0,
      neverWorn: 0,
      wearPerItem: 0,
      lastWorn: null,
    });
  });

  it('treats a missing wear log as never worn and sorts it first', () => {
    const fresh = makeItem({ id: 'fresh', name: 'Never worn' });
    const worn = makeItem({ id: 'worn', name: 'Often worn', wearLog: ['2026-11-08', '2026-11-09'] });
    const summary = summarizeWear(fresh, { today });
    expect(summary.totalWears).toBe(0);
    expect(summary.lastWorn).toBeNull();
    expect(summary.daysSinceLastWorn).toBeNull();
    expect(rotationQueue([worn, fresh], { today }).map((entry) => entry.item.id)).toEqual(['fresh', 'worn']);
  });

  it('breaks equal wear counts with the longest gap since last wear', () => {
    const older = makeItem({ id: 'older', name: 'Older wear', wearLog: ['2026-10-01'] });
    const recent = makeItem({ id: 'recent', name: 'Recent wear', wearLog: ['2026-11-05'] });
    const queue = rotationQueue([recent, older], { today });
    expect(queue.map((entry) => entry.item.id)).toEqual(['older', 'recent']);
    expect(queue[0]?.daysSinceLastWorn).toBe(40);
    expect(queue[1]?.daysSinceLastWorn).toBe(5);
  });

  it('falls back to name and then id when wear counts and dates tie', () => {
    const zebra = makeItem({ id: 'z', name: 'Zebra coat', category: 'outerwear' });
    const anchor = makeItem({ id: 'a', name: 'Anchor coat', category: 'outerwear' });
    const alphaSameName = makeItem({ id: 'a2', name: 'Anchor coat', category: 'outerwear' });
    const queue = rotationQueue([zebra, anchor, alphaSameName], { today });
    expect(queue.map((entry) => entry.item.id)).toEqual(['a', 'a2', 'z']);
  });

  it('ignores invalid and duplicate wear dates', () => {
    const item = makeItem({
      wearLog: ['2026-11-01', '2026-11-01', '2026-02-31', 'sometime', '2026-11-05'],
    });
    expect(wearDates(item)).toEqual(['2026-11-05', '2026-11-01']);
    expect(summarizeWear(item, { today }).totalWears).toBe(2);
  });

  it('counts only wears inside the window', () => {
    const item = makeItem({ wearLog: ['2026-08-01', '2026-10-20', '2026-11-09'] });
    const summary = summarizeWear(item, { today, windowDays: 30 });
    expect(summary.totalWears).toBe(3);
    expect(summary.wearsInWindow).toBe(2);
  });

  it('supports a category filter and a limit', () => {
    const top = makeItem({ id: 'top' });
    const shoe = makeItem({ id: 'shoe', category: 'shoes', name: 'Trainers' });
    expect(rotationQueue([top, shoe], { today, category: 'shoes' }).map((entry) => entry.item.id)).toEqual([
      'shoe',
    ]);
    expect(rotationQueue([top, shoe], { today, limit: 1 })).toHaveLength(1);
    expect(rotationQueue([top, shoe], { today, limit: 0 })).toEqual([]);
  });

  it('can be sorted against a comparator directly', () => {
    const a = summarizeWear(makeItem({ id: 'a', wearLog: ['2026-11-01'] }), { today });
    const b = summarizeWear(makeItem({ id: 'b', wearLog: ['2026-11-09'] }), { today });
    expect(compareForRotation(a, b)).toBeLessThan(0);
    expect(compareForRotation(b, a)).toBeGreaterThan(0);
  });
});

describe('recentWears', () => {
  it('flattens the log newest first and skips invalid or future dates', () => {
    const shirt = makeItem({ id: 'shirt', name: 'Shirt', wearLog: ['2026-11-01', '2026-11-08'] });
    const coat = makeItem({ id: 'coat', name: 'Coat', wearLog: ['2026-11-08', 'garbage', '2027-01-01'] });
    const entries = recentWears([shirt, coat], { today });
    expect(entries.map((entry) => `${entry.date}:${entry.item.id}`)).toEqual([
      '2026-11-08:coat',
      '2026-11-08:shirt',
      '2026-11-01:shirt',
    ]);
    expect(entries.at(-1)?.daysAgo).toBe(9);
    expect(recentWears([shirt, coat], { today, limit: 1 })).toHaveLength(1);
  });
});

describe('collectionWearStats', () => {
  it('summarises coverage across the wardrobe', () => {
    const items = [
      makeItem({ id: 'a', wearLog: ['2026-11-09', '2026-11-01'] }),
      makeItem({ id: 'b', wearLog: ['2026-07-01'] }),
      makeItem({ id: 'c' }),
    ];
    expect(collectionWearStats(items, { today })).toEqual({
      itemCount: 3,
      totalWears: 3,
      wornInWindow: 1,
      neverWorn: 1,
      wearPerItem: 1,
      lastWorn: '2026-11-09',
    });
  });
});

describe('wear logging', () => {
  it('adds a date once and keeps the log newest first', () => {
    const item = makeItem({ wearLog: ['2026-11-01'] });
    const logged = withWearLogged(item, '2026-11-10');
    expect(logged.wearLog).toEqual(['2026-11-10', '2026-11-01']);
    expect(withWearLogged(logged, '2026-11-10').wearLog).toEqual(['2026-11-10', '2026-11-01']);
    expect(item.wearLog).toEqual(['2026-11-01']);
  });

  it('ignores an invalid date', () => {
    const item = makeItem();
    expect(withWearLogged(item, '2026-02-31')).toBe(item);
  });

  it('removes a date without disturbing the rest', () => {
    const item = makeItem({ wearLog: ['2026-11-10', '2026-11-01', '2026-10-01'] });
    expect(withWearRemoved(item, '2026-11-01').wearLog).toEqual(['2026-11-10', '2026-10-01']);
  });
});
