import type { WardrobeItem } from '../domain/schema';
import { daysBetween, parseDay, startOfDay } from '../lib/date';

export const DEFAULT_WEAR_WINDOW_DAYS = 30;

export interface WearSummary {
  item: WardrobeItem;
  /** Valid, de-duplicated wear dates, newest first. */
  dates: string[];
  totalWears: number;
  wearsInWindow: number;
  lastWorn: string | null;
  daysSinceLastWorn: number | null;
}

export interface RotationOptions {
  today?: Date;
  windowDays?: number;
  limit?: number;
  category?: WardrobeItem['category'];
}

const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

/** Valid wear dates, de-duplicated and sorted newest first. */
export const wearDates = (item: WardrobeItem): string[] => {
  const seen = new Set<string>();
  const entries: { key: string; time: number }[] = [];
  for (const candidate of item.wearLog ?? []) {
    const time = parseDay(candidate);
    if (time === null) continue;
    const key = candidate.trim();
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push({ key, time });
  }
  entries.sort((a, b) => b.time - a.time);
  return entries.map((entry) => entry.key);
};

export const summarizeWear = (
  item: WardrobeItem,
  options: { today?: Date; windowDays?: number } = {},
): WearSummary => {
  const today = options.today ?? new Date();
  const windowDays = options.windowDays ?? DEFAULT_WEAR_WINDOW_DAYS;
  const todayStamp = startOfDay(today);
  const dates = wearDates(item);

  let wearsInWindow = 0;
  for (const date of dates) {
    const time = parseDay(date);
    if (time === null) continue;
    const age = daysBetween(time, todayStamp);
    if (age >= 0 && age < windowDays) wearsInWindow += 1;
  }

  const lastWorn = dates[0] ?? null;
  const lastTime = lastWorn === null ? null : parseDay(lastWorn);
  const daysSinceLastWorn =
    lastTime === null ? null : Math.max(0, daysBetween(lastTime, todayStamp));

  return { item, dates, totalWears: dates.length, wearsInWindow, lastWorn, daysSinceLastWorn };
};

/**
 * Rotation order: least worn first, then longest since last worn, then name.
 * Never-worn pieces sort ahead of everything and ties resolve alphabetically
 * before falling back to the id, so the queue is stable between renders.
 */
export const compareForRotation = (a: WearSummary, b: WearSummary): number => {
  if (a.wearsInWindow !== b.wearsInWindow) return a.wearsInWindow - b.wearsInWindow;
  if (a.totalWears !== b.totalWears) return a.totalWears - b.totalWears;
  const aDays = a.daysSinceLastWorn ?? Number.POSITIVE_INFINITY;
  const bDays = b.daysSinceLastWorn ?? Number.POSITIVE_INFINITY;
  if (aDays !== bDays) return bDays - aDays;
  const byName = collator.compare(a.item.name, b.item.name);
  if (byName !== 0) return byName;
  return collator.compare(a.item.id, b.item.id);
};

/** Items to reach for next, least-worn first. */
export const rotationQueue = (
  items: readonly WardrobeItem[],
  options: RotationOptions = {},
): WearSummary[] => {
  const summaries = items
    .filter((item) => (options.category ? item.category === options.category : true))
    .map((item) => summarizeWear(item, options));
  summaries.sort(compareForRotation);
  return options.limit === undefined ? summaries : summaries.slice(0, Math.max(0, options.limit));
};

export interface WearEntry {
  item: WardrobeItem;
  date: string;
  daysAgo: number;
}

/** Flattened wear history across the catalogue, newest first. */
export const recentWears = (
  items: readonly WardrobeItem[],
  options: { today?: Date; limit?: number } = {},
): WearEntry[] => {
  const today = startOfDay(options.today ?? new Date());
  const entries: WearEntry[] = [];
  for (const item of items) {
    for (const date of wearDates(item)) {
      const time = parseDay(date);
      if (time === null) continue;
      const daysAgo = daysBetween(time, today);
      if (daysAgo < 0) continue;
      entries.push({ item, date, daysAgo });
    }
  }
  entries.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return collator.compare(a.item.name, b.item.name);
  });
  return options.limit === undefined ? entries : entries.slice(0, Math.max(0, options.limit));
};

export interface CollectionWearStats {
  itemCount: number;
  totalWears: number;
  wornInWindow: number;
  neverWorn: number;
  wearPerItem: number;
  lastWorn: string | null;
}

export const collectionWearStats = (
  items: readonly WardrobeItem[],
  options: { today?: Date; windowDays?: number } = {},
): CollectionWearStats => {
  const summaries = items.map((item) => summarizeWear(item, options));
  const wornInWindow = summaries.filter((summary) => summary.wearsInWindow > 0).length;
  const neverWorn = summaries.filter((summary) => summary.totalWears === 0).length;
  const totalWears = summaries.reduce((sum, summary) => sum + summary.totalWears, 0);
  const lastWorn = summaries
    .map((summary) => summary.lastWorn)
    .filter((value): value is string => value !== null)
    .sort()
    .at(-1) ?? null;

  return {
    itemCount: summaries.length,
    totalWears,
    wornInWindow,
    neverWorn,
    wearPerItem: summaries.length === 0 ? 0 : Math.round((totalWears / summaries.length) * 10) / 10,
    lastWorn,
  };
};

/**
 * Returns a copy of the item with a wear date added. Dates are de-duplicated,
 * so logging the same day twice keeps one entry. Invalid input leaves the item
 * untouched.
 */
export const withWearLogged = (item: WardrobeItem, date: string): WardrobeItem => {
  if (parseDay(date) === null) return item;
  const existing = wearDates(item);
  if (existing.includes(date)) return { ...item, wearLog: existing };
  return { ...item, wearLog: wearDates({ ...item, wearLog: [...existing, date] }) };
};

export const withWearRemoved = (item: WardrobeItem, date: string): WardrobeItem => ({
  ...item,
  wearLog: wearDates(item).filter((entry) => entry !== date),
});
