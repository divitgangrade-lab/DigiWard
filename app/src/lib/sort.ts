import type { WardrobeItem } from '../domain/schema';
import { compareForRotation, summarizeWear, type WearSummary } from '../domain/wear';

export type SortMode = 'recent' | 'least-worn' | 'name';

export const SORT_MODES: readonly { value: SortMode; label: string }[] = [
  { value: 'recent', label: 'Recently worn' },
  { value: 'least-worn', label: 'Least worn first' },
  { value: 'name', label: 'Name A to Z' },
];

const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

const summaryFor = (
  item: WardrobeItem,
  summaries: ReadonlyMap<string, WearSummary>,
  today: Date,
): WearSummary => summaries.get(item.id) ?? summarizeWear(item, { today });

/** Sorting never mutates the filtered list. */
export const sortItems = (
  items: readonly WardrobeItem[],
  mode: SortMode,
  summaries: ReadonlyMap<string, WearSummary>,
  today: Date,
): WardrobeItem[] => {
  const list = [...items];

  if (mode === 'name') {
    return list.sort((a, b) => collator.compare(a.name, b.name));
  }

  if (mode === 'least-worn') {
    return list.sort((a, b) =>
      compareForRotation(summaryFor(a, summaries, today), summaryFor(b, summaries, today)),
    );
  }

  return list.sort((a, b) => {
    const aDays = summaryFor(a, summaries, today).daysSinceLastWorn ?? Number.POSITIVE_INFINITY;
    const bDays = summaryFor(b, summaries, today).daysSinceLastWorn ?? Number.POSITIVE_INFINITY;
    if (aDays !== bDays) return aDays - bDays;
    return collator.compare(a.name, b.name);
  });
};
